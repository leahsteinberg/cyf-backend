import { getFriends } from "../backend/friendship.js";
import type { Request, Response } from 'express';

export const handleGetFriends = async (req: Request, res: Response) => {
  const {id} = req.body;
  const friends = await getFriends(id);

  res.json(friends);// TODO - switch to res.json()?
};

