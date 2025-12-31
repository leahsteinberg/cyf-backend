import { createMeeting, deleteMeetingAndOffers } from "../backend/update/meeting-update.js";
import { getCreatedMeetings, getAcceptedMeetings, getMeetingById, enrichMeetingsWithAcceptedUsers } from "../backend/query/meeting-lookup.js";
import { processOffersForNewMeeting } from "../backend/process-meeting.js";
import { ACCEPTED_MEETING_STATE, CANCELED_MEETING_STATE, DISMISSED_DRAFT_MEETING_STATE, EXPIRED_MEETING_STATE, IMMEDIATE_TIME_TYPE, OPEN_TARGET_TYPE, PAST_MEETING_STATE, REJECTED_MEETING_STATE, SEARCHING_MEETING_STATE, SYSTEM_REAL_TIME_SOURCE_TYPE, isBroadcastMeeting, isOpenBroadcast } from "../types.js";
import { unacceptMeetingByAcceptor } from "../backend/meeting.js";
import { findMeetingTimeConflict } from "../backend/meeting-conflict.js";
import { transitionMeeting } from "../backend/transition-meeting.js";
import { getMeetingOffers, setOffersExpired } from "../backend/offer.js";
import { getIsBroadcasting } from "../backend/query/user-lookup.js";
import { setIsBroadcasting, setIsNotBroadcasting } from "../backend/update/user-update.js";
import { isBroadcastingToUser } from "../backend/broadcast-to-user.js";
export const handleCreateMeeting = async (req, res) => {
    const { userFromId, scheduledEnd, scheduledFor, title, 
    // OLD API (deprecated)
    meetingType, targetUserId, // OLD: single user ID (deprecated)
    // NEW API (preferred)
    timeType, targetType, sourceType, intentLabel, targetUserIds // NEW: array of user IDs
     } = req.body;
    console.log("in createMeeting, got target user ids", targetUserIds);
    try {
        // Check if user already has any active meetings (created or accepted) that overlap with the requested time
        const createdMeetings = await getCreatedMeetings({ userFromId });
        const acceptedMeetings = await getAcceptedMeetings({ acceptedUserId: userFromId });
        // Use centralized conflict checking logic
        const conflict = findMeetingTimeConflict({
            userCreatedMeetings: createdMeetings,
            userAcceptedMeetings: acceptedMeetings,
            scheduledFor: new Date(scheduledFor),
            scheduledEnd: new Date(scheduledEnd)
        });
        if (conflict) {
            const errorMessage = conflict.type === 'created'
                ? "You already have a meeting you created at this time"
                : "You already have a meeting you accepted at this time";
            return res.status(409).json({
                error: errorMessage,
                existingMeeting: conflict.conflictingMeeting
            });
        }
        // Create meeting with dual-write support (old or new API)
        const meeting = await createMeeting({
            userFromId,
            scheduledEnd,
            scheduledFor,
            title,
            // Support both old and new API
            meetingType: meetingType || undefined,
            timeType: timeType || undefined,
            targetType: targetType || undefined,
            sourceType: sourceType || undefined,
            intentLabel: intentLabel || undefined,
            // Handle both old (targetUserId: string) and new (targetUserIds: string[]) formats
            targetUserIds: targetUserIds || (targetUserId ? [targetUserId] : undefined)
        });
        // Validate meeting was created successfully
        if (!meeting || !meeting.id) {
            return res.status(500).json({ error: "Failed to create meeting" });
        }
        await processOffersForNewMeeting(meeting); // TODO - Can I remove this and reuse code instead?
        res.json(meeting);
    }
    catch (error) {
        console.error("Error creating meeting:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ error: "Failed to create meeting", details: errorMessage });
    }
};
export const handleGetMeetings = async (req, res) => {
    const { userFromId } = req.body;
    const meetings = await getCreatedMeetings({ userFromId });
    const acceptedMeetings = await getAcceptedMeetings({ acceptedUserId: userFromId });
    const allMeetings = [...meetings, ...acceptedMeetings];
    // Check for OPEN broadcast meetings (broadcasting to all friends)
    // isBroadcasting flag is specifically for OPEN broadcasts, not targeted broadcasts
    const openBroadcastMeetings = allMeetings.filter(m => isOpenBroadcast(m));
    const invalidOpenBroadcasts = openBroadcastMeetings.filter(m => m.meetingState === PAST_MEETING_STATE ||
        m.meetingState === EXPIRED_MEETING_STATE ||
        m.meetingState === CANCELED_MEETING_STATE);
    const validOpenBroadcasts = openBroadcastMeetings.filter(m => m.meetingState === SEARCHING_MEETING_STATE ||
        m.meetingState === ACCEPTED_MEETING_STATE ||
        m.meetingState === REJECTED_MEETING_STATE);
    // If there are invalid OPEN broadcasts but no valid ones, set isBroadcasting to false
    if (invalidOpenBroadcasts.length > 0 && validOpenBroadcasts.length === 0) {
        await setIsNotBroadcasting({ userId: userFromId });
    }
    // Filter out ALL invalid broadcasts (both OPEN and targeted) and dismissed drafts
    const filteredMeetings = allMeetings.filter(m => {
        if (m.meetingState === DISMISSED_DRAFT_MEETING_STATE)
            return false;
        // Hide invalid broadcasts (any IMMEDIATE meeting, not just OPEN)
        if (isBroadcastMeeting(m) && (m.meetingState === PAST_MEETING_STATE ||
            m.meetingState === EXPIRED_MEETING_STATE ||
            m.meetingState === CANCELED_MEETING_STATE)) {
            return false;
        }
        return true;
    });
    // Enrich meetings with acceptedUsers array
    const enrichedMeetings = await enrichMeetingsWithAcceptedUsers(filteredMeetings);
    res.json(enrichedMeetings);
};
export const handleCancelMeeting = async (req, res) => {
    const { meetingId, userId } = req.body;
    console.log("handle cancel meeting ---", meetingId);
    if (!meetingId) {
        return res.status(400).json({ error: "meetingId is required" });
    }
    try {
        const { meeting, events } = await transitionMeeting({ meetingId, toState: CANCELED_MEETING_STATE, actorId: userId });
        console.log("did transition- ", meeting);
        if (meeting) {
            const offers = await getMeetingOffers({ meetingId });
            await setOffersExpired(offers);
        }
        // Check if this is an OPEN broadcast (isBroadcasting flag is only for OPEN broadcasts)
        const isAnOpenBroadcast = isOpenBroadcast(meeting);
        const isAcceptor = meeting.acceptedUserIds.includes(userId);
        const isInitiatorBroadcasting = await isBroadcastingToUser({ possibleBroadcasterId: meeting.userFromId, userId });
        /// if someone accepts an OPEN broadcast meeting then cancels it,
        // need to re-spawn a broadcast meeting for the original user so they stay broadcasting
        // this is a special case that I should consider refactoring in the future.
        // NOTE: This logic only applies to OPEN broadcasts, not targeted broadcasts
        if (isAnOpenBroadcast && isInitiatorBroadcasting && !isAcceptor) {
            // the canceling party in this case is the person who started the broadcast
            // therefore, they are opting to end the broadcast
            console.log("they are opting to end the broadcast");
            await setIsNotBroadcasting({ userId: meeting.userFromId });
            // Enrich meeting with acceptedUsers array
            const [enrichedMeeting] = await enrichMeetingsWithAcceptedUsers([meeting]);
            res.json(enrichedMeeting);
        }
        if (isAnOpenBroadcast && isInitiatorBroadcasting && isAcceptor) {
            console.log("acceptor is canceling broadcast meeting");
            // the canceling party is NOT the broadcaster
            // therefore they should not affect the broadcast
            await createMeeting({
                userFromId: meeting.userFromId,
                scheduledEnd: meeting.scheduledEnd,
                scheduledFor: meeting.scheduledFor,
                title: meeting.title || '',
                meetingType: 'BROADCAST',
                meetingState: SEARCHING_MEETING_STATE,
                timeType: IMMEDIATE_TIME_TYPE,
                targetType: OPEN_TARGET_TYPE,
                sourceType: SYSTEM_REAL_TIME_SOURCE_TYPE,
            });
            await setIsBroadcasting({ userId: meeting.userFromId });
            // Enrich meeting with acceptedUsers array
            const [enrichedMeeting] = await enrichMeetingsWithAcceptedUsers([meeting]);
            res.json(enrichedMeeting);
        }
        // TODO - if the initiator cancels, then it's a full cancel,
        // no re-spawn.
        // If a/the acceptor cancels, we decide if we re-spawn or not.
        res.json(meeting);
    }
    catch (error) {
        console.error("Error canceling meeting:", error);
        res.status(500).json({ error: "Internal server error while canceling meeting" });
    }
};
//# sourceMappingURL=meeting-handler.js.map