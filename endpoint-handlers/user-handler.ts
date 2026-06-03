import { findUserByPhone, getUserContextInfo } from "../backend/query/user-lookup.js";
import { deleteUser } from "../backend/update/user-update.js";
import { auth } from "../backend/auth.js";
import { fromNodeHeaders } from "better-auth/node";
import type { Request, Response } from 'express';


export const handleGetUserByPhone = async (req: Request, res: Response) => {
  const {userPhoneNumber} = req.body;
  const user = await findUserByPhone(userPhoneNumber);
  res.send(user);// TODO - switch to res.json()?
};

export const handleDeleteUser = async (req: Request, res: Response) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await deleteUser({ userId: session.user.id });

    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: 'Failed to delete account', details: errorMessage });
  }
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