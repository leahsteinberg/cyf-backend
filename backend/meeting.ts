import { prisma } from './auth.ts';  
import { getMeetingOffers, findFriendIdToOffer, findRecentOffer, createOffer, setOfferExpired } from './offer.ts';
import { processOffersForMeeting } from './process-meeting.ts';

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
    const processedMeeting = await processOffersForMeeting(meeting);
    console.log("Processed Meeting-----", processedMeeting)

    return processedMeeting;
};

export const setMeetingRejected = async ({meetingId}) => {
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

export const setMeetingAccepted = async ({meetingId, userId}) => {
    const updatedMeeting = prisma.meeting.update({
        where: {
            id: meetingId,
        },
        data: {
            meetingState: 'ACCEPTED',
            acceptedUserId: userId,
        }
    })
    return updatedMeeting;
};


export const deleteMeeting = async ({meetingId}) => {};

export const getCreatedMeetings = async ({userFromId}) => {
    const meetings = await prisma.meeting.findMany({
        where: {
            userFromId
        },
        include: {
            acceptedUser: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    username: true,
                    displayUsername: true
                },
            },
        },
    });
    console.log("get meetings - ", meetings)

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


