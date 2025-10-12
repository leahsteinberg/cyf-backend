import { createMeeting, getCreatedMeetings } from "../backend/meeting.ts";


export const handleCreateMeeting = async (req, res) => {
  const {userFromId} = req.body;
  const meeting = await createMeeting({userFromId});
  const retrievedMeetings = await getCreatedMeetings({userFromId})
  console.log("Created Meeting - ", meeting)
  console.log("got these meetings -", retrievedMeetings)
  res.json(meeting)
}

export const handleGetMeetings = async (req, res) => {
  const {userFromId} = req.body;
  console.log("in handle Get meetings - ", {userFromId})
  const meetings = await getCreatedMeetings({userFromId});
  console.log("recieved meetings", meetings)
  res.json(meetings)
}