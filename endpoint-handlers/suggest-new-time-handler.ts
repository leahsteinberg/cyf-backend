import type { Request, Response } from 'express';
import { getMeetingById, enrichMeetingsWithAcceptedUsers } from '../backend/query/meeting-lookup.js';
import { suggestNewTime } from '../backend/ai/suggest-new-time-service.js';
import { createDraftMeeting } from '../backend/draft-meeting.js';
import { createMeeting } from '../backend/update/meeting-update.js';
import { processOffersForNewMeeting } from '../backend/process-meeting.js';
import { transitionMeeting } from '../backend/transition-meeting.js';
import {
    DRAFT_MEETING_STATE,
    SEARCHING_MEETING_STATE,
    PAST_MEETING_STATE,
    CANCELED_MEETING_STATE,
    EXPIRED_MEETING_STATE,
    DISMISSED_DRAFT_MEETING_STATE,
    REJECTED_MEETING_STATE,
    FUTURE_TIME_TYPE,
    SYSTEM_PATTERN_SOURCE_TYPE,
} from '../types.js';

const MAX_MODIFIER_LENGTH = 200;

const TERMINAL_STATES = [
    PAST_MEETING_STATE,
    CANCELED_MEETING_STATE,
    EXPIRED_MEETING_STATE,
    DISMISSED_DRAFT_MEETING_STATE,
    REJECTED_MEETING_STATE,
];

export const handleSuggestNewTime = async (req: Request, res: Response) => {
    const { meetingId, userId, modifier } = req.body;

    if (!meetingId || !userId || !modifier) {
        return res.status(400).json({ error: 'meetingId, userId, and modifier are required' });
    }

    if (typeof modifier !== 'string' || modifier.trim().length === 0) {
        return res.status(400).json({ error: 'modifier must be a non-empty string' });
    }

    if (modifier.length > MAX_MODIFIER_LENGTH) {
        return res.status(400).json({
            error: `modifier must be ${MAX_MODIFIER_LENGTH} characters or fewer`,
        });
    }

    try {
        // 1. Fetch original meeting
        const originalMeeting = await getMeetingById({ meetingId });
        if (!originalMeeting) {
            return res.status(404).json({ error: 'Meeting not found' });
        }

        // 2. Validate ownership - only the creator can suggest a new time
        if (originalMeeting.userFromId !== userId) {
            return res.status(403).json({ error: 'Only the meeting creator can suggest a new time' });
        }

        // 3. Get AI-suggested new time
        const suggestion = await suggestNewTime(originalMeeting, modifier.trim(), userId);
        if (!suggestion) {
            return res.status(500).json({ error: 'Failed to generate a new time suggestion' });
        }

        const newScheduledFor = new Date(suggestion.suggestedTime.startsAt);
        const newScheduledEnd = new Date(suggestion.suggestedTime.endsAt);

        // 4. Determine new meeting state: DRAFT if old was DRAFT or PAST, SEARCHING otherwise
        const oldState = originalMeeting.meetingState;
        const newMeetingState = (oldState === DRAFT_MEETING_STATE || oldState === PAST_MEETING_STATE)
            ? DRAFT_MEETING_STATE
            : SEARCHING_MEETING_STATE;

        // 5. Create new meeting with properties from original
        let newMeeting;
        if (newMeetingState === DRAFT_MEETING_STATE) {
            newMeeting = await createDraftMeeting({
                userFromId: originalMeeting.userFromId,
                scheduledFor: newScheduledFor,
                scheduledEnd: newScheduledEnd,
                title: originalMeeting.title || 'Rescheduled meeting',
                timeType: FUTURE_TIME_TYPE,
                targetType: originalMeeting.targetType || 'FRIEND_SPECIFIC',
                sourceType: SYSTEM_PATTERN_SOURCE_TYPE,
                targetUserIds: originalMeeting.targetUserIds,
                ...(originalMeeting.intentLabel && { intentLabel: originalMeeting.intentLabel }),
                ...(suggestion.reason && { suggestionReason: suggestion.reason }),
                minParticipants: originalMeeting.minParticipants ?? 1,
                maxParticipants: originalMeeting.maxParticipants ?? 1,
            });
        } else {
            newMeeting = await createMeeting({
                userFromId: originalMeeting.userFromId,
                scheduledFor: newScheduledFor,
                scheduledEnd: newScheduledEnd,
                title: originalMeeting.title || 'Rescheduled meeting',
                meetingState: SEARCHING_MEETING_STATE,
                timeType: FUTURE_TIME_TYPE,
                targetType: originalMeeting.targetType || 'FRIEND_SPECIFIC',
                sourceType: SYSTEM_PATTERN_SOURCE_TYPE,
                targetUserIds: originalMeeting.targetUserIds,
                ...(originalMeeting.intentLabel && { intentLabel: originalMeeting.intentLabel }),
                ...(suggestion.reason && { suggestionReason: suggestion.reason }),
                minParticipants: originalMeeting.minParticipants ?? 1,
                maxParticipants: originalMeeting.maxParticipants ?? 1,
            });

            // Process offers for SEARCHING meetings
            await processOffersForNewMeeting(newMeeting);
        }

        // 6. Transition old meeting to terminal state if not already terminal
        let oldMeetingTransition = null;
        if (!TERMINAL_STATES.includes(oldState)) {
            const toState = oldState === DRAFT_MEETING_STATE
                ? DISMISSED_DRAFT_MEETING_STATE
                : CANCELED_MEETING_STATE;

            try {
                await transitionMeeting({
                    meetingId: originalMeeting.id,
                    toState,
                    actorId: userId,
                });
                oldMeetingTransition = { from: oldState, to: toState };
            } catch (transitionError) {
                console.error('Failed to transition old meeting:', transitionError);
                // Continue - the new meeting was already created successfully
                oldMeetingTransition = { from: oldState, to: toState, error: 'transition failed' };
            }
        }

        // 7. Enrich and return
        const [enrichedMeeting] = await enrichMeetingsWithAcceptedUsers([newMeeting]);

        res.json({
            success: true,
            meeting: enrichedMeeting,
            suggestedTime: suggestion.suggestedTime,
            reason: suggestion.reason,
            oldMeeting: {
                id: originalMeeting.id,
                previousState: oldState,
                transition: oldMeetingTransition,
            },
        });
    } catch (error) {
        console.error('Error suggesting new time:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({
            error: 'Failed to suggest new time',
            details: errorMessage,
        });
    }
};
