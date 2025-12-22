/**
 * Helper functions for creating and managing DRAFT meetings (system-generated suggestions)
 *
 * DRAFT meetings are created by the backend and presented to users as suggestions.
 * Users can then accept (activate) or reject these suggestions.
 */

import type { Meeting, TimeType, TargetType, SourceType } from "../types.js";
import { DRAFT_MEETING_STATE } from "../types.js";
import { createMeeting } from "./update/meeting-update.js";

export interface CreateDraftMeetingParams {
    userFromId: string;
    scheduledFor: Date;
    scheduledEnd: Date;
    backupScheduledTimes?: Date[];
    title: string;
    timeType: TimeType;
    targetType: TargetType;
    sourceType?: SourceType;
    intentLabel?: string;
    targetUserId?: string;
}

/**
 * Creates a DRAFT meeting (suggestion) using the new field system
 * DRAFT meetings are not yet active - no offers are created until user activation
 *
 * This is used by backend logic to generate meeting suggestions for users.
 */
export async function createDraftMeeting(params: CreateDraftMeetingParams): Promise<Meeting> {
    const {
        userFromId,
        scheduledEnd,
        scheduledFor,
        backupScheduledTimes,
        title,
        timeType,
        targetType,
        sourceType,
        intentLabel,
        targetUserId
    } = params;

    // Validate required fields
    if (!userFromId || !scheduledFor || !scheduledEnd || !title) {
        throw new Error("Missing required fields: userFromId, scheduledFor, scheduledEnd, title");
    }

    if (!timeType || !targetType) {
        throw new Error("timeType and targetType are required for draft meetings");
    }

    // Create meeting in DRAFT state with new fields
    const meeting = await createMeeting({
        userFromId,
        scheduledEnd,
        scheduledFor,
        backupScheduledTimes: backupScheduledTimes || [],
        title,
        meetingState: DRAFT_MEETING_STATE,
        // New field system
        timeType,
        targetType,
        // Only include optional fields if they have values
        ...(sourceType && { sourceType }),
        ...(intentLabel && { intentLabel }),
        ...(targetUserId && { targetUserId })
    });

    if (!meeting || !meeting.id) {
        throw new Error("Failed to create draft meeting");
    }

    console.log("Draft meeting created:", {
        id: meeting.id,
        timeType,
        targetType,
        sourceType,
        intentLabel
    });

    return meeting;
}

/**
 * Validates that a meeting is in DRAFT state and owned by the specified user
 */
export function validateDraftMeetingOwnership(meeting: Meeting, userId: string): void {
    if (meeting.userFromId !== userId) {
        throw new Error("You can only modify your own draft meetings");
    }

    if (meeting.meetingState !== DRAFT_MEETING_STATE) {
        throw new Error(`Meeting is not in DRAFT state (current: ${meeting.meetingState})`);
    }
}
