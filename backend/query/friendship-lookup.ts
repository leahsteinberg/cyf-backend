// Only prisma logic should go here. No other business logic.
import type { Friendship, User } from "../../types.js";
import { prisma } from "../auth.js";
import { getOfferedMeetings } from "../meeting.js";
import { isActiveBroadcastMeeting } from "../broadcast-to-user.js";

export const getFriendshipsUser1Side = async (id: string): Promise<Friendship[]> => {
    const friendships = await prisma.friendship.findMany({
        where: { userId1: id }
    });
    return friendships || [];
}

export const getFriendshipsUser2Side = async (id: string): Promise<Friendship[]> => {
    const friendships = await prisma.friendship.findMany({
        where: { userId2: id }
    });
    return friendships || [];
}

export const getFriendsWithDetails = async ({ userId }: { userId: string }) => {
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
}

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
export const enrichFriendsWithBroadcastStatus = async ({
    friends,
    viewerId
}: {
    friends: User[],
    viewerId: string
}): Promise<Array<User & { isBroadcastingToMe: boolean }>> => {
    // Batch check: Get all meetings offered to the viewer
    const offeredMeetings = await getOfferedMeetings(viewerId);

    // Filter to only active broadcasts using shared helper
    // Note: isActiveBroadcastMeeting is async, so we can't use .filter() directly
    const broadcastMeetings = [];
    for (const meeting of offeredMeetings) {
        if (await isActiveBroadcastMeeting(meeting)) {
            broadcastMeetings.push(meeting);
        }
    }

    // Create set of broadcaster IDs for O(1) lookup
    const broadcasterIds = new Set(
        broadcastMeetings.map(m => m.userFromId)
    );

    // Enrich each friend with broadcast status
    return friends.map(friend => ({
        ...friend,
        isBroadcastingToMe: broadcasterIds.has(friend.id)
    }));
};