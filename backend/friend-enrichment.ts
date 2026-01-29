import type { User, UserSignal } from "../types.js";
import { getOfferedMeetings } from "./meeting.js";
import { isActiveBroadcastMeeting } from "./broadcast-to-user.js";
import { getIncomingCallIntents, getCallIntentsForUser } from "./query/signal-lookup.js";

/**
 * Gets CALL_INTENT signals from userId that target any of the friendIds.
 * In other words: "Which friends do I want to call?"
 */
export const getOutgoingCallIntents = async ({
    userId,
    friendIds
}: {
    userId: string;
    friendIds: string[];
}): Promise<UserSignal<'CALL_INTENT'>[]> => {
    if (friendIds.length === 0) {
        return [];
    }

    const signals = await getCallIntentsForUser({ userId });
    console.log("signals", signals);

    // Filter to only those targeting friends
    // (payload.targetUserIds may contain multiple IDs)
    const filteredSignals =  signals.filter(signal => {
        /// I fixed this just now.
        const targetId = (signal.payload as any)?.targetUserId;
        return friendIds.includes(targetId);//targetId.some((id: string) => friendIds.includes(id));
    });

    console.log("filteredSignals", filteredSignals);
    return filteredSignals;
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

/**
 * Enriches friends list with call intent status (both directions).
 *
 * For each friend, adds:
 * - `hasOutgoingCallIntent`: true if the viewer wants to call this friend
 * - `hasIncomingCallIntent`: true if this friend wants to call the viewer
 *
 * @param friends - Array of friend User objects to enrich
 * @param viewerId - ID of the user viewing the friend list
 * @returns Friends with added call intent boolean fields
 */
export const enrichFriendsWithCallIntents = async <T extends { id: string }>({
    friends,
    viewerId
}: {
    friends: T[],
    viewerId: string
}): Promise<Array<T & { hasOutgoingCallIntent: boolean; hasIncomingCallIntent: boolean }>> => {
    const friendIds = friends.map(f => f.id);

    // Batch fetch both directions
    const [outgoingIntents, incomingIntents] = await Promise.all([
        getOutgoingCallIntents({ userId: viewerId, friendIds }),
        getIncomingCallIntents({ userId: viewerId, friendIds }),
    ]);
    console.log("outgoingIntents - ", outgoingIntents);
    console.log("incoming intents", incomingIntents);

    // Build Sets for O(1) lookup
    // Outgoing: extract targetUserIds from each signal
    const friendsIWantToCall: Record<string, string> = 
    outgoingIntents.reduce((intents, signal) => {
        const targetId = (signal.payload as any)?.targetUserId;
        if (friendIds.includes(targetId)) {
            return {...intents, ...{[targetId]: signal.id}};
        }
        return intents;
    }, {});

    console.log("friendsIWantToCall", friendsIWantToCall);

    // Incoming: the signal's userId is the friend who wants to call me
    const friendsWhoWantToCallMe = new Set(
        incomingIntents.map(signal => signal.userId)
    );

    // Enrich each friend
    return friends.map(friend => ({
        ...friend,
        hasOutgoingCallIntent: !!friendsIWantToCall[friend.id],
        outgoingCallIntentSignalId: friendsIWantToCall[friend.id],
        hasIncomingCallIntent: false,//!!friendsWhoWantToCallMe[friend.id],
        incomingCallIntentSignalId: null,
    }));
};
