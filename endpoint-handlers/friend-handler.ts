import { getFriends } from "../backend/friendship.js";
import { enrichFriendsWithBroadcastStatus } from "../backend/query/friendship-lookup.js";
import type { Request, Response } from 'express';

export const handleGetFriends = async (req: Request, res: Response) => {
  const {id} = req.body;
  const friends = await getFriends(id);

  // Enrich with viewer-specific broadcast status
  const enrichedFriends = await enrichFriendsWithBroadcastStatus({
    friends,
    viewerId: id
  });

  res.json(enrichedFriends);
};

