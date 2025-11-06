import { createMeeting } from "../backend/meeting.ts";
import { getCreatedMeetings } from "../backend/meeting.ts";
import { processOfferForNewMeeting, processOffersForMeeting } from "../backend/process-meeting.ts";

export const handleCreateMeeting = async (req, res) => {
  const {userFromId, scheduledEnd, scheduledFor, title} = req.body;
  console.log("Create Meeting---------")
  console.log({userFromId, scheduledEnd, scheduledFor, title})
  const meeting = await createMeeting({userFromId, scheduledEnd, scheduledFor, title});
  const processedMeeting = await processOfferForNewMeeting(meeting);
  //
  // const processedMeeting = await processOffersForMeeting(meeting);
  console.log("Processed Meeting-----", processedMeeting)
  // generate offer for meeting
  res.json(processedMeeting)
}

export const handleGetMeetings = async (req, res) => {
  const {userFromId} = req.body;
  const meetings = await getCreatedMeetings({userFromId});
  res.json(meetings)
}