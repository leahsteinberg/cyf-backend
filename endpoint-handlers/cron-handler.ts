import { getAllSearchingMeetings } from "../backend/meeting.ts";
import { processOffersForMeeting } from "../backend/process-meeting.ts";
import { isTimePast } from "../backend/utils.ts";
let count = 0;

export const handleCronRound = async (req, res) => {
    const openMeetings = await getAllSearchingMeetings();
    console.log('Handle Cron Round', count);

    count++;
    for (const meeting of openMeetings) {
        console.log("meeting is - ", meeting)
        const past = await isTimePast({eventTime: meeting.scheduledFor})
        //const processedMeeting = await processOffersForMeeting(meeting)
        console.log("past", past);
        console.log("-------------------------------- ONE MEETING DONE")

    }
}