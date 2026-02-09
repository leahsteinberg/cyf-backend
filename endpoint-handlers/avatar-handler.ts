import type { Request, Response } from 'express';
import { uploadAvatar, getAvatarUrl } from '../backend/avatar/upload-avatar.js';
import { updateUserAvatarUrl } from '../backend/update/user-update.js';

export const handleUploadAvatar = async (req: Request, res: Response) => {
    const { userId, imageBase64, mimeType } = req.body;
    console.log("/api/upload-avatar", { userId, mimeType: mimeType, imageSize: imageBase64?.length });

    if (!userId || !imageBase64 || !mimeType) {
        return res.status(400).json({ error: "userId, imageBase64, and mimeType are required" });
    }

    try {
        const result = await uploadAvatar({ userId, imageBase64, mimeType });
        await updateUserAvatarUrl({ userId, avatarUrl: result.url });
        res.json({ success: true, avatarUrl: result.url });
    } catch (error) {
        console.error("Error uploading avatar:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ error: "Failed to upload avatar", details: errorMessage });
    }
};

export const handleGetAvatar = async (req: Request, res: Response) => {
    const { userId } = req.body;
    console.log("/api/get-avatar", { userId });

    if (!userId) {
        return res.status(400).json({ error: "userId is required" });
    }

    try {
        const url = getAvatarUrl(userId);
        res.json({ success: true, url });
    } catch (error) {
        console.error("Error getting avatar:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ error: "Failed to get avatar", details: errorMessage });
    }
};
