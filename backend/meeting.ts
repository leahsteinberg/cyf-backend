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

const setMeetingRejected = async ({meetingId}) => {
    const updatedMeeting = prisma.meeting.update({
        where: {
            id: meetingId,
        },
        data: {
            meetingState: 'REJECTED'
        }
    })
    return updatedMeeting;
};

export const setMeetingAccepted = async ({meetingId}) => {
    const updatedMeeting = prisma.meeting.update({
        where: {
            id: meetingId,
        },
        data: {
            meetingState: 'ACCEPTED'
        }
    })
    return updatedMeeting;
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
    console.log("getAllSearchingMeetings")
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

export const simulateProcessMeeting = async (meeting) => {
    const meetingId = meeting.id

    const offers = await getMeetingOffers({meetingId})
    console.log("offers", offers);
    
    const newFriendToOfferId = await findFriendIdToOffer({offers, meetingId})
    console.log("friendToOfferId", newFriendToOfferId)
    const recentOffer = await findRecentOffer(offers);
    console.log("Most recent Offer", recentOffer);
    

    if (!newFriendToOfferId) {
        console.log("CASE: No more friends to offer to! --- ");
        const expiredPrevOffer = await setOfferExpired({offerId: recentOffer.id})
        const updatedMeeting = await setMeetingRejected({meetingId})
        console.log("expired prev offer --", expiredPrevOffer)
        console.log("updated meeting --", updatedMeeting)
        return
    }


    if (!recentOffer) {
        const newOffer = await createOffer({meetingId, userOfferedId: newFriendToOfferId})
        console.log("CASE: zero offers -> new offer ", newOffer)
        return newOffer
    }


    if (recentOffer.offerState === 'OPEN') {
        // see if it's expired and set it to expired.
        // if not, leave it open.
        // TODO - change this so it is actually based on when it expires.....?
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
        const newOffer = await createOffer({meetingId, userOfferedId: newFriendToOfferId})
        console.log("-> new offer ", newOffer)
        return newOffer


    } else if (recentOffer.offerState === 'EXPIRED') {
        // make a new offer if possible. (there should be extra friends here)
        console.log("CASE: Most recent offer is EXPIRED")
    }
    // if no offers, create open offer/
    // if any offers past due, close them and try to create a new offer.
}

