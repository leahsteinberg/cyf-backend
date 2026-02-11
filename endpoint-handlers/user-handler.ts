import { findUserByPhone, getUserContextInfo } from "../backend/query/user-lookup.js";
import type { Request, Response } from 'express';


export const handleGetUserByPhone = async (req: Request, res: Response) => {
  const {userPhoneNumber} = req.body;
  const user = await findUserByPhone(userPhoneNumber);
  res.send(user);// TODO - switch to res.json()?
};

export const handleGetProfile = async (req: Request, res: Response) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  try {
    const user = await getUserContextInfo({ userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json(user);
  } catch (error) {
    console.error("Error getting profile:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: "Failed to get profile", details: errorMessage });
  }
};