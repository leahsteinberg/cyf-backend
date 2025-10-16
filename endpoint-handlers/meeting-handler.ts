import { createMeeting, getCreatedMeetings } from "../backend/meeting.ts";


export const handleCreateMeeting = async (req, res) => {
  const {userFromId, scheduledEnd, scheduledFor, title} = req.body;
  const meeting = await createMeeting({userFromId, scheduledEnd, scheduledFor, title});
  res.json(meeting)
}

export const handleGetMeetings = async (req, res) => {
  const {userFromId} = req.body;
  const meetings = await getCreatedMeetings({userFromId});
  res.json(meetings)
}