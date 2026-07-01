import type { Request, Response } from 'express';
import { createMeeting } from '../backend/update/meeting-update.js';
import { addHour, determineTargetType } from '../backend/utils.js';
import { resolveGroupForMeeting } from '../backend/group.js';
import { processOffersForNewMeeting } from '../backend/process-meeting.js';
import { setOffersExpired } from '../backend/offer.js';
import { getCreatedMeetings } from '../backend/query/meeting-lookup.js';
import { findBroadcastedMeetings } from '../backend/meeting.js';
import { getIsBroadcasting, getUserContextInfo } from '../backend/query/user-lookup.js';
import { getMeetingOffers } from '../backend/query/offer-lookup.js';
import {
    IMMEDIATE_TIME_TYPE,
    USER_INTENT_SOURCE_TYPE,
    SEARCHING_MEETING_STATE,
    CANCELED_MEETING_STATE,
    isOpenBroadcast,
    DRAFT_MEETING_STATE
} from '../types.js';
import { transitionMeeting } from '../backend/transition-meeting.js';
import { shouldShowMeeting } from '../backend/meeting-staleness.js';
import { eventBus, EVENT_TYPES } from '../backend/events/index.js';

export const handleBroadcastNow = async (req: Request, res: Response) => {
    const { userId, targetUserIds, intentLabel, groupId } = req.body;
    console.log("broadcast now --", { userId });

    if (!userId) {
        return res.status(400).json({ error: "userId is required" });
    }

    try {
        // Check if user already has an active OPEN broadcast (broadcasting to all friends)
        const createdMeetings = await getCreatedMeetings({userFromId: userId});

        // Find active broadcasts - must be open broadcast and should be visible (not stale or terminal)
        let activeBroadcast = null;
        for (const m of createdMeetings) {
            if (isOpenBroadcast(m) && await shouldShowMeeting(m)) {
                activeBroadcast = m;
                break;
            }
        }

        if (activeBroadcast) {
            // do not make a new broadcast and use the existing one.
            const offers = await getMeetingOffers({meetingId: activeBroadcast.id});
            await setOffersExpired(offers);
        }

        const scheduledFor = new Date();
        const scheduledEnd = addHour(scheduledFor);

        let resolvedTargetUserIds: string[] = targetUserIds || [];
        let resolvedGroupName: string | undefined;
        let resolvedTargetType = determineTargetType(resolvedTargetUserIds);

        if (groupId) {
            const resolved = await resolveGroupForMeeting({ groupId, requesterId: userId });
            resolvedTargetUserIds = resolved.memberIds;
            resolvedGroupName = resolved.groupName;
            resolvedTargetType = 'GROUP';
        }

        console.log('[METRICS] api.broadcast_now', {
            userId,
            targetType: resolvedTargetType,
            targetUserCount: resolvedTargetUserIds.length || 'all'
        });

        const meeting = await createMeeting({
            userFromId: userId,
            scheduledFor,
            scheduledEnd,
            title: 'This is a broadcast meeting',
            meetingState: SEARCHING_MEETING_STATE,
            meetingType: 'BROADCAST', // Keep for backwards compatibility
            timeType: IMMEDIATE_TIME_TYPE,
            targetType: resolvedTargetType,
            sourceType: USER_INTENT_SOURCE_TYPE,
            targetUserIds: resolvedTargetUserIds,
            minParticipants: 1,
            maxParticipants: 1,
            intentLabel: intentLabel || null,
            ...(groupId && { groupId }),
            ...(resolvedGroupName && { groupName: resolvedGroupName }),
        });

        // Validate meeting was created successfully before creating offers
        if (!meeting || !meeting.id) {
            return res.status(500).json({ error: "Failed to create broadcast meeting" });
        }

        // Use unified offer processing for all broadcast types
        const processedMeeting = await processOffersForNewMeeting(meeting);

        res.json({ success: true, userId, meeting: processedMeeting });
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
        const meetings = await getCreatedMeetings({userFromId: userId});
        const broadcastMeetings = await findBroadcastedMeetings(meetings);
        const filteredBroadcastMeetings = broadcastMeetings.filter(m => m.meetingState !== DRAFT_MEETING_STATE);
        // should be just one meeting, but want to account for error state
        // where there are somehow two broadcast meetings.
        for (let broadcastMeeting of filteredBroadcastMeetings) {
            // Only process if meeting should still be visible (not already terminal or stale)
            if (await shouldShowMeeting(broadcastMeeting)) {
                const {meeting, events} = await transitionMeeting({
                    meetingId: broadcastMeeting.id,
                    toState: CANCELED_MEETING_STATE,
                    actorId: userId,
                });

                const offers = await getMeetingOffers({meetingId: broadcastMeeting.id});
                await setOffersExpired(offers);

                // Emit event to notify offer recipients
                const broadcaster = await getUserContextInfo({ userId });
                const recipientIds = offers.map(o => o.userOfferedId);
                if (recipientIds.length > 0) {
                    console.log("Triggering emitting the event (broadcast ended).")
                    eventBus.emitEvent({
                        type: EVENT_TYPES.BROADCAST_ENDED,
                        meetingId: broadcastMeeting.id,
                        broadcasterId: userId,
                        broadcasterDisplayName: broadcaster?.displayUsername
                            || broadcaster?.username
                            || broadcaster?.name
                            || 'A friend',
                        offerRecipientIds: recipientIds,
                    });
                }
            }
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
