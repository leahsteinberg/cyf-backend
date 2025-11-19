import { createMeeting, deleteMeeting } from "../backend/update/meeting-update.js";
import { getCreatedMeetings, getAcceptedMeetings } from "../backend/query/meeting-lookup.js";
import { processOfferForNewMeeting } from "../backend/process-meeting.js";
import type { Request, Response } from 'express';


export const handleCreateMeeting = async (req: Request, res: Response) => {
  const {userFromId, scheduledEnd, scheduledFor, title} = req.body;
  const meeting = await createMeeting({userFromId, scheduledEnd, scheduledFor, title});
  await processOfferForNewMeeting(meeting);
  res.json(meeting)
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