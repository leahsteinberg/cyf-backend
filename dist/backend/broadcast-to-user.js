import { getEffectiveTimeType, IMMEDIATE_TIME_TYPE, SEARCHING_MEETING_STATE } from "../types.js";
import { getOfferedMeetings } from "./meeting.js";
import { getOffersForUser } from "./offer.js";
import { getCreatedMeetings, getMeetingById } from "./query/meeting-lookup.js";
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
export const isBroadcastingToUser = async ({ possibleBroadcasterId, userId }) => {
    const offeredMeetings = await getOfferedMeetings(userId);
    const possibleBroadcasterMeetings = offeredMeetings.filter((o) => o.userFromId === possibleBroadcasterId);
    const broadcastMeetings = possibleBroadcasterMeetings.filter((m) => getEffectiveTimeType(m) === IMMEDIATE_TIME_TYPE && m.meetingState === SEARCHING_MEETING_STATE);
    if (broadcastMeetings.length) {
        return true;
    }
    return false;
};
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
export const isBroadcasting = async (userFromId) => {
    const meetings = await getCreatedMeetings({ userFromId });
    const broadcastMeetings = meetings.filter((m) => getEffectiveTimeType(m) === IMMEDIATE_TIME_TYPE && m.meetingState === SEARCHING_MEETING_STATE);
    return !!broadcastMeetings.length;
};
//# sourceMappingURL=broadcast-to-user.js.map