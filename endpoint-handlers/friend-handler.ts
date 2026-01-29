import { getFriends } from "../backend/friendship.js";
import { enrichFriendsWithBroadcastStatus, enrichFriendsWithCallIntents } from "../backend/query/friendship-lookup.js";
import type { Request, Response } from 'express';

export const handleGetFriends = async (req: Request, res: Response) => {
  const {id} = req.body;
  const friends = await getFriends(id);

  // Enrich with viewer-specific broadcast status
  const withBroadcastStatus = await enrichFriendsWithBroadcastStatus({
    friends,
    viewerId: id
  });

  // Enrich with call intent status (both directions)
  const enrichedFriends = await enrichFriendsWithCallIntents({
    friends: withBroadcastStatus,
    viewerId: id
  });

  res.json(enrichedFriends);
};

