import { getAllSearchingMeetings, simulateProcessMeeting } from "../backend/meeting.ts";

export const handleSimulateCronRound = async (req, res) => {
    console.log("handleSimulateCronRound")
    const openMeetings = await getAllSearchingMeetings();
    const firstMeeting = openMeetings[0];
    //const newOffer = await createOffer({meetingId: firstMeeting.id})

    const processedFirstMeeting = await simulateProcessMeeting(firstMeeting)
    // const newMeetings = await Promise.all(newOpenMeetings.map(processMeeting));
    // for (let i = 0; i < newMeetings.length; i++) {
    //     console.log("i", i)
    //     console.log("meeting id",  newMeetings[i].meetingId)
    //     console.log("offers: ", newMeetings[i].offers);
    // }   
    
    console.log("-------------------------------- DONE")

    // 



    // //const unwrapped = await Promise.all(newMeetings)

    res.json("hiya")
    // if there is an offer out, set it to expired and create a new one.
    // if there are no more friends to send offers to, then set the meeting
    // as unmatched.

    // 1. find all "searching" meetings.
    //// if no offer, create an offer
    //// if offer, set to expired (later will base on expired time.)
    //// if new offer not possible (no more friends), set meeting to unmatched.

}