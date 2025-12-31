import { getEffectiveTimeType, IMMEDIATE_TIME_TYPE, SEARCHING_MEETING_STATE } from "../../types.js";
import { prisma } from "../auth.js";
import { getOfferedMeetings } from "../meeting.js";
export const getFriendshipsUser1Side = async (id) => {
    const friendships = await prisma.friendship.findMany({
        where: { userId1: id }
    });
    return friendships || [];
};
export const getFriendshipsUser2Side = async (id) => {
    const friendships = await prisma.friendship.findMany({
        where: { userId2: id }
    });
    return friendships || [];
};
export const getFriendsWithDetails = async ({ userId }) => {
    const friendshipsUser1 = await getFriendshipsUser1Side(userId);
    const friendshipsUser2 = await getFriendshipsUser2Side(userId);
    const friendIds = [
        ...friendshipsUser1.map(f => f.userId2),
        ...friendshipsUser2.map(f => f.userId1)
    ];
    const friends = await prisma.user.findMany({
        where: {
            id: { in: friendIds }
        },
        select: {
            id: true,
            name: true,
            email: true,
            username: true,
            displayUsername: true,
            timezone: true
        }
    });
    return friends;
};
/**
 * Enriches friends list with viewer-specific broadcast status.
 *
 * For each friend, adds `isBroadcastingToMe` field indicating whether
 * that friend is currently broadcasting TO the viewer.
 *
 * Uses batch approach for performance: fetches all offered meetings once,
 * then performs in-memory filtering to avoid N+1 queries.
 *
 * @param friends - Array of friend User objects to enrich
 * @param viewerId - ID of the user viewing the friend list
 * @returns Friends with added `isBroadcastingToMe` boolean field
 */
export const enrichFriendsWithBroadcastStatus = async ({ friends, viewerId }) => {
    // Batch check: Get all meetings offered to the viewer
    const offeredMeetings = await getOfferedMeetings(viewerId);
    // Filter to only IMMEDIATE/SEARCHING meetings (active broadcasts)
    const broadcastMeetings = offeredMeetings.filter(m => getEffectiveTimeType(m) === IMMEDIATE_TIME_TYPE &&
        m.meetingState === SEARCHING_MEETING_STATE);
    // Create set of broadcaster IDs for O(1) lookup
    const broadcasterIds = new Set(broadcastMeetings.map(m => m.userFromId));
    // Enrich each friend with broadcast status
    return friends.map(friend => ({
        ...friend,
        isBroadcastingToMe: broadcasterIds.has(friend.id)
    }));
};
//# sourceMappingURL=friendship-lookup.js.map