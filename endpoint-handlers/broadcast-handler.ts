import type { Request, Response } from 'express';
import { getFriendIds } from '../backend/friendship.js';
import { createMeeting } from '../backend/meeting.js';
import { addHour } from '../backend/utils.js';

export const handleBroadcastNow = async (req: Request, res: Response) => {
    const { userId } = req.body;
    console.log("broadcast now --", { userId });

    if (!userId) {
        return res.status(400).json({ error: "userId is required" });
    }

    try {
        // TODO: Implement broadcast now logic
        const allFriends = await getFriendIds({id: userId});
        const scheduledFor = new Date();
        const scheduledEnd = addHour(scheduledFor);

        const meeting = await createMeeting({ 
            userFromId: userId,
            scheduledFor,
            scheduledEnd,
            title: '' }
        );
        

        // create a meeting that starts now and ends in 1 hour.
        // special type of meeting which is a broadcast meeting
        // send a special type of offer





        res.json({ success: true, userId });
    } catch (error) {
        console.error("Error in broadcast now:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ error: "Internal server error", details: errorMessage });
    }
};

export const handleBroadcastEnd = async (req: Request, res: Response) => {
    const { userId } = req.body;
    console.log("broadcast end --", { userId });

    if (!userId) {
        return res.status(400).json({ error: "userId is required" });
    }

    try {
        // TODO: Implement broadcast end logic

        res.json({ success: true, userId });
    } catch (error) {
        console.error("Error in broadcast end:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ error: "Internal server error", details: errorMessage });
    }
};
