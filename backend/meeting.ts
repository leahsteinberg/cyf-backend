
import type {MeetingState,  Meeting, } from '../types.js';
import { prisma } from './auth.js';  


/// MUTATE

export const createMeeting = async (
    { userFromId, scheduledFor, scheduledEnd, title }
    : { userFromId: string, scheduledFor: Date, scheduledEnd:Date, title: string }):
    Promise<Meeting> => {
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

export const setMeetingState = async (
    {meetingId, meetingState}: {meetingId: string, meetingState: MeetingState}): Promise<Meeting> => {
    const updatedMeeting = prisma.meeting.update({
        where: {
            id: meetingId,
        },
        data: {
            meetingState: meetingState
        }
    })
    return updatedMeeting;
}; 

export const setMeetingAccepted = async ({meetingId, userId}: {meetingId: string, userId: string}): Promise<Meeting> => {
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


export const deleteMeeting = async ({meetingId}: {meetingId: string}): Promise<Meeting> => {
    // First delete all related offers
    await prisma.offer.deleteMany({
        where: {
            meetingId: meetingId
        }
    });

    // Then delete the meeting
    const deletedMeeting = await prisma.meeting.delete({
        where: {
            id: meetingId
        }
    });

    console.log("Deleted meeting:", deletedMeeting);
    return deletedMeeting;
};


/// LOOKUP
export const getCreatedMeetings = async ({userFromId}: {userFromId: string}): Promise<Meeting[]> => {
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

    return meetings;
};


export const getAcceptedMeetings = async ({acceptedUserId}: {acceptedUserId: string}): Promise<Meeting[]> => {
    const meetings = await prisma.meeting.findMany({
        where: {
            acceptedUserId,
        },
        include: {
            userFrom: {
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

    return meetings;
};


export const getAllSearchingMeetings = async (): Promise<Meeting[]> => {
    const meetings = await prisma.meeting.findMany({
        where: {
            meetingState: 'SEARCHING',
        }
    });
    return meetings;
}

export const getUserFromMeeting = async (meeting: Meeting): Promise<User | null> => {
    const id = meeting.userFromId;
    const user = await prisma.user.findFirst({
        where: {
            id
        }
    });
    return user;
}
