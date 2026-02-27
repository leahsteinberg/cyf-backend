import type { Meeting } from '../types.js';
import {
    isBroadcastMeeting,
    PAST_MEETING_STATE,
    DRAFT_MEETING_STATE,
    DISMISSED_DRAFT_MEETING_STATE,
    UNKNOWN_TIME_TYPE,
    getEffectiveTimeType,
    REJECTED_MEETING_STATE,
    SEARCHING_MEETING_STATE,
    CANCELED_MEETING_STATE
} from '../types.js';

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
export const findMeetingTimeConflict = ({
    userCreatedMeetings,
    userAcceptedMeetings,
    scheduledFor,
    scheduledEnd,
    excludeMeetingId
}: {
    userCreatedMeetings: Meeting[];
    userAcceptedMeetings: Meeting[];
    scheduledFor: Date;
    scheduledEnd: Date;
    excludeMeetingId?: string;
}): { conflictingMeeting: Meeting; type: 'created' | 'accepted' } | null => {

    const newMeetingStart = new Date(scheduledFor);
    const newMeetingEnd = new Date(scheduledEnd);

    // Helper to check if two time ranges overlap
    const hasTimeOverlap = (existingStart: Date, existingEnd: Date): boolean => {
        return (newMeetingStart < existingEnd && newMeetingEnd > existingStart);
    };

    // Helper to determine if a meeting should be excluded from conflict checking
    const shouldExcludeFromConflicts = (meeting: Meeting): boolean => {
        // Exclude if it's the same meeting we're checking
        if (excludeMeetingId && meeting.id === excludeMeetingId) {
            return true;
        }

        // Exclude PAST, DRAFT, and DISMISSED meetings
        if (meeting.meetingState === PAST_MEETING_STATE ||
            meeting.meetingState === DRAFT_MEETING_STATE ||
            meeting.meetingState === DISMISSED_DRAFT_MEETING_STATE ||
            meeting.meetingState === REJECTED_MEETING_STATE ||
            meeting.meetingState === SEARCHING_MEETING_STATE ||
            meeting.meetingState === CANCELED_MEETING_STATE
        ) {
            return true;
        }

        // Exclude ALL BROADCAST meetings (IMMEDIATE - any target) - they don't block calendar
        if (isBroadcastMeeting(meeting)) {
            return true;
        }

        // Exclude UNKNOWN time meetings (no set time yet)
        const timeType = getEffectiveTimeType(meeting);
        if (timeType === UNKNOWN_TIME_TYPE) {
            return true;
        }

        return false;
    };

    // Check created meetings for conflicts
    const conflictingCreatedMeeting = userCreatedMeetings.find(m => {
        if (shouldExcludeFromConflicts(m)) {
            return false;
        }
        return hasTimeOverlap(new Date(m.scheduledFor), new Date(m.scheduledEnd));
    });

    if (conflictingCreatedMeeting) {
        return {
            conflictingMeeting: conflictingCreatedMeeting,
            type: 'created'
        };
    }

    // Check accepted meetings for conflicts
    const conflictingAcceptedMeeting = userAcceptedMeetings.find(m => {
        if (shouldExcludeFromConflicts(m)) {
            return false;
        }
        return hasTimeOverlap(new Date(m.scheduledFor), new Date(m.scheduledEnd));
    });

    if (conflictingAcceptedMeeting) {
        return {
            conflictingMeeting: conflictingAcceptedMeeting,
            type: 'accepted'
        };
    }

    return null;
};
