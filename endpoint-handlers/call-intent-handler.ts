import type { Request, Response } from 'express';
import { createDraftMeeting } from '../backend/draft-meeting.js';
import { getCreatedMeetings } from '../backend/query/meeting-lookup.js';
import { deleteMeetingAndOffers } from '../backend/update/meeting-update.js';
import { getEffectiveTimeType, getEffectiveTargetType, UNKNOWN_TIME_TYPE, FRIEND_SPECIFIC_TARGET_TYPE, USER_INTENT_SOURCE_TYPE, DRAFT_MEETING_STATE } from '../types.js';

/**
 * Creates a call intent (DRAFT meeting with UNKNOWN time and FRIEND_SPECIFIC target)
 * scheduledFor is set to 4 days in the future as a defacto expiry timestamp
 */
export const handleCallIntent = async (req: Request, res: Response) => {
    const { userId, userToId } = req.body;

    console.log("Creating call intent:", { userId, userToId });

    if (!userId || !userToId) {
        return res.status(400).json({ error: "userId and userToId are required" });
    }

    try {
        // Check if user already has a call intent with this friend
        const createdMeetings = await getCreatedMeetings({ userFromId: userId });
        const existingCallIntent = createdMeetings.find(m => {
            const timeType = getEffectiveTimeType(m);
            const targetType = getEffectiveTargetType(m);
            return m.meetingState === DRAFT_MEETING_STATE &&
                   timeType === UNKNOWN_TIME_TYPE &&
                   targetType === FRIEND_SPECIFIC_TARGET_TYPE &&
                   m.targetUserIds.includes(userToId);
        });

        if (existingCallIntent) {
            return res.status(409).json({
                error: "You already have a call intent with this user",
                existingCallIntent
            });
        }

        // Set scheduledFor to 4 days in the future (defacto expiry)
        const scheduledFor = new Date();
        scheduledFor.setDate(scheduledFor.getDate() + 4);

        // scheduledEnd can be same or slightly after (doesn't matter for UNKNOWN time)
        const scheduledEnd = new Date(scheduledFor);
        scheduledEnd.setHours(scheduledEnd.getHours() + 1);

        // Create draft meeting with UNKNOWN time and FRIEND_SPECIFIC target
        const draftMeeting = await createDraftMeeting({
            userFromId: userId,
            scheduledFor,
            scheduledEnd,
            title: 'Call intent',
            timeType: UNKNOWN_TIME_TYPE,
            targetType: FRIEND_SPECIFIC_TARGET_TYPE,
            targetUserIds: [userToId],
            sourceType: USER_INTENT_SOURCE_TYPE,
            intentLabel: 'call intent label'
        });

        console.log("Call intent created:", {
            meetingId: draftMeeting.id,
            userId,
            userToId,
            expiresAt: scheduledFor
        });

        res.json({
            success: true,
            callIntent: draftMeeting
        });
    } catch (error) {
        console.error("Error creating call intent:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({
            error: "Failed to create call intent",
            details: errorMessage
        });
    }
};

/**
 * Removes a call intent (deletes the DRAFT meeting)
 */
export const handleUndoCallIntent = async (req: Request, res: Response) => {
    const { userId, userToId } = req.body;

    console.log("Undoing call intent:", { userId, userToId });

    if (!userId || !userToId) {
        return res.status(400).json({ error: "userId and userToId are required" });
    }

    try {
        // Find the call intent draft meeting
        const createdMeetings = await getCreatedMeetings({ userFromId: userId });
        const callIntent = createdMeetings.find(m => {
            const timeType = getEffectiveTimeType(m);
            const targetType = getEffectiveTargetType(m);
            return m.meetingState === DRAFT_MEETING_STATE &&
                   timeType === UNKNOWN_TIME_TYPE &&
                   targetType === FRIEND_SPECIFIC_TARGET_TYPE &&
                   m.targetUserIds.includes(userToId);
        });

        if (!callIntent) {
            return res.status(404).json({
                error: "No call intent found with this user"
            });
        }

        // Verify ownership
        if (callIntent.userFromId !== userId) {
            return res.status(403).json({
                error: "You can only undo your own call intents"
            });
        }

        // Delete the draft meeting
        const deletedMeeting = await deleteMeetingAndOffers({ meetingId: callIntent.id });

        console.log("Call intent removed:", {
            meetingId: callIntent.id,
            userId,
            userToId
        });

        res.json({
            success: true,
            deletedCallIntent: deletedMeeting
        });
    } catch (error) {
        console.error("Error undoing call intent:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({
            error: "Failed to undo call intent",
            details: errorMessage
        });
    }
};
