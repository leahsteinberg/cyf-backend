import { getAllSearchingMeetings } from "../backend/meeting.js";
import { processOffersForMeeting } from "../backend/process-meeting.js";

let count = 0;

export const handleCronRound = async (req, res) => {
    const openMeetings = await getAllSearchingMeetings();
    console.log('Handle Cron Round', count);
    count++;

    for (const meeting of openMeetings) {
        console.log("meeting is - ", meeting)
        //const processedMeeting = await processOffersForMeeting(meeting)
        console.log("-------------------------------- ONE MEETING DONE")
    }
}