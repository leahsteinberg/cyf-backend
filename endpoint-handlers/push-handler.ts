import { updateUserPushToken } from "../backend/user.js";
import type { Request, Response } from 'express';

export const handlePush = async (req: Request, res: Response) => {
    const { pushToken, userId } = req.body;
    console.log("register push --", { pushToken, userId });

    if (!pushToken || !userId) {
        return res.status(400).json({ error: "pushToken and userId are required" });
    }

    try {
        const updatedUser = await updateUserPushToken({ userId, pushToken });
        res.json({ success: true, user: updatedUser });
    } catch (error) {
        console.error("Error updating push token:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ error: "Internal server error", details: errorMessage });
    }
}