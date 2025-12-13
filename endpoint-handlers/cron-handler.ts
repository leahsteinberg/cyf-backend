import { getAllSearchingMeetings } from "../backend/query/meeting-lookup.js";
import { processOffersForMeeting } from "../backend/process-meeting.js";
import type { Request, Response } from 'express';

let count = 0;

export const handleCronRound = async (req: Request, res: Response) => {
    const openMeetings = await getAllSearchingMeetings();
    console.log('Handle Cron Round', count);
    count++;

    // TODO: Add cleanup logic for old DISMISSED meetings
    // - Keep DISMISSED meetings for 30 days for analytics
    // - After 30 days, delete them to avoid DB bloat
    // - Query: DELETE FROM meeting WHERE meetingState = 'DISMISSED' AND createdAt < NOW() - INTERVAL '30 days'
    // This helps:
    //   1. Track which suggestions users dismiss (ML training data)
    //   2. Calculate acceptance/dismissal rates
    //   3. Improve suggestion algorithms based on user preferences

    for (const meeting of openMeetings) {
        //console.log("meeting is:", meeting.id, meeting.meetingState, " ------------ ")
        const processedMeeting = await processOffersForMeeting(meeting)
    }

    res.json({ success: true, processedCount: openMeetings.length, round: count - 1 });
}