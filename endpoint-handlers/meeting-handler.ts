import { createMeeting, getCreatedMeetings } from "../backend/meeting.ts";


export const handleCreateMeeting = async (req, res) => {
  const {userFromId, scheduledEnd, scheduledFor, title} = req.body;
  console.log("Create Meeting---------")
  console.log({userFromId, scheduledEnd, scheduledFor, title})
  const meeting = await createMeeting({userFromId, scheduledEnd, scheduledFor, title});
  console.log("Created: ")
  console.log(meeting)
  res.json(meeting)
}

export const handleGetMeetings = async (req, res) => {
  const {userFromId} = req.body;
  const meetings = await getCreatedMeetings({userFromId});
  res.json(meetings)
}