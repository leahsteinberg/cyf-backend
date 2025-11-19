import { getAllSearchingMeetings } from "../backend/query/meeting-lookup.js";
import { processOffersForMeeting } from "../backend/process-meeting.js";
import type { Request, Response } from 'express';

let count = 0;

export const handleCronRound = async (req: Request, res: Response) => {
    const openMeetings = await getAllSearchingMeetings();
    console.log('Handle Cron Round', count);
    count++;

    for (const meeting of openMeetings) {
        console.log("meeting is:", meeting.id, meeting.meetingState, " ------------ ")
        const processedMeeting = await processOffersForMeeting(meeting)
    }

    res.json({ success: true, processedCount: openMeetings.length, round: count - 1 });
}