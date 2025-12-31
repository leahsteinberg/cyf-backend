/**
 * Helper functions for creating and managing DRAFT meetings (system-generated suggestions)
 *
 * DRAFT meetings are created by the backend and presented to users as suggestions.
 * Users can then accept (activate) or reject these suggestions.
 */
import type { Meeting, TimeType, TargetType, SourceType } from "../types.js";
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
    targetUserIds?: string[];
    suggestionReason?: string;
    minParticipants?: number;
    maxParticipants?: number;
}
/**
 * Creates a DRAFT meeting (suggestion) using the new field system
 * DRAFT meetings are not yet active - no offers are created until user activation
 *
 * This is used by backend logic to generate meeting suggestions for users.
 */
export declare function createDraftMeeting(params: CreateDraftMeetingParams): Promise<Meeting>;
/**
 * Validates that a meeting is in DRAFT state and owned by the specified user
 */
export declare function validateDraftMeetingOwnership(meeting: Meeting, userId: string): void;
//# sourceMappingURL=draft-meeting.d.ts.map