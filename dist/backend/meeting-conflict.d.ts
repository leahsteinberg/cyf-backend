import type { Meeting } from '../types.js';
/**
 * Checks if a meeting time conflicts with user's existing meetings
 *
 * Excludes from conflict checking:
 * - PAST meetings (already happened)
 * - DRAFT meetings (not yet activated)
 * - DISMISSED meetings (user dismissed the suggestion)
 * - BROADCAST meetings (IMMEDIATE - any target type, don't block calendar)
 * - UNKNOWN time meetings (no set time yet)
 *
 * @param userCreatedMeetings - Meetings created by the user
 * @param userAcceptedMeetings - Meetings accepted by the user
 * @param scheduledFor - Start time of the meeting to check
 * @param scheduledEnd - End time of the meeting to check
 * @param excludeMeetingId - Optional meeting ID to exclude (when checking against itself)
 * @returns The conflicting meeting if found, or null if no conflict
 */
export declare const findMeetingTimeConflict: ({ userCreatedMeetings, userAcceptedMeetings, scheduledFor, scheduledEnd, excludeMeetingId }: {
    userCreatedMeetings: Meeting[];
    userAcceptedMeetings: Meeting[];
    scheduledFor: Date;
    scheduledEnd: Date;
    excludeMeetingId?: string;
}) => {
    conflictingMeeting: Meeting;
    type: "created" | "accepted";
} | null;
//# sourceMappingURL=meeting-conflict.d.ts.map