import { getMeetingOffers, findFriendIdToOffer, findRecentOffer, setOfferExpired, createOffer, getIsOfferExpired } from './offer.js';
import { setMeetingState } from './update/meeting-update.js';
import { ACCEPTED_OFFER_STATE, addHour, EXPIRED_OFFER_STATE, isTimePast, minutesBetween, minutesSince, minutesUntil, OPEN_OFFER_STATE, PAST_MEETING_STATE, REJECTED_MEETING_STATE, REJECTED_OFFER_STATE } from './utils.js';
import { findUnofferedFriends, getFriendIds, getUnofferedFriendsFromMeeting } from './friendship.js';
import type { Meeting, Offer } from '../types.js';
import { createAndSendOfferPush } from './create-push.js';




export const processOfferForNewMeeting = async (meeting: Meeting): Promise<Meeting> => {
    const meetingId = meeting.id;
    const allFriendIds = await getFriendIds(meeting.userFromId);
    const {friendToOfferId, unOfferedCount} = await findFriendIdToOffer({offers: [], meetingId, allFriendIds});
    
    if (friendToOfferId) {
        const offer = await makeOffer({meeting, userOfferedId: friendToOfferId, unOfferedCount});
        createAndSendOfferPush({ offer });
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


export const makeOffer = async ({meeting, userOfferedId, unOfferedCount}:
    {meeting: Meeting; userOfferedId: string, unOfferedCount: number
    }): Promise<Offer> => {
    const meetingId = meeting.id
    //const expiresAt = addHour(new Date());
    //const remainingFriendCount = await getUnofferedFriendsFromMeeting({meeting});
    const expiresAt = await determineOfferExpiration({remainingFriendCount: unOfferedCount, previousTimeMarker: new Date(), meetingTime: new Date()});
    const newOffer = await createOffer({meetingId, userOfferedId, expiresAt});
    console.log("New Offer", newOffer)
    return newOffer;
}

const makeOfferAfterExpired = async ({meeting, recentOfferId, newUserOfferId}:
    {meeting: Meeting; recentOfferId: string; newUserOfferId: string;}) => {

    const expiredOffer = await setOfferExpired({offerId: recentOfferId});
    const newOffer = await makeOffer({meeting, userOfferedId: newUserOfferId, unOfferedCount: 0})
    return [expiredOffer, newOffer];

};




// const determineNeedNewOffer = async ({remainingFriendCount, offerCreatedAt, meetingTime}:
//      {remainingFriendCount: number; offerCreatedAt: Date; meetingTime: Date}): Promise<boolean> => {


//     const totalDuration =  await minutesBetween({earlierTime: offerCreatedAt, laterTime: meetingTime});
//     const totalFriends = remainingFriendCount + 1;
//     const timeWindow = totalDuration/totalFriends;

//     const timeElapsed = await minutesSince({eventTime: offerCreatedAt});

//     return timeElapsed > timeWindow;
// };




export const processOffersForMeeting = async (meeting: Meeting) => {
    const meetingId = meeting.id;
    const userFrom = meeting.userFromId;
    
    const meetingInPast = await isTimePast({eventTime: meeting.scheduledFor});
    if (meetingInPast) {
        return await setMeetingState({meetingId, meetingState: PAST_MEETING_STATE});
    }

    const offers = await getMeetingOffers({meetingId})
    const allFriendIds = await getFriendIds(userFrom);
    const [newFriendToOfferId, unOfferedCount] = await findFriendIdToOffer({offers, meetingId, allFriendIds})
 
    // no more friends left, nothing to do.
    if (!newFriendToOfferId) return meeting;
    
    const recentOffer = findRecentOffer(offers);

    if (!recentOffer) {
        const newMeeting = await makeOffer({meeting, userOfferedId: newFriendToOfferId, unOfferedCount: 0})
        return newMeeting;
    }


    if (recentOffer.offerState === OPEN_OFFER_STATE) {

        const isExpired = await getIsOfferExpired({offer: recentOffer});
        if (isExpired) {
            await makeOfferAfterExpired({
                meeting,
                recentOfferId: recentOffer.id,
                newUserOfferId: newFriendToOfferId
            });
        }
    }
    return meeting;
}
