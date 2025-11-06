import { prisma } from './auth.ts';  


/// MUTATE

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

export const setMeetingState = async ({meetingId, meetingState}) => {
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


/// LOOKUP

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
    //console.log("get meetings - ", meetings)

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
