import { createMeeting } from '../backend/update/meeting-update.js';
import { addHour, determineTargetType, minutesSince } from '../backend/utils.js';
import { processNewBroadcastMeeting } from '../backend/process-broadcast.js';
import { processOffersForNewMeeting } from '../backend/process-meeting.js';
import { setOffersExpired } from '../backend/offer.js';
import { getCreatedMeetings } from '../backend/query/meeting-lookup.js';
import { findBroadcastedMeetings } from '../backend/meeting.js';
import { setIsBroadcasting, setIsNotBroadcasting } from '../backend/update/user-update.js';
import { getIsBroadcasting } from '../backend/query/user-lookup.js';
import { getMeetingOffers, getOfferById } from '../backend/query/offer-lookup.js';
import { IMMEDIATE_TIME_TYPE, OPEN_TARGET_TYPE, FRIEND_SPECIFIC_TARGET_TYPE, GROUP_TARGET_TYPE, PAST_MEETING_STATE, USER_INTENT_SOURCE_TYPE, SEARCHING_MEETING_STATE, CANCELED_MEETING_STATE, isOpenBroadcast } from '../types.js';
import { transitionMeeting } from '../backend/transition-meeting.js';
export const handleBroadcastNow = async (req, res) => {
    const { userId, targetUserIds } = req.body;
    console.log("broadcast now --", { userId });
    if (!userId) {
        return res.status(400).json({ error: "userId is required" });
    }
    try {
        // Check if user already has an active OPEN broadcast (broadcasting to all friends)
        const createdMeetings = await getCreatedMeetings({ userFromId: userId });
        const activeBroadcast = createdMeetings.find(m => {
            return isOpenBroadcast(m) && m.meetingState !== PAST_MEETING_STATE;
        });
        if (activeBroadcast) {
            // do not make a new broadcast and use the existing one.
            const offers = await getMeetingOffers({ meetingId: activeBroadcast.id });
            const expiredOffers = await setOffersExpired(offers);
            await setIsNotBroadcasting({ userId });
        }
        const scheduledFor = new Date();
        const scheduledEnd = addHour(scheduledFor);
        // Determine targetType based on targetUserIds
        const targetType = determineTargetType(targetUserIds);
        console.log('[METRICS] api.broadcast_now', {
            userId,
            targetType,
            targetUserCount: targetUserIds?.length || 'all'
        });
        const meeting = await createMeeting({
            userFromId: userId,
            scheduledFor,
            scheduledEnd,
            title: 'This is a broadcast meeting',
            meetingState: SEARCHING_MEETING_STATE,
            meetingType: 'BROADCAST', // Keep for backwards compatibility
            timeType: IMMEDIATE_TIME_TYPE,
            targetType,
            sourceType: USER_INTENT_SOURCE_TYPE,
            targetUserIds: targetUserIds || [],
            minParticipants: 1,
            maxParticipants: 1,
        });
        // Validate meeting was created successfully before creating offers
        if (!meeting || !meeting.id) {
            return res.status(500).json({ error: "Failed to create broadcast meeting" });
        }
        // Process offers based on whether it's OPEN or targeted
        let processedBroadcast;
        if (targetType === OPEN_TARGET_TYPE) {
            // OPEN broadcast: use specialized process-broadcast logic
            processedBroadcast = await processNewBroadcastMeeting({ meeting });
            // Set user as broadcasting (only for OPEN broadcasts)
            await setIsBroadcasting({ userId });
        }
        else {
            // Targeted broadcast: use general offer processing (will route to targeted broadcast handler)
            processedBroadcast = await processOffersForNewMeeting(meeting);
            // await setIsBroadcasting({ userId });
            // need to handle the "isBroadcasting" state for smaller broadcasts
        }
        res.json({ success: true, userId, meeting: processedBroadcast });
    }
    catch (error) {
        console.error("Error in broadcast now:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ error: "Internal server error", details: errorMessage });
    }
};
export const handleBroadcastEnd = async (req, res) => {
    const { userId } = req.body;
    console.log("broadcast end --", { userId });
    if (!userId) {
        return res.status(400).json({ error: "userId is required" });
    }
    try {
        // Set user as not broadcasting
        await setIsNotBroadcasting({ userId });
        const meetings = await getCreatedMeetings({ userFromId: userId });
        const broadcastMeetings = await findBroadcastedMeetings(meetings);
        // should be just one meeting, but want to account for error state
        // where there are somehow two broadcast meetings.
        for (let broadcastMeeting of broadcastMeetings) {
            if (broadcastMeeting.meetingState !== PAST_MEETING_STATE) {
                const { meeting, events } = await transitionMeeting({
                    meetingId: broadcastMeeting.id,
                    toState: CANCELED_MEETING_STATE,
                    actorId: userId,
                });
            }
            const offers = await getMeetingOffers({ meetingId: broadcastMeeting.id });
            await setOffersExpired(offers);
        }
        res.json({ success: true, userId });
    }
    catch (error) {
        console.error("Error in broadcast end:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ error: "Internal server error", details: errorMessage });
    }
};
export const handleIsUserBroadcasting = async (req, res) => {
    const { userId } = req.body;
    console.log("is user broadcasting --", { userId });
    if (!userId) {
        return res.status(400).json({ error: "userId is required" });
    }
    try {
        const isBroadcasting = await getIsBroadcasting({ userId });
        res.json({ success: true, userId, isBroadcasting });
    }
    catch (error) {
        console.error("Error checking if user is broadcasting:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ error: "Internal server error", details: errorMessage });
    }
};
//# sourceMappingURL=broadcast-handler.js.map