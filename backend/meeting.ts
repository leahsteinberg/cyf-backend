import { prisma } from './auth.ts';  



export const createMeeting = async ({userFromId}) => {
    const meeting = await prisma.meeting.create({
        data: {
            userFromId,
            scheduledFor: new Date('2025-10-14T06:00:00.000Z'),
            scheduledEnd: new Date('2025-10-14T07:00:00.000Z'),
        }
    });
    return meeting;
};



//   scheduledFor    DateTime
//   scheduledEnd    DateTime
//   offers          Offer[]   @relation("offers")
//   acceptedBy      User      @relation("meetingsAccepted", fields: [acceptedById], references: [id])
//   acceptedById    String

export const deleteMeeting = async ({meetingId}) => {};

export const getCreatedMeetings = async ({userFromId}) => {
    const meetings = await prisma.meeting.findMany({
        where: {
            userFromId
        }
    });
    console.log("got these", meetings)
    return meetings;
};

export const findAcceptedMeetings = async ({userId}) => {};