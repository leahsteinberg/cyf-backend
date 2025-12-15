import type { Meeting, MeetingState, MeetingType, TimeType, TargetType, SourceType } from "../../types.js";
import {
    meetingTypeToNew,
    newToMeetingType,
    ACCEPTED_MEETING_STATE_TYPE,
    SEARCHING_MEETING_STATE_TYPE,
    IMMEDIATE_TIME_TYPE,
    OPEN_TARGET_TYPE,
    DISMISSED_MEETING_STATE_TYPE
} from "../../types.js";
import { prisma } from "../auth.js";

// Phase 2: Dual-write parameters - support both old and new
type CreateMeetingParams = {
    userFromId: string;
    scheduledFor: Date;
    scheduledEnd: Date;
    title: string;

    // OLD PARAMETERS - for backwards compatibility
    meetingType?: MeetingType;

    // NEW PARAMETERS - optional during migration
    timeType?: TimeType;
    targetType?: TargetType;
    sourceType?: SourceType;
    intentLabel?: string;
    targetUserId?: string;
    meetingState?: MeetingState;  // Allow setting initial state (e.g., DRAFT)
};

export const createMeeting = async (params: CreateMeetingParams): Promise<Meeting> => {
    const { userFromId, scheduledFor, scheduledEnd, title, meetingState } = params;

    console.log("making a meeting SF- ", scheduledFor);

    // DUAL-WRITE LOGIC: Determine values for both old and new systems
    let finalMeetingType: MeetingType;
    let finalTimeType: TimeType;
    let finalTargetType: TargetType;

    if (params.timeType && params.targetType) {
        // NEW SYSTEM: New parameters provided, derive old from new
        finalTimeType = params.timeType;
        finalTargetType = params.targetType;
        finalMeetingType = newToMeetingType(finalTimeType, finalTargetType);
    } else if (params.meetingType) {
        // OLD SYSTEM: Old parameter provided, derive new from old
        finalMeetingType = params.meetingType;
        const derived = meetingTypeToNew(finalMeetingType);
        finalTimeType = derived.timeType;
        finalTargetType = derived.targetType;
    } else {
        // FALLBACK: Default to ADVANCE behavior
        finalMeetingType = 'ADVANCE';
        finalTimeType = 'FUTURE';
        finalTargetType = OPEN_TARGET_TYPE;
    }

    // Determine if broadcast metadata should be created
    // Broadcast metadata needed when: timeType is IMMEDIATE and targetType is OPEN
    const needsBroadcastMetadata = finalTimeType === IMMEDIATE_TIME_TYPE && finalTargetType === OPEN_TARGET_TYPE;

    // Create meeting with dual-write to both old and new fields
    const meeting = await prisma.meeting.create({
        data: {
            userFromId,
            scheduledFor,
            scheduledEnd,
            title,
            meetingState: meetingState || 'SEARCHING',  // Default to SEARCHING if not specified

            // OLD FIELD - Write for backwards compatibility
            meetingType: finalMeetingType,

            // NEW FIELDS - Write to support new system
            timeType: finalTimeType,
            targetType: finalTargetType,
            sourceType: params.sourceType || null,
            intentLabel: params.intentLabel || null,
            targetUserId: params.targetUserId || null,

            // Create broadcast metadata for immediate + open meetings (broadcasts)
            ...(needsBroadcastMetadata && {
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
            meetingState: ACCEPTED_MEETING_STATE_TYPE,
            acceptedUserId: userId,
        }
    })
    return updatedMeeting;
};

export const setMeetingOpen = async ({meetingId}: {meetingId: string}): Promise<Meeting> => {
    const updatedMeeting = prisma.meeting.update({
        where: {
            id: meetingId,
        },
        data: {
            meetingState: SEARCHING_MEETING_STATE_TYPE,
            acceptedUserId: null,
        }
    })
    return updatedMeeting;
};

export const setMeetingDismissed = async ({meetingId}: {meetingId: string}): Promise<Meeting> => {
    const updatedMeeting = prisma.meeting.update({
        where: {
            id: meetingId,
        },
        data: {
            meetingState: DISMISSED_MEETING_STATE_TYPE,
        }
    })
    return updatedMeeting;
};

export const unclaimBroadcastMeeting = async ({meetingId}: {meetingId: string}): Promise<Meeting> => {
    // Update meeting to searching state with no accepted user
    // Also update broadcast metadata to unclaimed
    const updatedMeeting = await prisma.meeting.update({
        where: {
            id: meetingId,
        },
        data: {
            meetingState: SEARCHING_MEETING_STATE_TYPE,
            acceptedUserId: null,
            broadcastMetadata: {
                update: {
                    subState: 'UNCLAIMED',
                    pendingAt: null,
                    offerClaimedId: null
                }
            }
        },
        include: {
            broadcastMetadata: true
        }
    });
    return updatedMeeting;
};


export const deleteMeetingAndOffers = async ({meetingId}: {meetingId: string}): Promise<Meeting> => {
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
