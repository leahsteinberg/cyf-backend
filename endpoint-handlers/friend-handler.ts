import { getFriends } from "../backend/friendship.js";
import { enrichFriendsWithBroadcastStatus, enrichFriendsWithCallIntents } from "../backend/friend-enrichment.js";
import { searchUsersByUsername } from "../backend/query/user-lookup.js";
import { getFriendIds } from "../backend/query/friendship-lookup.js";
import { getPendingInvitePhoneNumbers } from "../backend/query/invite-lookup.js";
import { createFriendRequest, FriendRequestError } from "../backend/update/invite-update.js";
import { sendPushNotification, isValidExpoPushToken } from "../backend/push-notifications.js";
import type { Request, Response } from 'express';

export const handleSearchUsers = async (req: Request, res: Response) => {
  const { query, requesterId } = req.body;

  if (!query || !requesterId) {
    return res.status(400).json({ error: 'query and requesterId are required' });
  }
  if (typeof query !== 'string' || query.trim().length < 2) {
    return res.status(400).json({ error: 'Query must be at least 2 characters' });
  }

  try {
    const [users, friendIds, pendingPhoneNumbers] = await Promise.all([
      searchUsersByUsername({ query: query.trim(), requesterId }),
      getFriendIds({ userId: requesterId }),
      getPendingInvitePhoneNumbers({ userFromId: requesterId }),
    ]);

    const results = users.map(({ phoneNumber, ...user }) => ({
      ...user,
      isFriend: friendIds.has(user.id),
      hasPendingRequest: phoneNumber ? pendingPhoneNumbers.has(phoneNumber) : false,
    }));

    return res.json(results);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: 'Search failed', details: errorMessage });
  }
};

export const handleSendFriendRequest = async (req: Request, res: Response) => {
  const { userFromId, userToId } = req.body;

  if (!userFromId || !userToId) {
    return res.status(400).json({ error: 'userFromId and userToId are required' });
  }

  try {
    const { invite, sender, recipient } = await createFriendRequest({ userFromId, userToId });

    if (recipient.pushToken && isValidExpoPushToken(recipient.pushToken)) {
      const senderName = sender?.displayUsername ?? sender?.username ?? sender?.name ?? 'Someone';
      await sendPushNotification({
        pushToken: recipient.pushToken,
        title: 'New Friend Request',
        body: `${senderName} wants to be your friend`,
        data: { type: 'FRIEND_REQUEST', inviteId: invite.id },
      }).catch(err => console.error('[handleSendFriendRequest] push failed:', err));
    }

    return res.json({ success: true, requestId: invite.id });
  } catch (error) {
    if (error instanceof FriendRequestError) {
      if (error.code === 'USER_NOT_FOUND') {
        return res.status(404).json({ error: 'User not found' });
      }
      return res.status(409).json({ error: error.code === 'ALREADY_FRIENDS'
        ? 'You are already friends with this user'
        : 'A friend request has already been sent to this user'
      });
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: 'Failed to send friend request', details: errorMessage });
  }
};

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

