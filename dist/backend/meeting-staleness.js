import { PAST_MEETING_STATE, EXPIRED_MEETING_STATE, CANCELED_MEETING_STATE, DISMISSED_DRAFT_MEETING_STATE } from "../types.js";
import { isTimePast } from "./utils.js";
import { setMeetingState } from "./update/meeting-update.js";
/**
 * Terminal states - meetings in these states should not transition further
 */
const TERMINAL_STATES = [
    PAST_MEETING_STATE,
    EXPIRED_MEETING_STATE,
    CANCELED_MEETING_STATE,
    DISMISSED_DRAFT_MEETING_STATE,
];
/**
 * Checks if a meeting is stale (past scheduledEnd but not in a terminal state)
 */
export const isMeetingStale = async (meeting) => {
    // Already in terminal state - not stale, just done
    if (TERMINAL_STATES.includes(meeting.meetingState)) {
        return false;
    }
    // Check if past scheduledEnd
    const pastEnd = await isTimePast({ eventTime: meeting.scheduledEnd });
    return pastEnd;
};
/**
 * Determines if a meeting should be shown to users
 * Centralized filtering logic for all meeting queries
 */
export const shouldShowMeeting = async (meeting) => {
    // Hide meetings in terminal states
    if (TERMINAL_STATES.includes(meeting.meetingState)) {
        return false;
    }
    // Hide stale meetings
    const stale = await isMeetingStale(meeting);
    if (stale) {
        return false;
    }
    return true;
};
/**
 * Lazily transition a stale meeting to PAST state
 * This is called opportunistically when we detect a stale meeting
 */
export const transitionStaleMeetingToPast = async (meeting) => {
    const stale = await isMeetingStale(meeting);
    if (stale) {
        console.log(`Transitioning stale meeting ${meeting.id} to PAST state`);
        await setMeetingState({
            meetingId: meeting.id,
            meetingState: PAST_MEETING_STATE
        });
    }
};
/**
 * Filter meetings and optionally transition stale ones to PAST
 * This is the main function to use in endpoint handlers
 *
 * @param meetings - Array of meetings to filter
 * @param transitionStale - If true, transition stale meetings to PAST (slower, but updates DB)
 * @returns Filtered array of meetings that should be shown
 */
export const filterAndCleanMeetings = async (meetings, transitionStale = false) => {
    const results = [];
    for (const meeting of meetings) {
        const shouldShow = await shouldShowMeeting(meeting);
        if (!shouldShow && transitionStale) {
            // Opportunistically clean up stale meetings
            await transitionStaleMeetingToPast(meeting);
        }
        if (shouldShow) {
            results.push(meeting);
        }
    }
    return results;
};
/**
 * Synchronous version that checks staleness without async time check
 * Use this when you need immediate filtering without I/O
 * Note: This uses a simple Date comparison without the 15ms tolerance
 */
export const isMeetingStaleSynchronous = (meeting) => {
    if (TERMINAL_STATES.includes(meeting.meetingState)) {
        return false;
    }
    const now = new Date();
    return meeting.scheduledEnd.getTime() < now.getTime();
};
/**
 * Synchronous version of filtering
 * Use for quick filtering without database updates
 */
export const filterMeetingsSynchronous = (meetings) => {
    return meetings.filter(meeting => {
        // Hide terminal states
        if (TERMINAL_STATES.includes(meeting.meetingState)) {
            return false;
        }
        // Hide stale meetings
        if (isMeetingStaleSynchronous(meeting)) {
            return false;
        }
        return true;
    });
};
//# sourceMappingURL=meeting-staleness.js.map