import type { Meeting, MeetingState, MeetingType } from "../../types.js";
import { prisma } from "../auth.js";
import { ACCEPTED_MEETING_STATE } from "../utils.js";

export const createMeeting = async (
    { userFromId, scheduledFor, scheduledEnd, title, meetingType }
    : { userFromId: string, scheduledFor: Date, scheduledEnd:Date, title: string, meetingType: MeetingType}):
    Promise<Meeting> => {
        console.log("making a meeting SF- ", scheduledFor)

        // Create meeting with broadcast metadata if it's a broadcast type
        const meeting = await prisma.meeting.create({
            data: {
                userFromId,
                scheduledFor,
                scheduledEnd,
                title,
                meetingType,
                // Create broadcast metadata for broadcast meetings
                ...(meetingType === 'BROADCAST' && {
                    broadcastMetadata: {
                        create: {
                            subState: 'UNCLAIMED'
                        }
                    }
                })
            },
            include: {
                broadcastMetadata: true
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
            meetingState: ACCEPTED_MEETING_STATE,
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
