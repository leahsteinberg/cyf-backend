import { createMeeting, deleteMeeting, setMeetingDismissed, setMeetingState } from "../backend/update/meeting-update.js";
import { getCreatedMeetings, getAcceptedMeetings, getMeetingById } from "../backend/query/meeting-lookup.js";
import { processOfferForNewMeeting } from "../backend/process-meeting.js";
import type { Request, Response } from 'express';
import { DISMISSED_MEETING_STATE_TYPE, DRAFT_MEETING_STATE_TYPE, SEARCHING_MEETING_STATE_TYPE } from "../types.js";
import { deleteAcceptedMeetingByAcceptor } from "../backend/meeting.js";
import { findMeetingTimeConflict } from "../backend/meeting-conflict.js";


export const handleCreateMeeting = async (req: Request, res: Response) => {
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
    // DEPRECATION WARNING: Log usage of old API
    if (meetingType && !timeType && !targetType) {
      console.warn('⚠️ DEPRECATED: meetingType parameter is deprecated. Use timeType + targetType instead.', {
        userFromId,
        meetingType,
        endpoint: 'handleCreateMeeting'
      });
      // Add deprecation header
      res.setHeader('X-Deprecated-API', 'meetingType will be removed in v2.0. Use timeType and targetType instead.');
    }

    // USAGE TRACKING: Track old vs new API usage
    if (meetingType && !timeType && !targetType) {
      console.log('[METRICS] api.create_meeting.old_format', { userFromId, meetingType });
    } else if (timeType && targetType) {
      console.log('[METRICS] api.create_meeting.new_format', { userFromId, timeType, targetType });
    } else if (!meetingType && !timeType && !targetType) {
      // Default behavior (no params provided)
      console.log('[METRICS] api.create_meeting.default_format', { userFromId });
    }

    // Check if user already has any active meetings (created or accepted) that overlap with the requested time
    const createdMeetings = await getCreatedMeetings({userFromId});
    const acceptedMeetings = await getAcceptedMeetings({acceptedUserId: userFromId});

    // Use centralized conflict checking logic
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

    // Create meeting with dual-write support (old or new API)
    const meeting = await createMeeting({
      userFromId,
      scheduledEnd,
      scheduledFor,
      title,
      // Support both old and new API
      meetingType: meetingType || undefined,
      timeType: timeType || undefined,
      targetType: targetType || undefined,
      sourceType: sourceType || undefined,
      intentLabel: intentLabel || undefined,
      targetUserId: targetUserId || undefined
    });

    // Validate meeting was created successfully
    if (!meeting || !meeting.id) {
      return res.status(500).json({ error: "Failed to create meeting" });
    }

    await processOfferForNewMeeting(meeting);// TODO - Can I remove this and reuse code instead?
    res.json(meeting)
  } catch (error) {
    console.error("Error creating meeting:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: "Failed to create meeting", details: errorMessage });
  }
}

export const handleGetMeetings = async (req: Request, res: Response) => {
  const {userFromId} = req.body;
  const meetings = await getCreatedMeetings({userFromId});
  const acceptedMeetings = await getAcceptedMeetings({acceptedUserId: userFromId});

  const allMeetings = [...meetings, ...acceptedMeetings]
      .filter(m => m.meetingState !== DISMISSED_MEETING_STATE_TYPE);

  res.json(allMeetings)
}

