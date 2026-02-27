import type { Request, Response } from 'express';
import { createMeeting } from '../backend/update/meeting-update.js';
import { resolveGroupForMeeting } from '../backend/group.js';
import { getCreatedMeetings, getAcceptedMeetings, enrichMeetingsWithAcceptedUsers } from '../backend/query/meeting-lookup.js';
import { processOffersForNewMeeting } from '../backend/process-meeting.js';
import { findMeetingTimeConflict } from '../backend/meeting-conflict.js';
import { createDraftMeeting } from '../backend/draft-meeting.js';
import { suggestTimeForFriends } from '../backend/ai/smart-meeting-service.js';
import { generateSuggestions, createMeetingFromSuggestion } from '../backend/ai/suggestion-service.js';

/**
 * POST /api/create-smart-meeting
 *
 * Creates a meeting from partial information, using AI only when necessary.
 *
 * Decision logic:
 *   - time + target provided   → no AI → SEARCHING meeting (offers sent immediately)
 *   - time provided, no target → no AI, default OPEN → SEARCHING meeting
 *   - target provided, no time → AI picks time → DRAFT meeting
 *   - neither provided         → AI picks friend + time → DRAFT meeting
 *
 * Response: { meeting, aiUsed: boolean }
 * The frontend can check meeting.meetingState ('SEARCHING' vs 'DRAFT') and
 * meeting.suggestionReason to understand what the AI filled in.
 */
export const handleCreateSmartMeeting = async (req: Request, res: Response) => {
    const {
        userFromId,
        title,
        intentLabel,
        sourceType,
        // Time
        scheduledFor,
        scheduledEnd,
        timeType,
        // Target
        targetType,
        targetUserIds,
        targetUserId,   // old single-user compat
        groupId,
        // Old compat
        meetingType,
    } = req.body;

    if (!userFromId) {
        return res.status(400).json({ error: 'userFromId is required' });
    }

    try {
        // --- Resolve group if provided (same logic as handleCreateMeeting) ---
        // No explicit type annotations here so TypeScript infers `any` from req.body,
        // which avoids exactOptionalPropertyTypes conflicts on the spread call sites.
        let resolvedTargetUserIds = targetUserIds || (targetUserId ? [targetUserId] : undefined);
        let resolvedGroupName: string | undefined;
        let resolvedTargetType = targetType;

        if (groupId) {
            const resolved = await resolveGroupForMeeting({ groupId, requesterId: userFromId });
            resolvedTargetUserIds = resolved.memberIds;
            resolvedGroupName = resolved.groupName;
            resolvedTargetType = 'GROUP';
        }

        // --- Determine what's present ---
        const hasTime = !!(scheduledFor && scheduledEnd);
        const hasSpecificTarget = !!(resolvedTargetUserIds?.length);
        const isExplicitlyOpen = resolvedTargetType === 'OPEN';
        const hasTarget = hasSpecificTarget || isExplicitlyOpen;

        // Bias: only invoke AI when time is missing.
        // Missing target alone is not enough — we default to OPEN instead.
        const useAI = !hasTime;

        // ================================================================
        // PATH A: No AI — create a SEARCHING meeting directly
        // ================================================================
        if (!useAI) {
            const effectiveTargetType = resolvedTargetType || (hasSpecificTarget ? 'FRIEND_SPECIFIC' : 'OPEN');

            const [createdMeetings, acceptedMeetings] = await Promise.all([
                getCreatedMeetings({ userFromId }),
                getAcceptedMeetings({ acceptedUserId: userFromId }),
            ]);

            const conflict = findMeetingTimeConflict({
                userCreatedMeetings: createdMeetings,
                userAcceptedMeetings: acceptedMeetings,
                scheduledFor: new Date(scheduledFor),
                scheduledEnd: new Date(scheduledEnd),
            });

            if (conflict) {
                return res.status(409).json({
                    error: conflict.type === 'created'
                        ? 'You already have a meeting you created at this time'
                        : 'You already have a meeting you accepted at this time',
                    existingMeeting: conflict.conflictingMeeting,
                });
            }

            const meeting = await createMeeting({
                userFromId,
                scheduledFor: new Date(scheduledFor),
                scheduledEnd: new Date(scheduledEnd),
                title: title || null,
                timeType: timeType || 'FUTURE',
                targetType: effectiveTargetType as any,
                targetUserIds: resolvedTargetUserIds,
                ...(meetingType ? { meetingType } : {}),
                ...(sourceType ? { sourceType } : {}),
                ...(intentLabel ? { intentLabel } : {}),
                ...(groupId ? { groupId } : {}),
                ...(resolvedGroupName ? { groupName: resolvedGroupName as any } : {}),
            });

            await processOffersForNewMeeting(meeting);
            const [enriched] = await enrichMeetingsWithAcceptedUsers([meeting]);
            return res.json({ meeting: enriched, aiUsed: false });
        }

        // ================================================================
        // PATH B: AI needed — time is missing
        // ================================================================

        // Case B1: target is known, AI picks the time
        if (hasTarget && hasSpecificTarget) {
            const aiTime = await suggestTimeForFriends({
                userId: userFromId,
                friendIds: resolvedTargetUserIds!,
            });

            if (!aiTime) {
                return res.status(422).json({
                    error: 'Could not find a good time to suggest. Please specify a time manually.',
                });
            }

            const meeting = await createDraftMeeting({
                userFromId,
                scheduledFor: aiTime.scheduledFor,
                scheduledEnd: aiTime.scheduledEnd,
                title: title || 'Suggested call',
                timeType: 'FUTURE',
                targetType: (resolvedTargetType || 'FRIEND_SPECIFIC') as any,
                sourceType: sourceType || 'SYSTEM_REAL_TIME' as any,
                targetUserIds: resolvedTargetUserIds,
                suggestionReason: aiTime.reason,
                ...(intentLabel ? { intentLabel } : {}),
                ...(groupId ? { groupId } : {}),
                ...(resolvedGroupName ? { groupName: resolvedGroupName as any } : {}),
            });

            return res.json({ meeting, aiUsed: true });
        }

        // Case B2: neither time nor target — AI picks both
        const suggestions = await generateSuggestions(userFromId);

        if (!suggestions.length) {
            return res.status(422).json({
                error: 'No suggestions available right now. Please specify a time and who to call.',
            });
        }

        // Take the highest-confidence suggestion
        const best = suggestions.reduce((a, b) => (b.confidence > a.confidence ? b : a));
        const meeting = await createMeetingFromSuggestion(userFromId, best);

        return res.json({ meeting, aiUsed: true });

    } catch (error) {
        console.error('Error creating smart meeting:', error);
        const message = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ error: 'Failed to create meeting', details: message });
    }
};
