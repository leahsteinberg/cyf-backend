import type { Meeting } from '../types.js';
/**
 * Respawns a cancelled meeting by creating a new meeting in SEARCHING state.
 *
 * Use case: When an acceptor cancels a meeting, the creator should get another
 * chance to find someone. The meeting is recreated with the same properties
 * and offers are sent to all original recipients (including the canceller).
 *
 * This applies to ALL meeting types:
 * - IMMEDIATE + OPEN (broadcast to all friends)
 * - IMMEDIATE + FRIEND_SPECIFIC (targeted broadcast to specific users)
 * - IMMEDIATE + GROUP (broadcast to multiple specific users)
 * - FUTURE + OPEN (scheduled meeting to all friends)
 * - FUTURE + FRIEND_SPECIFIC (1-on-1 scheduled meeting)
 * - FUTURE + GROUP (scheduled meeting with multiple specific users)
 *
 * The acceptor who cancelled will receive a new offer (they get another chance).
 *
 * @param cancelledMeeting - The meeting that was just cancelled
 * @returns The newly created meeting in SEARCHING state
 */
export declare const respawnMeeting: (cancelledMeeting: Meeting) => Promise<Meeting>;
//# sourceMappingURL=respawn-meeting.d.ts.map