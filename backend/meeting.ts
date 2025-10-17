import { prisma } from './auth.ts';  
import { getMeetingOffers, findFriendIdToOffer, findRecentOffer, createOffer, setOfferExpired } from './offer.ts';


export const createMeeting = async (
    {
        userFromId,
        scheduledFor,
        scheduledEnd,
        title
    }) => {
        const meeting = await prisma.meeting.create({
            data: {
                userFromId,
                scheduledFor,
                scheduledEnd,
                title,
            }
    });
    return meeting;
};


export const deleteMeeting = async ({meetingId}) => {};

export const getCreatedMeetings = async ({userFromId}) => {
    const meetings = await prisma.meeting.findMany({
        where: {
            userFromId
        }
    });
    return meetings;
};


export const getAllSearchingMeetings = async () => {
    const meetings = await prisma.meeting.findMany({
        where: {
            meetingState: 'SEARCHING',
        }
    });
    return meetings;
}

export const getUserFromMeeting = async (meeting) => {
    const id = meeting.userFromId;
    const user = await prisma.user.findFirst({
        where: {
            id
        }
    });
    return user;
}

// enum OfferState {
//   OPEN
//   ACCEPTED
//   REJECTED
//   EXPIRED
// }

export const simulateProcessMeeting = async (meeting) => {
    const meetingId = meeting.id

    const offers = await getMeetingOffers({meetingId})
    
    const newFriendToOfferId = await findFriendIdToOffer({offers, meetingId})
    console.log("friendToOfferId", newFriendToOfferId)
    const recentOffer = await findRecentOffer(offers);
    console.log("Recent Offer", recentOffer);
    
    if (!newFriendToOfferId) {
        console.log("No more friends to offer to! ---");
        const expiredPrevOffer = setOfferExpired({offerId: recentOffer.id})

        // no more friends left to offer 
                // --> set last offer to expired.
                // --> set meeting to rejected.
        return
    }


    if (!recentOffer) {
        const newOffer = await createOffer({meetingId, userOfferedId: newFriendToOfferId})
        console.log("zero offers -> new offer ", newOffer)
        return newOffer
    }
    // IF NO OFFER EXISTS
        // make a new offer if possible.

    if (recentOffer.offerState === 'OPEN') {
        // see if it's expired and set it to expired.
        // if not, leave it open.
        console.log("CASE: Most recent offer is OPEN")

        const updatedPrevOffer = await setOfferExpired({offerId: recentOffer.id});
        const newOffer = await createOffer({meetingId, userOfferedId: newFriendToOfferId})
        console.log("updated expired offer -> ", updatedPrevOffer)
        console.log("-> new offer ", newOffer)
        return newOffer

    } else if (recentOffer.offerState === 'ACCEPTED') {
        // put it through the "accept offer" path, (which should have)
        // already been called, but good to be thorough
        console.log("CASE: Most recent offer is ACCEPTED")


    } else if (recentOffer.offerState === 'REJECTED') {
        // make a new offer if possible.
        console.log("CASE: Most recent offer is REJECTED")


    } else if (recentOffer.offerState === 'EXPIRED') {
        // make a new offer if possible. (there should be extra friends here)
            console.log("CASE: Most recent offer is EXPIRED")

    }


    // ✅ get user creator
    // ✅ get the friends of this user 
    // ✅ get all the offers
    // ✅ find most recent offer
    // ✅ ERROR CHECKING - ensure there's only 0 or 1 that is OPEN or ACCEPTED.
                    // if not, then in error state.
    // ✅ pick a friend who has not yet been offered (to be offered to)
    // if no offers, create open offer/
    // if any offers past due, close them and try to create a new offer.
}

