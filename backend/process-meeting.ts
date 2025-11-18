import { getMeetingOffers, findFriendIdToOffer, findRecentOffer, setOfferExpired, createOffer } from './offer.js';
import { setMeetingState, getUserFromMeeting } from './meeting.js';
import { ACCEPTED_OFFER_STATE, EXPIRED_OFFER_STATE, isTimePast, minutesBetween, minutesSince, minutesUntil, OPEN_OFFER_STATE, PAST_MEETING_STATE, REJECTED_MEETING_STATE, REJECTED_OFFER_STATE } from './utils.js';
import { findUnofferedFriends, getFriendIds } from './friendship.js';
import type { Meeting, Offer, User } from '../types.js';
import { createAndSendOfferPush } from './create-push.js';


const meetingWithinDay = async ({scheduledFor}: {scheduledFor: Date}): Promise<Boolean> => {
    const now = new Date();
    const oneDayFromNow = new Date(now.getTime() + (24 * 60 * 60 * 1000));
    return ( scheduledFor > now && scheduledFor <= oneDayFromNow);

}


const getUnofferedFriendsFromMeeting = async ({meeting, offers, friendIds}:
    {meeting: Meeting; offers: Offer[]; friendIds: string[]}): Promise<string[]> => {
    const userFrom = meeting.userFromId;
    if (!userFrom) {
        throw new Error('User not found for meeting');
    }
    // const offeredFriends = offers.reduce(
    //     (friendsOffered: User[], offer: Offer) => {
    //         const userOfferedId = offer.userOfferedId.toString()
    //             return [...friendsOffered, userOfferedId]
    //         },
    //     []
    // );
    const offeredFriends = offers.map((offer: Offer): string => offer.userOfferedId.toString());
    const unOfferedFriendIds = findUnofferedFriends(offeredFriends, friendIds);
    return unOfferedFriendIds;
}


export const processOfferForNewMeeting = async (meeting: Meeting): Promise<Meeting> => {
    const meetingId = meeting.id;
    const scheduledFor = meeting.scheduledFor;
    const isWithinDay = await meetingWithinDay({ scheduledFor });
    const allFriendIds = await getFriendIds(meeting.userFromId);
    const newFriendToOfferId = await findFriendIdToOffer({offers: [], meetingId, allFriendIds});
    const [newMeeting, offer] = await makeOfferForNewMeeting({meeting, userOfferedId: newFriendToOfferId});

    createAndSendOfferPush({ offer });

    return newMeeting;
}


export const makeOfferForNewMeeting = async ({meeting, userOfferedId}:
    {meeting: Meeting; userOfferedId: string}): Promise<[Meeting, Offer]> => {
    const meetingId = meeting.id;
    const newOffer = await createOffer({meetingId, userOfferedId});
    return [meeting, newOffer];
}


const processPastMeeting = async({meeting}: {meeting: Meeting}): Promise<Meeting> => {
    const newMeeting = await setMeetingState({meetingId: meeting.id, meetingState: PAST_MEETING_STATE});
    return newMeeting;
}


const triggerNewOffer = async ({meetingId, recentOfferId, newUserOfferId}:
    {meetingId: string; recentOfferId: string; newUserOfferId: string;}) => {
    const expiredOffer = await setOfferExpired({offerId: recentOfferId});
    const newOffer = await createOffer({meetingId, userOfferedId: newUserOfferId})
    return [expiredOffer, newOffer];
};



const determineNeedNewOffer = async ({remainingFriendCount, offerCreatedAt, meetingTime}:
     {remainingFriendCount: number; offerCreatedAt: Date; meetingTime: Date}) => {
    const totalDuration =  await minutesBetween({earlierTime: offerCreatedAt, laterTime: meetingTime});
    const totalFriends = remainingFriendCount + 1;
    const timeWindow = totalDuration/totalFriends;

    const timeElapsed = await minutesSince({eventTime: offerCreatedAt});

    return timeElapsed > timeWindow;
};



export const processOffersForMeeting = async (meeting: Meeting) => {
    const meetingInPast = await isTimePast({eventTime: meeting.scheduledFor});
    if (meetingInPast) {
        return await processPastMeeting({meeting});   
    }

    const meetingId = meeting.id;
    const userFrom = meeting.userFromId;
    const offers = await getMeetingOffers({meetingId})
    const allFriendIds = await getFriendIds(userFrom);
    const newFriendToOfferId = await findFriendIdToOffer({offers, meetingId, allFriendIds})
    // no more friends left, nothing to do.
    if (!newFriendToOfferId) {
        return meeting;     
    }

    const recentOffer = await findRecentOffer(offers);
    if (!recentOffer) {
            // no past offers, treat as new Meeting.
        const newMeeting = await makeOfferForNewMeeting({meeting, userOfferedId: newFriendToOfferId})
        return newMeeting;
    }

    if (recentOffer.offerState === OPEN_OFFER_STATE) {
        const unOfferedFriendIds = await getUnofferedFriendsFromMeeting(
            {meeting, offers, friendIds: allFriendIds}
        );
        
        const needNewOffer = await determineNeedNewOffer({
            remainingFriendCount: unOfferedFriendIds.length,
            offerCreatedAt: recentOffer.createdAt,
            meetingTime: meeting.scheduledFor
        });

        if (needNewOffer) {
            const [expiredOffer, newOffer] = await triggerNewOffer({
                meetingId,
                recentOfferId: recentOffer.id,
                newUserOfferId: newFriendToOfferId
            });
            return meeting;
        } else {
            // leave as is!!!
        }

    } else if (recentOffer.offerState === ACCEPTED_OFFER_STATE) {
        console.log("CASE: Most recent offer is ACCEPTED (error state)", recentOffer.id)
    } else if (recentOffer.offerState === REJECTED_OFFER_STATE) {
        console.log("CASE: Most recent offer is REJECTED (error state)", recentOffer.id)

    } else if (recentOffer.offerState === EXPIRED_OFFER_STATE) {
        console.log("CASE: Most recent offer is EXPIRED (error state)", recentOffer.id)

    }
    return meeting;
}
