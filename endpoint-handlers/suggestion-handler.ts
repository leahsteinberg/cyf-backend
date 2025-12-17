import type { Request, Response } from 'express';
import { getMeetingById, getCreatedMeetings, getAcceptedMeetings } from '../backend/query/meeting-lookup.js';
import { createMeeting, setMeetingState } from '../backend/update/meeting-update.js';
import { processOffersForNewMeeting } from '../backend/process-meeting.js';
import {
    getEffectiveTimeType,
    getEffectiveTargetType,
    DRAFT_MEETING_STATE,
    SEARCHING_MEETING_STATE,
    DISMISSED_DRAFT_MEETING_STATE,
    UNKNOWN_TIME_TYPE,
    IMMEDIATE_TIME_TYPE,
    OPEN_TARGET_TYPE
} from '../types.js';
import { findMeetingTimeConflict } from '../backend/meeting-conflict.js';
import { transitionMeeting } from '../backend/transition-meeting.js';
import { setIsBroadcasting } from '../backend/update/user-update.js';


export const handleAcceptSuggestion = async (req: Request, res: Response) => {
    const { meetingId, userId } = req.body;

    console.log("Accepting suggestion:", { meetingId, userId });

    if (!meetingId || !userId) {
        return res.status(400).json({ error: "meetingId and userId are required" });
    }

    try {
        const suggestion = await getMeetingById({ meetingId });

        if (!suggestion) {
            return res.status(404).json({ error: "Suggestion not found" });
        }

        const timeType = getEffectiveTimeType(suggestion);
        const targetType = getEffectiveTargetType(suggestion);

        console.log(`Converting suggestion to active meeting: timeType=${timeType}, targetType=${targetType}`);

        if (timeType !== UNKNOWN_TIME_TYPE) {
            const createdMeetings = await getCreatedMeetings({ userFromId: userId });
            const acceptedMeetings = await getAcceptedMeetings({ acceptedUserId: userId });

            const conflict = findMeetingTimeConflict({
                userCreatedMeetings: createdMeetings,
                userAcceptedMeetings: acceptedMeetings,
                scheduledFor: new Date(suggestion.scheduledFor),
                scheduledEnd: new Date(suggestion.scheduledEnd),
                excludeMeetingId: meetingId 
            });

            if (conflict) {
                const errorMessage = conflict.type === 'created'
                    ? "You already have a meeting at this time"
                    : "You already have a meeting you accepted at this time";
                return res.status(409).json({
                    error: errorMessage,
                    existingMeeting: conflict.conflictingMeeting
                });
            }
        }

        const {meeting, events} = await transitionMeeting({meetingId, toState: SEARCHING_MEETING_STATE, actorId: userId})

        // if the activated suggestion is a current broadcast, need to set broadcast to true
        
        const activatedMeeting = await getMeetingById({ meetingId });
        if (activatedMeeting?.timeType === IMMEDIATE_TIME_TYPE && activatedMeeting.targetType === OPEN_TARGET_TYPE) {
            await setIsBroadcasting({userId});
        }

        if (!activatedMeeting) {
            return res.status(500).json({ error: "Failed to retrieve activated meeting" });
        }

        await processOffersForNewMeeting(activatedMeeting);

        console.log("Suggestion accepted and converted to active meeting:", {
            meetingId,
            timeType,
            targetType,
            offersCreated: timeType !== UNKNOWN_TIME_TYPE
        });

        res.json({
            success: true,
            meeting: activatedMeeting,
            metadata: {
                timeType,
                targetType,
                offersCreated: timeType !== UNKNOWN_TIME_TYPE,
                requiresTimeSelection: timeType === UNKNOWN_TIME_TYPE
            }
        });
    } catch (error) {
        console.error("Error accepting suggestion:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({
            error: "Failed to accept suggestion",
            details: errorMessage
        });
    }
};

export const handleDismissSuggestion = async (req: Request, res: Response) => {
    const { meetingId, userId } = req.body;

    console.log("Dismissing suggestion:", { meetingId, userId });

    if (!meetingId || !userId) {
        return res.status(400).json({ error: "meetingId and userId are required" });
    }

    try {
        // 1. Get the suggestion
        const suggestion = await getMeetingById({ meetingId });

        if (!suggestion) {
            return res.status(404).json({ error: "Suggestion not found" });
        }
        const {meeting, events} = await transitionMeeting({meetingId, toState: DISMISSED_DRAFT_MEETING_STATE, actorId: userId});

        // 5. Refresh to get updated meeting
        const dismissedSuggestion = await getMeetingById({ meetingId });

        console.log("Suggestion dismissed:", {
            meetingId,
            timeType: getEffectiveTimeType(suggestion),
            targetType: getEffectiveTargetType(suggestion),
            intentLabel: suggestion.intentLabel
        });

        res.json({
            success: true,
            dismissedSuggestion
        });
    } catch (error) {
        console.error("Error dismissing suggestion:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({
            error: "Failed to dismiss suggestion",
            details: errorMessage
        });
    }
};

export const handleCreateSuggestion = async (req: Request, res: Response) => {
    const { userId } = req.body;

    console.log("Creating suggestion:", { userId });

    const {
        userFromId,
        scheduledEnd,
        scheduledFor,
        title,
        // OLD API (deprecated)
        meetingType,
        // NEW API (preferred)
        timeType,
        targetType,
        sourceType,
        intentLabel,
        targetUserId
      } = req.body;
    
      try {
        const createdMeetings = await getCreatedMeetings({userFromId});
        const acceptedMeetings = await getAcceptedMeetings({acceptedUserId: userFromId});
    
        const conflict = findMeetingTimeConflict({
          userCreatedMeetings: createdMeetings,
          userAcceptedMeetings: acceptedMeetings,
          scheduledFor: new Date(scheduledFor),
          scheduledEnd: new Date(scheduledEnd)
        });
    
        if (conflict) {
          const errorMessage = conflict.type === 'created'
            ? "You already have a meeting you created at this time"
            : "You already have a meeting you accepted at this time";
          return res.status(409).json({
            error: errorMessage,
            existingMeeting: conflict.conflictingMeeting
          });
        }
    
        const meeting = await createMeeting({
          userFromId,
          scheduledEnd,
          scheduledFor,
          title,
          meetingState: DRAFT_MEETING_STATE,
          meetingType: meetingType || undefined,
          timeType: timeType || undefined,
          targetType: targetType || undefined,
          sourceType: sourceType || undefined,
          intentLabel: intentLabel || undefined,
          targetUserId: targetUserId || undefined
        });
    
        if (!meeting || !meeting.id) {
          return res.status(500).json({ error: "Failed to create meeting" });
        }

        res.json({});
    } catch (error) {
        console.error("Error creating suggestion:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({
            error: "Failed to create suggestion",
            details: errorMessage
        });
    }
};