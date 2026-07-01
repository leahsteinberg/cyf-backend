import type { Meeting, MeetingState, MeetingType, TimeType, TargetType, SourceType } from "../../types.js";
import {
    meetingTypeToNew,
    newToMeetingType,
    SEARCHING_MEETING_STATE,
    IMMEDIATE_TIME_TYPE,
    OPEN_TARGET_TYPE,
    DISMISSED_DRAFT_MEETING_STATE,
    UNCLAIMED_BROADCAST_STATE,
    OPEN_OFFER_STATE,
    EXPIRED_OFFER_STATE,
} from "../../types.js";
import { prisma } from "../auth.js";

export type CreateMeetingParams = {
    userFromId: string;
    scheduledFor: Date;
    scheduledEnd: Date;
    backupScheduledTimes?: Date[];
    title: string;

    meetingType?: MeetingType;

    timeType?: TimeType;
    targetType?: TargetType;
    sourceType?: SourceType;
    intentLabel?: string;
    targetUserIds?: string[];
    suggestionReason?: string;
    meetingState?: MeetingState;
    minParticipants?: number;
    maxParticipants?: number;

    groupId?: string;
    groupName?: string;
    photoUrl?: string;
    textContent?: string;
    replacedByMeetingId?: string;
};

export const createMeeting = async (params: CreateMeetingParams): Promise<Meeting> => {
    const { userFromId, scheduledFor, scheduledEnd, backupScheduledTimes, title, meetingState } = params;

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

    // Validate participant counts
    const minParticipants = params.minParticipants || 1;
    const maxParticipants = params.maxParticipants || 1;

    if (minParticipants > maxParticipants) {
        throw new Error("minParticipants cannot exceed maxParticipants");
    }

    if (params.targetUserIds && params.targetUserIds.length > 0) {
        if (maxParticipants > params.targetUserIds.length) {
            throw new Error("maxParticipants cannot exceed number of invited users");
        }
    }

    if (finalTargetType === OPEN_TARGET_TYPE && maxParticipants !== 1) {
        throw new Error("OPEN meetings must have maxParticipants = 1");
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
            backupScheduledTimes: backupScheduledTimes ?? [],
            title,
            meetingState: meetingState || 'SEARCHING',  // Default to SEARCHING if not specified

            // OLD FIELD - Write for backwards compatibility
            meetingType: finalMeetingType,

            // NEW FIELDS - Write to support new system
            timeType: finalTimeType,
            targetType: finalTargetType,
            sourceType: params.sourceType || null,
            intentLabel: params.intentLabel || null,
            targetUserIds: { set: params.targetUserIds ?? [] },
            suggestionReason: params.suggestionReason || null,
            minParticipants,
            maxParticipants,
            groupId: params.groupId || null,
            groupName: params.groupName || null,
            photoUrl: params.photoUrl || null,
            textContent: params.textContent || null,
            replacedByMeetingId: params.replacedByMeetingId || null,

            // Create broadcast metadata for immediate + open meetings (broadcasts)
            ...(needsBroadcastMetadata && {
                broadcastMetadata: {
                    create: {
                        subState: UNCLAIMED_BROADCAST_STATE
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

export const setMeetingAcceptors = async ({meetingId, userId}: {meetingId: string, userId: string}): Promise<Meeting> => {
    const updatedMeeting = await prisma.meeting.update({
        where: {
            id: meetingId,
        },
        data: {
            acceptedUserId: userId,  // Keep for backward compatibility
            acceptedUserIds: {
                push: userId  // Append to array
            }
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
            meetingState: SEARCHING_MEETING_STATE,
            acceptedUserId: null,
            acceptedUserIds: { set: [] }
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
            meetingState: DISMISSED_DRAFT_MEETING_STATE,
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
            meetingState: SEARCHING_MEETING_STATE,
            acceptedUserId: null,
            acceptedUserIds: { set: [] },
            broadcastMetadata: {
                update: {
                    subState: UNCLAIMED_BROADCAST_STATE,
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


export const updateMeetingPhotoUrl = async ({ meetingId, photoUrl }: { meetingId: string; photoUrl: string | null }) => {
    const updatedMeeting = await prisma.meeting.update({
        where: { id: meetingId },
        data: { photoUrl },
    });
    return updatedMeeting;
};

type UpdateMeetingMetaParams = {
    meetingId: string;
    title?: string | null;
    textContent?: string | null;
    intentLabel?: string | null;
};

export const updateMeetingMeta = async ({ meetingId, title, textContent, intentLabel }: UpdateMeetingMetaParams) => {
    const updatedMeeting = await prisma.meeting.update({
        where: { id: meetingId },
        data: {
            ...(title !== undefined && { title }),
            ...(textContent !== undefined && { textContent }),
            ...(intentLabel !== undefined && { intentLabel }),
        },
    });
    return updatedMeeting;
};

export const cancelReplacedMeeting = async ({ meetingId }: { meetingId: string }): Promise<void> => {
    await prisma.$transaction([
        prisma.offer.updateMany({
            where: { meetingId, offerState: OPEN_OFFER_STATE },
            data: { offerState: EXPIRED_OFFER_STATE },
        }),
        prisma.meeting.update({
            where: { id: meetingId },
            data: { meetingState: 'CANCELED' },
        }),
    ]);
};

export const updateMeetingState = async (
    meeting: Meeting,
    toState: MeetingState,
    acceptedUserId?: string | null,
    scheduledFor?: Date,
    scheduledEnd?: Date
) => {
    const result = await prisma.meeting.updateMany({
        where: {
            id: meeting.id,
            meetingState: meeting.meetingState,
        },
        data: {
            meetingState: toState,
            ...(acceptedUserId !== undefined && { acceptedUserId }),
            ...(acceptedUserId && {
                acceptedUserIds: {
                    push: acceptedUserId
                }
            }),
            ...(scheduledFor && { scheduledFor }),
            ...(scheduledEnd && { scheduledEnd }),
        },
    });

    if (result.count === 0) {
        throw new Error("Meeting state has changed since it was read. Please retry.");
    }
};
