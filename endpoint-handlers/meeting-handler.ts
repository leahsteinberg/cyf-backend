import { createMeeting } from "../backend/meeting.ts";
import { getCreatedMeetings } from "../backend/meeting.ts";
import { , makeOfferForNewMeeting, processOfferForNewMeeting, processOffersForMeeting } from "../backend/process-meeting.ts";

export const handleCreateMeeting = async (req, res) => {
  
  const {userFromId, scheduledEnd, scheduledFor, title} = req.body;
  const meeting = await createMeeting({userFromId, scheduledEnd, scheduledFor, title});
  const processedMeeting = await processOfferForNewMeeting(meeting);

  console.log("Created Meeting---------", meeting);
  console.log("Processed Meeting-----", processedMeeting);

  res.json(processedMeeting)
}

export const handleGetMeetings = async (req, res) => {
  const {userFromId} = req.body;
  const meetings = await getCreatedMeetings({userFromId});
  res.json(meetings)
}