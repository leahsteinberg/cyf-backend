import type { Request, Response } from 'express';
import { getMeetingById, getCreatedMeetings, getAcceptedMeetings } from '../backend/query/meeting-lookup.js';
import { setMeetingState } from '../backend/update/meeting-update.js';
import { processOfferForNewMeeting } from '../backend/process-meeting.js';
import { getEffectiveTimeType, getEffectiveTargetType } from '../types.js';
import { findMeetingTimeConflict } from '../backend/meeting-conflict.js';

/**
 * Accepts a suggestion (DRAFT meeting) and converts it to an active meeting
 *
 * Flow:
 * 1. Verify the suggestion exists and is in DRAFT state
 * 2. Check for time conflicts (if time is known)
 * 3. Update state: DRAFT → SEARCHING
 * 4. Create offers based on timeType + targetType:
 *    - IMMEDIATE + OPEN → Broadcast offers to all friends
 *    - FUTURE + OPEN → Parallel offers to all friends
 *    - UNKNOWN + FRIEND_SPECIFIC → No offers yet (waiting for time)
 *    - FUTURE + FRIEND_SPECIFIC → Single offer to target friend
 *
 * NOTE: For UNKNOWN timeType, we don't create offers yet. User will need to
 * set a time first, then offers will be created.
 */
export const handleAcceptSuggestion = async (req: Request, res: Response) => {
    const { meetingId, userId } = req.body;

    console.log("Accepting suggestion:", { meetingId, userId });

    if (!meetingId || !userId) {
        return res.status(400).json({ error: "meetingId and userId are required" });
    }

    try {
        // 1. Get the suggestion (DRAFT meeting)
        const suggestion = await getMeetingById({ meetingId });

        if (!suggestion) {
            return res.status(404).json({ error: "Suggestion not found" });
        }

        // 2. Verify ownership
        if (suggestion.userFromId !== userId) {
            return res.status(403).json({ error: "You can only accept your own suggestions" });
        }

        // 3. Verify it's in DRAFT state
        if (suggestion.meetingState !== 'DRAFT') {
            return res.status(400).json({
                error: "Only DRAFT suggestions can be accepted",
                currentState: suggestion.meetingState
            });
        }

        // 4. Get effective types to understand what kind of meeting this will become
        const timeType = getEffectiveTimeType(suggestion);
        const targetType = getEffectiveTargetType(suggestion);

        console.log(`Converting suggestion to active meeting: timeType=${timeType}, targetType=${targetType}`);

        // 5. Check for time conflicts (only if time is known)
        // UNKNOWN timeType meetings don't conflict since they have no set time yet
        if (timeType !== 'UNKNOWN') {
            const createdMeetings = await getCreatedMeetings({ userFromId: userId });
            const acceptedMeetings = await getAcceptedMeetings({ acceptedUserId: userId });

            // Use centralized conflict checking logic (excludes this suggestion)
            const conflict = findMeetingTimeConflict({
                userCreatedMeetings: createdMeetings,
                userAcceptedMeetings: acceptedMeetings,
                scheduledFor: new Date(suggestion.scheduledFor),
                scheduledEnd: new Date(suggestion.scheduledEnd),
                excludeMeetingId: meetingId // Don't check against itself
            });

            if (conflict) {
                const errorMessage = conflict.type === 'created'
                    ? "You already have a meeting at this time"
                    : "You already have a meeting you accepted at this time";
                return res.status(409).json({
                    error: errorMessage,
                    existingMeeting: conflict.conflictingMeeting
                });
            }
        }

        // 6. Activate the suggestion: DRAFT → SEARCHING
        await setMeetingState({ meetingId, meetingState: 'SEARCHING' });

        // 7. Refresh meeting data
        const activatedMeeting = await getMeetingById({ meetingId });

        if (!activatedMeeting) {
            return res.status(500).json({ error: "Failed to retrieve activated meeting" });
        }

        // 8. Create offers based on timeType and targetType
        // This will route to the correct offer creation logic:
        // - IMMEDIATE + OPEN → processNewBroadcastMeeting (parallel broadcast offers)
        // - FUTURE + OPEN → processNewFutureOpenMeeting (parallel offers to all friends)
        // - FRIEND_SPECIFIC → processNewFriendSpecificMeeting (single offer to target)
        // - UNKNOWN → No offers created yet (will be created when time is set)
        await processOfferForNewMeeting(activatedMeeting);

        console.log("Suggestion accepted and converted to active meeting:", {
            meetingId,
            timeType,
            targetType,
            offersCreated: timeType !== 'UNKNOWN'
        });

        res.json({
            success: true,
            meeting: activatedMeeting,
            // Helpful info for client
            metadata: {
                timeType,
                targetType,
                offersCreated: timeType !== 'UNKNOWN',
                // If UNKNOWN time, client should prompt user to set a time
                requiresTimeSelection: timeType === 'UNKNOWN'
            }
        });
    } catch (error) {
        console.error("Error accepting suggestion:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({
            error: "Failed to accept suggestion",
            details: errorMessage
        });
    }
};

