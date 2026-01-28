import type { Meeting } from "../types.js";
/**
 * Checks if a meeting is stale (past scheduledEnd but not in a terminal state)
 */
export declare const isMeetingStale: (meeting: Meeting) => Promise<boolean>;
/**
 * Determines if a meeting should be shown to users
 * Centralized filtering logic for all meeting queries
 */
export declare const shouldShowMeeting: (meeting: Meeting) => Promise<boolean>;
/**
 * Lazily transition a stale meeting to PAST state
 * This is called opportunistically when we detect a stale meeting
 */
export declare const transitionStaleMeetingToPast: (meeting: Meeting) => Promise<void>;
/**
 * Filter meetings and optionally transition stale ones to PAST
 * This is the main function to use in endpoint handlers
 *
 * @param meetings - Array of meetings to filter
 * @param transitionStale - If true, transition stale meetings to PAST (slower, but updates DB)
 * @returns Filtered array of meetings that should be shown
 */
export declare const filterAndCleanMeetings: (meetings: Meeting[], transitionStale?: boolean) => Promise<Meeting[]>;
/**
 * Synchronous version that checks staleness without async time check
 * Use this when you need immediate filtering without I/O
 * Note: This uses a simple Date comparison without the 15ms tolerance
 */
export declare const isMeetingStaleSynchronous: (meeting: Meeting) => boolean;
/**
 * Synchronous version of filtering
 * Use for quick filtering without database updates
 */
export declare const filterMeetingsSynchronous: (meetings: Meeting[]) => Meeting[];
//# sourceMappingURL=meeting-staleness.d.ts.map