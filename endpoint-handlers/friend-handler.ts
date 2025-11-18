import { getFriends } from "../backend/friendship.js";
import { getSentInvites } from "../backend/invite.js";
import type { Request, Response } from 'express';

export const handleGetFriends = async (req: Request, res: Response) => {
  const {id} = req.body;
  const friends = await getFriends(id);
  const sentInvites = await getSentInvites(id)
  //console.log("invites out", sentInvites)
  res.json(friends);// TODO - switch to res.json()?
};

