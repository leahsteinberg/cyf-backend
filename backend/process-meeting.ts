import { getMeetingOffers, findFriendIdToOffer, findRecentOffer, setOfferExpired, createOffer } from './offer.ts';
import { setMeetingState } from './meeting.ts';
import { ACCEPTED_OFFER_STATE, EXPIRED_OFFER_STATE, isTimePast, OPEN_OFFER_STATE, PAST_MEETING_STATE, REJECTED_MEETING_STATE, REJECTED_OFFER_STATE } from './utils.ts';



export const processOfferForNewMeeting = async (meeting) => {
    const meetingId = meeting.id;
    const offers = await getMeetingOffers({meetingId});
    const newFriendToOfferId = await findFriendIdToOffer({offers, meetingId});
    return await makeOfferForNewMeeting({meeting, userOfferedId: newFriendToOfferId});
}


const makeOfferForNewMeeting = async ({meeting, userOfferedId}) => {
    const meetingId = meeting.id;
    const newOffer = await createOffer({meetingId, userOfferedId});
    return meeting;
}

// const processMeetingNoMoreFriends = async({meeting}) => {
//     // if meeting in past -> set expired.
//     // if meeting in future -> leave as is.
//     const scheduledFor = meeting.scheduledFor;
//     const isPast = await isTimePast({eventTime: scheduledFor});
//     if (isPast) {
//         const newMeeting = setMeetingState({meeting, meetingState: PAST_MEETING_STATE});
//         return newMeeting;
//         // set meeting as past, no new offers
//     }
//     return meeting;
// }

const processPastMeeting = async({meeting}) => {
    const newMeeting = await setMeetingState({meeting, meetingState: PAST_MEETING_STATE});
    return newMeeting;
}


export const processOffersForMeeting = async (meeting) => {

    const meetingInPast = await isTimePast({eventTime: meeting.scheduledFor});
    if (meetingInPast) {
        return await processPastMeeting({meeting});   
    }

    const meetingId = meeting.id
    const offers = await getMeetingOffers({meetingId})
    const newFriendToOfferId = await findFriendIdToOffer({offers, meetingId})

    // no more friends left, nothing to do.
    if (!newFriendToOfferId) {
        return meeting;     
    }

    const recentOffer = await findRecentOffer(offers);
    // no past offers, treat as new Meeting.
    if (!recentOffer) {
        const newMeeting = await makeOfferForNewMeeting({meeting, userOfferedId: newFriendToOfferId})
        return newMeeting;
    }

    if (recentOffer.offerState === OPEN_OFFER_STATE) {
        // see if it's expired and set it to expired.
        // if not, leave it open.
        // TODO - change this so it is actually based on when it expires.....?
        // check to see if we want to 
        const needNewOffer = await determineNeedNewOffer()

        console.log("CASE: Most recent offer is OPEN")
        const updatedPrevOffer = await setOfferExpired({offerId: recentOffer.id});
        const newOffer = await createOffer({meetingId, userOfferedId: newFriendToOfferId})
        console.log("updated expired offer -> ", updatedPrevOffer)
        console.log("-> new offer ", newOffer)
        return newOffer

    } else if (recentOffer.offerState === ACCEPTED_OFFER_STATE) {
        // put it through the "accept offer" path, (which should have)
        // already been called, but good to be thorough
        console.log("CASE: Most recent offer is ACCEPTED")
        


    } else if (recentOffer.offerState === REJECTED_OFFER_STATE) {
        // make a new offer if possible.
        console.log("CASE: Most recent offer is REJECTED");
        const newOffer = await createOffer({meetingId, userOfferedId: newFriendToOfferId})
        console.log("-> new offer ", newOffer)
        return newOffer


    } else if (recentOffer.offerState === EXPIRED_OFFER_STATE) {
        /// this is actually an error state, but will accomodate it.
        // this 
        // make a new offer if possible. (there should be extra friends here)
        console.log("CASE: Most recent offer is EXPIRED")
        const newOffer = await createOffer({meetingId, userOfferedId: newFriendToOfferId})
        console.log("-> new offer ", newOffer)
        return newOffer
    }
    // if no offers, create open offer/
    // if any offers past due, close them and try to create a new offer.
}
