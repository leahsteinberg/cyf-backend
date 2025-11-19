import { getMeetingOffers, findFriendIdToOffer, findRecentOffer, setOfferExpired, createOffer, getOfferExpired, getIsOfferExpired } from './offer.js';
import { setMeetingState } from './update/meeting-update.js';
import { ACCEPTED_OFFER_STATE, addHour, EXPIRED_OFFER_STATE, isTimePast, minutesBetween, minutesSince, minutesUntil, OPEN_OFFER_STATE, PAST_MEETING_STATE, REJECTED_MEETING_STATE, REJECTED_OFFER_STATE } from './utils.js';
import { findUnofferedFriends, getFriendIds } from './friendship.js';
import type { Meeting, Offer } from '../types.js';
import { createAndSendOfferPush } from './create-push.js';


const getUnofferedFriendsFromMeeting = async ({meeting, offers, friendIds}:
    {meeting: Meeting; offers: Offer[]; friendIds: string[]}): Promise<string[]> => {
    const userFrom = meeting.userFromId;
    if (!userFrom) {
        throw new Error('User not found for meeting');
    }
    const offeredFriends = offers.map((offer: Offer): string => offer.userOfferedId.toString());
    const unOfferedFriendIds = findUnofferedFriends(offeredFriends, friendIds);
    return unOfferedFriendIds;
}


export const processOfferForNewMeeting = async (meeting: Meeting): Promise<Meeting> => {
    const meetingId = meeting.id;
    const allFriendIds = await getFriendIds(meeting.userFromId);
    const newFriendToOfferId = await findFriendIdToOffer({offers: [], meetingId, allFriendIds});
    if (newFriendToOfferId) {
        const offer = await makeOffer({meetingId, userOfferedId: newFriendToOfferId});
        createAndSendOfferPush({ offer });
    }


    return meeting;
}


export const makeOffer = async ({meetingId, userOfferedId}:
    {meetingId: string; userOfferedId: string}): Promise<Offer> => {
    const expiresAt = addHour(new Date());
    const newOffer = await createOffer({meetingId: meetingId, userOfferedId, expiresAt});
    console.log("New Offer", newOffer)
    return newOffer;
}

const makeOfferAfterExpired = async ({meetingId, recentOfferId, newUserOfferId}:
    {meetingId: string; recentOfferId: string; newUserOfferId: string;}) => {
    const expiredOffer = await setOfferExpired({offerId: recentOfferId});
    const newOffer = await makeOffer({meetingId, userOfferedId: newUserOfferId})
    return [expiredOffer, newOffer];
};


const processPastMeeting = async({meeting}: {meeting: Meeting}): Promise<Meeting> => {
    const newMeeting = await setMeetingState({meetingId: meeting.id, meetingState: PAST_MEETING_STATE});
    return newMeeting;
}

const determineNeedNewOffer = async ({remainingFriendCount, offerCreatedAt, meetingTime}:
     {remainingFriendCount: number; offerCreatedAt: Date; meetingTime: Date}) => {
    const totalDuration =  await minutesBetween({earlierTime: offerCreatedAt, laterTime: meetingTime});
    const totalFriends = remainingFriendCount + 1;
    const timeWindow = totalDuration/totalFriends;

    const timeElapsed = await minutesSince({eventTime: offerCreatedAt});

    return timeElapsed > timeWindow;
};


export const processOffersForMeeting = async (meeting: Meeting) => {
    const meetingId = meeting.id;
    const userFrom = meeting.userFromId;
    
    const meetingInPast = await isTimePast({eventTime: meeting.scheduledFor});
    if (meetingInPast) {
        return await processPastMeeting({meeting});   
    }

    const offers = await getMeetingOffers({meetingId})
    const allFriendIds = await getFriendIds(userFrom);
    const newFriendToOfferId = await findFriendIdToOffer({offers, meetingId, allFriendIds})
 
    // no more friends left, nothing to do.
    if (!newFriendToOfferId) return meeting;
    
    const recentOffer = findRecentOffer(offers);

    if (!recentOffer) {
        const newMeeting = await makeOffer({meetingId, userOfferedId: newFriendToOfferId})
        return newMeeting;
    }


    if (recentOffer.offerState === OPEN_OFFER_STATE) {

        const isExpired = await getIsOfferExpired({offer: recentOffer});
        if (isExpired) {
            await makeOfferAfterExpired({
                meetingId,
                recentOfferId: recentOffer.id,
                newUserOfferId: newFriendToOfferId
            });
        }
    }
    return meeting;
}
