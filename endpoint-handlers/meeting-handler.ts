import { createMeeting, deleteMeeting } from "../backend/update/meeting-update.js";
import { getCreatedMeetings, getAcceptedMeetings } from "../backend/query/meeting-lookup.js";
import { processOfferForNewMeeting } from "../backend/process-meeting.js";
import type { Request, Response } from 'express';


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
  const { meetingId } = req.body;
  console.log("handle delete meeting ---", meetingId);

  if (!meetingId) {
    return res.status(400).json({ error: "meetingId is required" });
  }

  try {
    // first need to delete offers
    const deletedMeeting = await deleteMeeting({ meetingId });
    res.json(deletedMeeting);
  } catch (error) {
    console.error("Error deleting meeting:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}