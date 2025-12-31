import { getFriends } from "../backend/friendship.js";
import { enrichFriendsWithBroadcastStatus } from "../backend/query/friendship-lookup.js";
export const handleGetFriends = async (req, res) => {
    const { id } = req.body;
    const friends = await getFriends(id);
    // Enrich with viewer-specific broadcast status
    const enrichedFriends = await enrichFriendsWithBroadcastStatus({
        friends,
        viewerId: id
    });
    res.json(enrichedFriends);
};
//# sourceMappingURL=friend-handler.js.map