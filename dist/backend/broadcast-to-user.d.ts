import { type Meeting } from "../types.js";
/**
 * Checks if a meeting is an active broadcast.
 *
 * A broadcast is "active" if:
 * - It's IMMEDIATE (broadcast)
 * - State is SEARCHING or ACCEPTED
 * - Should be shown (not stale or terminal) per centralized staleness logic
 *
 * @param meeting - Meeting to check
 * @returns true if meeting is an active broadcast
 */
export declare const isActiveBroadcastMeeting: (meeting: Meeting) => Promise<boolean>;
/**
 * Checks if a specific user is broadcasting TO another user (viewer-specific).
 *
 * This function determines whether `possibleBroadcasterId` has an active broadcast
 * that the `userId` (viewer) can see. A broadcast is "visible" to the viewer if:
 * - It's an IMMEDIATE (broadcast) meeting
 * - The viewer has an offer for this meeting
 * - The meeting is in SEARCHING state
 *
 * This handles both OPEN broadcasts (to all friends) and targeted broadcasts
 * (to specific users or groups).
 *
 * **Use this for**: Frontend APIs, friend lists, any viewer-specific broadcast checks
 *
 * @param possibleBroadcasterId - ID of the user who might be broadcasting
 * @param userId - ID of the viewer checking the broadcast status
 * @returns true if possibleBroadcasterId is broadcasting TO userId, false otherwise
 *
 * @example
 * // Check if Alice is broadcasting to Bob
 * const isAliceBroadcasting = await isBroadcastingToUser({
 *   possibleBroadcasterId: aliceId,
 *   userId: bobId
 * });
 */
export declare const isBroadcastingToUser: ({ possibleBroadcasterId, userId }: {
    possibleBroadcasterId: string;
    userId: string;
}) => Promise<boolean>;
/**
 * Checks if a user is broadcasting at all (global check, not viewer-specific).
 *
 * This function determines whether `userFromId` has ANY active broadcast,
 * regardless of who can see it. It checks for IMMEDIATE meetings in SEARCHING state.
 *
 * This handles both OPEN broadcasts and targeted broadcasts.
 *
 * **Use this for**: System-level checks, analytics, determining if user has ANY active broadcast
 * **Don't use this for**: Frontend APIs (use isBroadcastingToUser instead)
 *
 * @param userFromId - ID of the user to check
 * @returns true if user has any active broadcast, false otherwise
 *
 * @example
 * // Check if Alice is broadcasting to anyone
 * const isAliceBroadcasting = await isBroadcasting(aliceId);
 */
export declare const isBroadcasting: (userFromId: string) => Promise<boolean>;
//# sourceMappingURL=broadcast-to-user.d.ts.map