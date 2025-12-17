import type { Request, Response } from 'express';
import { createMeeting } from '../backend/update/meeting-update.js';
import { addHour } from '../backend/utils.js';
import { processNewBroadcastMeeting } from '../backend/process-broadcast.js';
import { setOffersExpired } from '../backend/offer.js';
import { getCreatedMeetings } from '../backend/query/meeting-lookup.js';
import { findBroadcastedMeetings } from '../backend/meeting.js';
import { setIsBroadcasting, setIsNotBroadcasting } from '../backend/update/user-update.js';
import { getIsBroadcasting } from '../backend/query/user-lookup.js';
import { getMeetingOffers } from '../backend/query/offer-lookup.js';
import {
    getEffectiveTimeType,
    getEffectiveTargetType,
    IMMEDIATE_TIME_TYPE,
    OPEN_TARGET_TYPE,
    PAST_MEETING_STATE,
    USER_INTENT_SOURCE_TYPE,
    SEARCHING_MEETING_STATE,
    CANCELED_MEETING_STATE
} from '../types.js';
import { transitionMeeting } from '../backend/transition-meeting.js';

export const handleBroadcastNow = async (req: Request, res: Response) => {
    const { userId } = req.body;
    console.log("broadcast now --", { userId });

    if (!userId) {
        return res.status(400).json({ error: "userId is required" });
    }

    try {
        // Check if user already has an active broadcast (IMMEDIATE + OPEN)
        const createdMeetings = await getCreatedMeetings({userFromId: userId});
        const activeBroadcast = createdMeetings.find(m => {
            const isBroadcast = getEffectiveTimeType(m) === IMMEDIATE_TIME_TYPE && getEffectiveTargetType(m) === OPEN_TARGET_TYPE;
            return isBroadcast && m.meetingState !== PAST_MEETING_STATE;
        });

        // if (activeBroadcast) {
        //     return res.status(409).json({
        //         error: "You already have an active broadcast",
        //         existingBroadcast: activeBroadcast
        //     });
        // }

        const scheduledFor = new Date();
        const scheduledEnd = addHour(scheduledFor);

        // NOTE: Currently using old meetingType parameter for backwards compatibility
        // Future: Should migrate to timeType: 'IMMEDIATE', targetType: 'OPEN'
        console.log('[METRICS] api.broadcast_now.old_format', { userId });

        const meeting = await createMeeting({
            userFromId: userId,
            scheduledFor,
            scheduledEnd,
            title: 'This is a broadcast meeting',
            meetingState: SEARCHING_MEETING_STATE,
            meetingType: 'BROADCAST', // TODO: Migrate to timeType/targetType in Phase 6
            timeType: IMMEDIATE_TIME_TYPE,
            targetType: OPEN_TARGET_TYPE,
            sourceType: USER_INTENT_SOURCE_TYPE,
        });

        // Validate meeting was created successfully before creating offers
        if (!meeting || !meeting.id) {
            return res.status(500).json({ error: "Failed to create broadcast meeting" });
        }

        const processedBroadcast = await processNewBroadcastMeeting({ meeting });

        // Set user as broadcasting
        await setIsBroadcasting({ userId });

        res.json({ success: true, userId, meeting: processedBroadcast });
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
        // Set user as not broadcasting
        await setIsNotBroadcasting({ userId });

        const meetings = await getCreatedMeetings({userFromId: userId});
        const broadcastMeetings = await findBroadcastedMeetings(meetings);
        // should be just one meeting, but want to account for error state
        // where there are somehow two broadcast meetings.
        for (let broadcastMeeting of broadcastMeetings) {
            const {meeting, events} = await transitionMeeting({
                meetingId: broadcastMeeting.id,
                toState: CANCELED_MEETING_STATE,
                actorId: userId,
            });
            const offers = await getMeetingOffers({meetingId: meeting.id});
            await setOffersExpired(offers);
        }


        res.json({ success: true, userId });
    } catch (error) {
        console.error("Error in broadcast end:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ error: "Internal server error", details: errorMessage });
    }
};

export const handleIsUserBroadcasting = async (req: Request, res: Response) => {
    const { userId } = req.body;
    console.log("is user broadcasting --", { userId });

    if (!userId) {
        return res.status(400).json({ error: "userId is required" });
    }

    try {
        const isBroadcasting = await getIsBroadcasting({ userId });
        res.json({ success: true, userId, isBroadcasting });
    } catch (error) {
        console.error("Error checking if user is broadcasting:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ error: "Internal server error", details: errorMessage });
    }
};