/**
 * Dismisses a suggestion (DRAFT meeting) by marking it as DISMISSED
 *
 * Benefits of DISMISSED state:
 * - Tracking which suggestions users dismissed (for ML/learning)
 * - Analytics on suggestion acceptance rate
 * - Potentially un-dismissing a suggestion later
 * - Auditing and debugging suggestion systems
 *
 * DISMISSED meetings should be:
 * - Excluded from handleGetMeetings (user's active meeting list)
 * - Excluded from time conflict checks
 * - Cleaned up by cron job after 30+ days (for analytics retention)
 * - Available for analytics queries to improve suggestion algorithms
 */
export const handleDismissSuggestion = async (req: Request, res: Response) => {
    const { meetingId, userId } = req.body;

    console.log("Dismissing suggestion:", { meetingId, userId });

    if (!meetingId || !userId) {
        return res.status(400).json({ error: "meetingId and userId are required" });
    }

    try {
        // 1. Get the suggestion
        const suggestion = await getMeetingById({ meetingId });

        if (!suggestion) {
            return res.status(404).json({ error: "Suggestion not found" });
        }

        // 2. Verify ownership
        if (suggestion.userFromId !== userId) {
            return res.status(403).json({ error: "You can only dismiss your own suggestions" });
        }

        // 3. Verify it's in DRAFT state
        if (suggestion.meetingState !== 'DRAFT') {
            return res.status(400).json({
                error: "Only DRAFT suggestions can be dismissed",
                currentState: suggestion.meetingState
            });
        }

        // 4. Mark as DISMISSED (instead of deleting)
        await setMeetingState({ meetingId, meetingState: 'DISMISSED' });

        // 5. Refresh to get updated meeting
        const dismissedSuggestion = await getMeetingById({ meetingId });

        console.log("Suggestion dismissed:", {
            meetingId,
            timeType: getEffectiveTimeType(suggestion),
            targetType: getEffectiveTargetType(suggestion),
            intentLabel: suggestion.intentLabel
        });

        res.json({
            success: true,
            dismissedSuggestion
        });
    } catch (error) {
        console.error("Error dismissing suggestion:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({
            error: "Failed to dismiss suggestion",
            details: errorMessage
        });
    }
};

/**
 * TODO: Future endpoint - Set time for UNKNOWN time suggestions
 *
 * This would convert:
 * - DRAFT + UNKNOWN time → DRAFT + FUTURE time (still a suggestion, but with a time now)
 * OR
 * - DRAFT + UNKNOWN time → SEARCHING + FUTURE time (if we want to auto-activate)
 *
 * Then create offers based on the newly set time.
 *
 * export const handleSetSuggestionTime = async (req: Request, res: Response) => {
 *   const { meetingId, userId, scheduledFor, scheduledEnd } = req.body;
 *
 *   // 1. Get suggestion
 *   // 2. Verify DRAFT + UNKNOWN time
 *   // 3. Update scheduledFor and scheduledEnd
 *   // 4. Update timeType: UNKNOWN → FUTURE
 *   // 5. Optionally activate (DRAFT → SEARCHING)
 *   // 6. Create offers
 * }
 */
