import { getMeetingOffers, findFriendIdToOffer, findRecentOffer, setOfferExpired, createOffer, getIsOfferExpired } from './offer.js';
import { setMeetingState } from './update/meeting-update.js';
import { ACCEPTED_MEETING_STATE, ACCEPTED_OFFER_STATE, addHour, EXPIRED_OFFER_STATE, isTimePast, minutesBetween, minutesSince, minutesUntil, OPEN_OFFER_STATE, PAST_MEETING_STATE, REJECTED_MEETING_STATE, REJECTED_OFFER_STATE } from './utils.js';
import { findUnofferedFriends, getFriendIds, getUnofferedFriendsFromMeeting } from './friendship.js';
import type { Meeting, MeetingType, Offer } from '../types.js';
import { createAndSendOfferPush } from './create-push.js';




export const processOfferForNewMeeting = async (meeting: Meeting): Promise<Meeting> => {
    const meetingId = meeting.id;
    const allFriendIds = await getFriendIds(meeting.userFromId);
    const {friendToOfferId, unOfferedCount} = await findFriendIdToOffer({offers: [], meetingId, allFriendIds});
    
    if (friendToOfferId) {
        const offer = await makeAdvanceOffer({meeting, userOfferedId: friendToOfferId});

    }

    return meeting;
}

const determineOfferExpiration = async ({remainingFriendCount, previousTimeMarker, meetingTime}:
    {remainingFriendCount: number; previousTimeMarker: Date; meetingTime: Date}): Promise<Date> => {

   const totalDuration =  await minutesBetween({earlierTime: previousTimeMarker, laterTime: meetingTime});
   const totalFriends = remainingFriendCount;
   const timeWindow = totalDuration/totalFriends;
  // const expiresAt = previousTimeMarker + timeWindow
   //const timeElapsed = await minutesSince({eventTime: previousTimeMarker});

   return new Date();
};

export const makeBroadcastOffer = async({meeting, userOfferedId}:
    {meeting: Meeting; userOfferedId: string
    }): Promise<Offer | undefined> => {
        const expiresAt = addHour(new Date());
        const offer = await makeOffer({meeting, userOfferedId, expiresAt, offerType: 'BROADCAST'});
        return offer;
    }




export const makeAdvanceOffer = async ({meeting, userOfferedId }:
    {meeting: Meeting; userOfferedId: string}): Promise<Offer | undefined> => {
    const expiresAt = addHour(new Date());
    const offer = await makeOffer({meeting, userOfferedId, expiresAt, offerType: 'ADVANCE'});
    return offer;
}


const makeOfferAfterExpired = async ({meeting, recentOfferId, newUserOfferId}:
    {meeting: Meeting; recentOfferId: string; newUserOfferId: string;}) => {
    const expiredOffer = await setOfferExpired({offerId: recentOfferId});
    const expiresAt = addHour(new Date());
    const newOffer = await makeOffer({meeting, userOfferedId: newUserOfferId, expiresAt, offerType: 'ADVANCE'})
    return [expiredOffer, newOffer];
};

export const makeOffer = async ({meeting, userOfferedId, expiresAt, offerType}:
    {meeting: Meeting; userOfferedId: string, expiresAt: Date, offerType: MeetingType
    }): Promise<Offer | undefined> => {
    const meetingId = meeting.id
    const offer = await createOffer({meetingId, userOfferedId, expiresAt, offerType});
    console.log("New Offer", offer)
    if (offer) {
        createAndSendOfferPush({ offer });
    }
    return offer;
}

export const processOffersForMeeting = async (meeting: Meeting) => {
    const meetingId = meeting.id;
    const userFrom = meeting.userFromId;
    
    const meetingInPast = await isTimePast({eventTime: meeting.scheduledFor});
    if (meetingInPast) {
        return await setMeetingState({meetingId, meetingState: PAST_MEETING_STATE});
    }

    const offers = await getMeetingOffers({meetingId})
    const allFriendIds = await getFriendIds(userFrom);
    const {friendToOfferId, unOfferedCount} = await findFriendIdToOffer({offers, meetingId, allFriendIds})
 
    // no more friends left, nothing to do.
    if (!friendToOfferId) return meeting;
    
    const recentOffer = findRecentOffer(offers);

    if (!recentOffer) {
        const newMeeting = await makeAdvanceOffer({meeting, userOfferedId: friendToOfferId})
        return newMeeting;
    }

    if (recentOffer.offerState === OPEN_OFFER_STATE) {
        const isExpired = await getIsOfferExpired({offer: recentOffer});
        if (isExpired) {
            await makeOfferAfterExpired({
                meeting,
                recentOfferId: recentOffer.id,
                newUserOfferId: friendToOfferId
            });
        }
    } else if (recentOffer.offerState === REJECTED_OFFER_STATE) {
        if (!friendToOfferId) {
            // No more friends to offer to, set meeting state to REJECTED
            console.log("No more friends to offer to, setting meeting to REJECTED");
            await setMeetingState({
                meetingId,
                meetingState: REJECTED_MEETING_STATE
            });
        } else {
            const offer = await makeAdvanceOffer({meeting, userOfferedId: friendToOfferId})
        }
    } else if (recentOffer.offerState === ACCEPTED_OFFER_STATE) {
        await setMeetingState({
            meetingId,
            meetingState: ACCEPTED_MEETING_STATE
        });
    } else if (recentOffer.offerState === EXPIRED_OFFER_STATE) {
        await makeOfferAfterExpired({
            meeting,
            recentOfferId: recentOffer.id,
            newUserOfferId: friendToOfferId
        });
    }
    return meeting;
}
