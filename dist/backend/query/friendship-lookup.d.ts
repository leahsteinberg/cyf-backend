import type { Friendship, User } from "../../types.js";
export declare const getFriendshipsUser1Side: (id: string) => Promise<Friendship[]>;
export declare const getFriendshipsUser2Side: (id: string) => Promise<Friendship[]>;
export declare const getFriendsWithDetails: ({ userId }: {
    userId: string;
}) => Promise<{
    email: string;
    username: string | null;
    id: string;
    name: string | null;
    timezone: string | null;
    displayUsername: string | null;
}[]>;
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
export declare const enrichFriendsWithBroadcastStatus: ({ friends, viewerId }: {
    friends: User[];
    viewerId: string;
}) => Promise<Array<User & {
    isBroadcastingToMe: boolean;
}>>;
//# sourceMappingURL=friendship-lookup.d.ts.map