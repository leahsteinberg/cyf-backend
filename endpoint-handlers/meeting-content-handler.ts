import type { Request, Response } from 'express';
import { uploadMeetingPhoto, deleteMeetingPhoto } from '../backend/meeting-photo/upload-meeting-photo.js';
import { updateMeetingPhotoUrl, updateMeetingMeta } from '../backend/update/meeting-update.js';

export const handleUploadMeetingPhoto = async (req: Request, res: Response) => {
    const { meetingId, imageBase64, mimeType } = req.body;
    console.log("handle uploading meeting photo - ", meetingId);

    console.log("/api/upload-meeting-photo", { meetingId, mimeType, imageSize: imageBase64?.length });

    if (!meetingId || !imageBase64 || !mimeType) {
        return res.status(400).json({ error: "meetingId, imageBase64, and mimeType are required" });
    }

    try {
        const result = await uploadMeetingPhoto({ meetingId, imageBase64, mimeType });
        await updateMeetingPhotoUrl({ meetingId, photoUrl: result.url });
        res.json({ success: true, photoUrl: result.url });
    } catch (error) {
        console.error("Error uploading meeting photo:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ error: "Failed to upload meeting photo", details: errorMessage });
    }
};

export const handleDeleteMeetingPhoto = async (req: Request, res: Response) => {
    const { meetingId } = req.body;
    console.log("/api/delete-meeting-photo", { meetingId });

    if (!meetingId) {
        return res.status(400).json({ error: "meetingId is required" });
    }

    try {
        await deleteMeetingPhoto(meetingId);
        await updateMeetingPhotoUrl({ meetingId, photoUrl: null });
        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting meeting photo:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ error: "Failed to delete meeting photo", details: errorMessage });
    }
};

// Accepts any combination of title, textContent, intentLabel.
// At least one field must be present; each field, if provided, may be null to clear it.
export const handleUpdateMeetingMeta = async (req: Request, res: Response) => {
    const { meetingId, title, textContent, intentLabel } = req.body;

    if (!meetingId) {
        return res.status(400).json({ error: "meetingId is required" });
    }

    if (title === undefined && textContent === undefined && intentLabel === undefined) {
        return res.status(400).json({ error: "At least one of title, textContent, or intentLabel is required" });
    }

    try {
        const updated = await updateMeetingMeta({ meetingId, title, textContent, intentLabel });
        res.json({ success: true, title: updated.title, textContent: updated.textContent, intentLabel: updated.intentLabel });
    } catch (error) {
        console.error("Error updating meeting meta:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ error: "Failed to update meeting", details: errorMessage });
    }
};
