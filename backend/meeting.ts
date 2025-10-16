import { prisma } from './auth.ts';  
import { getMeetingOffers, findFriendIdToOffer } from './offer.ts';


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

export const simulateProcessMeeting = async (meeting) => {
    const meetingId = meeting.id

    const offers = await getMeetingOffers({meetingId})
    

    
    
    
    const newFriendToOfferId = await findFriendIdToOffer({offers, meetingId})


    console.log("friendToOfferId", newFriendToOfferId)
    if (!newFriendToOfferId) {
        // no more friends left to offer --> set meeting to rejected.
    }

    // const openOffers = offers.reduce((openOffers, offer) => {
    //     return offer.offerState === 'OPEN' ? [...openOffers, offer] : openOffers
    // }, []);




    //console.log("openOffers", openOffers)
        // find friend ID of each offer, add to 
        //  offer.userOffer, {})
    // if (openOffers.length === 0) {
    //     // if 0 --> see if we can create a new offer, and do if possible

    // } else if (openOffers.length === 1) {
    //     // if 1 --> set the other offer to expired, create a new one

    // } else {
    //     // too many open offers -- deal with it or return error

    // }
    // ✅ get user
    // ✅ get the friends of this user 
    // ✅ get all the offers
    // find most recent offer
    // if no offers, create open offer
    // if any offers past due, 


    // ✅ pick a friend who has not yet been offered (to be offered to)
    // ✅ ensure there's only 0 or 1. if not, then in error state.


    // if one has been accepted, great. mark the meeting as ACCEPTED. (due diligence)
    // there should be
    // 0 meetings --> create an offer from first friend
    // 1 meetings --> set existing meeting to 

    //const offers = await getMeetingOffers({meetingId: meeting.id});
    /// has all the offers from this meeting.
    // go through all the offers. 
    // if there is one out, 


    // console.log({
    //     meetingId: meeting.id, offers
    // })
    // return {
    //     meetingId: meeting.id, offers
    // }
}

