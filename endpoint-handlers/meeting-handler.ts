import { createMeeting, getAcceptedMeetings } from "../backend/meeting.js";
import { getCreatedMeetings } from "../backend/meeting.js";
import { processOfferForNewMeeting } from "../backend/process-meeting.js";

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
  const acceptedMeetings = await getAcceptedMeetings({acceptedUserId: userFromId});
  res.json([...meetings, ...acceptedMeetings])
}