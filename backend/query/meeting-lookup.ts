import type { Meeting, Offer, User } from "../../types.js";
import { prisma } from "../auth.js";

export const findMeetingWithUserFromOffer = async ({offer}: {offer: Offer}): Promise<Meeting | null > => {
    const meeting = await prisma.meeting.findUnique({
        where: { id: offer.meetingId },
        include: {
            userFrom: {
                select: {
                    id: true,
                    name: true,
                    displayUsername: true,
                    username: true,
                    email: true,
                }
            }
        }
    });
    return meeting;
}


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
};

export const getMeetingById = async ({meetingId}: {meetingId: string}): Promise<Meeting | null> => {
    const meeting = await prisma.meeting.findUnique({
        where: { id: meetingId }
    });
    return meeting;
};

export const getUserFromMeetingId = async (meetingId: string): Promise<User | null> => {
    const meeting = await prisma.meeting.findUnique({
        where: { id: meetingId },
        include: {
            userFrom: true
        }
    });
    return meeting?.userFrom ?? null;
};
