import { createMeeting, deleteMeeting, setMeetingState } from "../backend/update/meeting-update.js";
import { getCreatedMeetings, getAcceptedMeetings, getMeetingById } from "../backend/query/meeting-lookup.js";
import { processOfferForNewMeeting } from "../backend/process-meeting.js";
import type { Request, Response } from 'express';
import { getAcceptedOfferByMeetingId } from "../backend/query/offer-lookup.js";
import { setOfferRejected } from "../backend/update/offer-update.js";
import { SEARCHING_MEETING_STATE } from "../backend/utils.js";
import { handleRejectOffer } from "./offer-handler.js";
import { rejectOffer, rejectOfferWithMeeting } from "../backend/offer.js";
import { deleteAcceptedMeetingByAcceptor } from "../backend/meeting.js";


export const handleCreateMeeting = async (req: Request, res: Response) => {
  const {userFromId, scheduledEnd, scheduledFor, title} = req.body;

  try {
    // Check if user already has any active meetings (created or accepted) that overlap with the requested time
    const createdMeetings = await getCreatedMeetings({userFromId});
    const acceptedMeetings = await getAcceptedMeetings({acceptedUserId: userFromId});

    const newMeetingStart = new Date(scheduledFor);
    const newMeetingEnd = new Date(scheduledEnd);

    // Helper function to check time overlap
    const hasTimeOverlap = (existingStart: Date, existingEnd: Date) => {
      return (newMeetingStart < existingEnd && newMeetingEnd > existingStart);
    };

    // Filter out PAST meetings and BROADCAST meetings, then check for time conflicts
    const conflictingCreatedMeeting = createdMeetings.find(m =>
      m.meetingState !== 'PAST' &&
      m.meetingType !== 'BROADCAST' &&
      hasTimeOverlap(new Date(m.scheduledFor), new Date(m.scheduledEnd))
    );

    const conflictingAcceptedMeeting = acceptedMeetings.find(m =>
      m.meetingState !== 'PAST' &&
      m.meetingType !== 'BROADCAST' &&
      hasTimeOverlap(new Date(m.scheduledFor), new Date(m.scheduledEnd))
    );

    if (conflictingCreatedMeeting) {
      return res.status(409).json({
        error: "You already have a meeting you created at this time",
        existingMeeting: conflictingCreatedMeeting
      });
    }

    if (conflictingAcceptedMeeting) {
      return res.status(409).json({
        error: "You already have a meeting you accepted at this time",
        existingMeeting: conflictingAcceptedMeeting
      });
    }

    const meeting = await createMeeting({userFromId, scheduledEnd, scheduledFor, title, meetingType: 'ADVANCE'});

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
  res.json([...meetings, ...acceptedMeetings])
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
      res.json(meeting);
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
    if (meeting.meetingState !== 'DRAFT') {
      return res.status(400).json({
        error: "Only DRAFT meetings can be accepted",
        currentState: meeting.meetingState
      });
    }

    // Check for time conflicts before activation
    const createdMeetings = await getCreatedMeetings({ userFromId: userId });
    const acceptedMeetings = await getAcceptedMeetings({ acceptedUserId: userId });

    const newMeetingStart = new Date(meeting.scheduledFor);
    const newMeetingEnd = new Date(meeting.scheduledEnd);

    const hasTimeOverlap = (existingStart: Date, existingEnd: Date) => {
      return (newMeetingStart < existingEnd && newMeetingEnd > existingStart);
    };

    // Filter out PAST, DRAFT, and BROADCAST meetings, then check for time conflicts
    const conflictingCreatedMeeting = createdMeetings.find(m =>
      m.id !== meetingId && // Don't check against itself
      m.meetingState !== 'PAST' &&
      m.meetingState !== 'DRAFT' &&
      m.meetingType !== 'BROADCAST' &&
      hasTimeOverlap(new Date(m.scheduledFor), new Date(m.scheduledEnd))
    );

    const conflictingAcceptedMeeting = acceptedMeetings.find(m =>
      m.meetingState !== 'PAST' &&
      m.meetingState !== 'DRAFT' &&
      m.meetingType !== 'BROADCAST' &&
      hasTimeOverlap(new Date(m.scheduledFor), new Date(m.scheduledEnd))
    );

    if (conflictingCreatedMeeting) {
      return res.status(409).json({
        error: "You already have a meeting you created at this time",
        existingMeeting: conflictingCreatedMeeting
      });
    }

    if (conflictingAcceptedMeeting) {
      return res.status(409).json({
        error: "You already have a meeting you accepted at this time",
        existingMeeting: conflictingAcceptedMeeting
      });
    }

    // Activate the meeting: move to SEARCHING state
    await setMeetingState({ meetingId, meetingState: 'SEARCHING' });

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
 * Deletes the draft meeting
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
    if (meeting.meetingState !== 'DRAFT') {
      return res.status(400).json({
        error: "Only DRAFT meetings can be rejected",
        currentState: meeting.meetingState
      });
    }

    // Delete the draft meeting
    const deletedMeeting = await deleteMeeting({ meetingId });

    console.log("Draft meeting rejected and deleted:", meetingId);
    res.json({
      success: true,
      meeting: deletedMeeting
    });
  } catch (error) {
    console.error("Error rejecting draft meeting:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: "Failed to reject draft meeting", details: errorMessage });
  }
}