export const handleDeleteMeeting = async (req: Request, res: Response) => {
  const { meetingId, userId } = req.body;
  console.log("handle delete meeting ---", meetingId);

  if (!meetingId) {
    return res.status(400).json({ error: "meetingId is required" });
  }

  try {
    // if the user is the receiver of the meeting, not the creator,
    // then just undo the accept and reset the meeting as searching
    const meeting = await getMeetingById({ meetingId });
    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }
    
    if (userId !== meeting?.userFromId) {
      const rejectedOffer = await deleteAcceptedMeetingByAcceptor({meetingId});
      return res.json(meeting);
    }

    // first need to delete offers
    const deletedMeeting = await deleteMeeting({ meetingId });
    res.json(deletedMeeting);
  } catch (error) {
    console.error("Error deleting meeting:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * User accepts a DRAFT meeting suggestion
 * Moves from DRAFT → SEARCHING and creates offers
 */
export const handleAcceptDraftMeeting = async (req: Request, res: Response) => {
  const { meetingId, userId } = req.body;

  console.log("Accepting draft meeting:", { meetingId, userId });

  if (!meetingId || !userId) {
    return res.status(400).json({ error: "meetingId and userId are required" });
  }

  try {
    // Get the meeting
    const meeting = await getMeetingById({ meetingId });

    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    // Verify the user owns this meeting
    if (meeting.userFromId !== userId) {
      return res.status(403).json({ error: "You can only accept your own draft meetings" });
    }

    // Verify it's in DRAFT state
    if (meeting.meetingState !== DRAFT_MEETING_STATE_TYPE) {
      return res.status(400).json({
        error: "Only DRAFT meetings can be accepted",
        currentState: meeting.meetingState
      });
    }

    // Check for time conflicts before activation
    const createdMeetings = await getCreatedMeetings({ userFromId: userId });
    const acceptedMeetings = await getAcceptedMeetings({ acceptedUserId: userId });

    // Use centralized conflict checking logic (excludes this meeting)
    const conflict = findMeetingTimeConflict({
      userCreatedMeetings: createdMeetings,
      userAcceptedMeetings: acceptedMeetings,
      scheduledFor: new Date(meeting.scheduledFor),
      scheduledEnd: new Date(meeting.scheduledEnd),
      excludeMeetingId: meetingId // Don't check against itself
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

    // Activate the meeting: move to SEARCHING state
    await setMeetingState({ meetingId, meetingState: SEARCHING_MEETING_STATE_TYPE });

    // Refresh meeting data
    const activatedMeeting = await getMeetingById({ meetingId });

    if (!activatedMeeting) {
      return res.status(500).json({ error: "Failed to retrieve activated meeting" });
    }

    // Create offers for the activated meeting
    // Now using refactored logic that supports all meeting types!
    await processOfferForNewMeeting(activatedMeeting);

    console.log("Draft meeting accepted and activated:", meetingId);
    res.json({
      success: true,
      meeting: activatedMeeting
    });
  } catch (error) {
    console.error("Error accepting draft meeting:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: "Failed to accept draft meeting", details: errorMessage });
  }
}

/**
 * User rejects a DRAFT meeting suggestion
 * Sets the draft meeting as DISMISSED
 */
export const handleRejectDraftMeeting = async (req: Request, res: Response) => {
  const { meetingId, userId } = req.body;

  console.log("Rejecting draft meeting:", { meetingId, userId });

  if (!meetingId || !userId) {
    return res.status(400).json({ error: "meetingId and userId are required" });
  }

  try {
    // Get the meeting
    const meeting = await getMeetingById({ meetingId });

    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    // Verify the user owns this meeting
    if (meeting.userFromId !== userId) {
      return res.status(403).json({ error: "You can only reject your own draft meetings" });
    }

    // Verify it's in DRAFT state
    if (meeting.meetingState !== DRAFT_MEETING_STATE_TYPE) {
      return res.status(400).json({
        error: "Only DRAFT meetings can be rejected",
        currentState: meeting.meetingState
      });
    }

    // Set the meeting as dismissed
    const dismissedMeeting = await setMeetingDismissed({meetingId});

    console.log("Draft meeting rejected and marked dismissed:", meetingId);
    res.json({
      success: true,
      meeting: dismissedMeeting
    });
  } catch (error) {
    console.error("Error rejecting draft meeting:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: "Failed to reject draft meeting", details: errorMessage });
  }
}