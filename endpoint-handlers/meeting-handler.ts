import { createMeeting, getAcceptedMeetings, deleteMeeting } from "../backend/meeting.js";
import { getCreatedMeetings } from "../backend/meeting.js";
import { processOfferForNewMeeting } from "../backend/process-meeting.js";
import type { Request, Response } from 'express';


export const handleCreateMeeting = async (req: Request, res: Response) => {
  
  const {userFromId, scheduledEnd, scheduledFor, title} = req.body;
  const meeting = await createMeeting({userFromId, scheduledEnd, scheduledFor, title});
  const processedMeeting = await processOfferForNewMeeting(meeting);

  console.log("Created Meeting---------", meeting);
  console.log("Processed Meeting-----", processedMeeting);

  res.json(processedMeeting)
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
    const deletedMeeting = await deleteMeeting({ meetingId });
    res.json(deletedMeeting);
  } catch (error) {
    console.error("Error deleting meeting:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}