import { createMeeting } from './update/meeting-update.js';
import { processOffersForNewMeeting } from './process-meeting.js';
import { setIsBroadcasting } from './update/user-update.js';
import type { Meeting } from '../types.js';
import {
    FUTURE_TIME_TYPE,
    OPEN_TARGET_TYPE,
    SEARCHING_MEETING_STATE,
    SYSTEM_REAL_TIME_SOURCE_TYPE,
    isOpenBroadcast
} from '../types.js';
import type { CreateDraftMeetingParams } from './draft-meeting.js';

/**
 * Respawns a cancelled meeting by creating a new meeting in SEARCHING state.
 *
 * Use case: When an acceptor cancels a meeting, the creator should get another
 * chance to find someone. The meeting is recreated with the same properties
 * and offers are sent to all original recipients (including the canceller).
 *
 * This applies to ALL meeting types:
 * - IMMEDIATE + OPEN (broadcast to all friends)
 * - IMMEDIATE + FRIEND_SPECIFIC (targeted broadcast to specific users)
 * - IMMEDIATE + GROUP (broadcast to multiple specific users)
 * - FUTURE + OPEN (scheduled meeting to all friends)
 * - FUTURE + FRIEND_SPECIFIC (1-on-1 scheduled meeting)
 * - FUTURE + GROUP (scheduled meeting with multiple specific users)
 *
 * Users who cancelled or rejected the original meeting will still receive
 * offers but won't get push notifications about them.
 *
 * @param cancelledMeeting - The meeting that was just cancelled
 * @param suppressNotificationUserIds - User IDs to suppress push notifications for
 * @returns The newly created meeting in SEARCHING state
 */
export const respawnMeeting = async (cancelledMeeting: Meeting, suppressNotificationUserIds: string[] = []): Promise<Meeting> => {
    console.log("Respawning meeting:", cancelledMeeting.id);

    // Create new meeting with same properties, but in SEARCHING state
    const respawnedMeeting = await createMeeting({
        userFromId: cancelledMeeting.userFromId,
        scheduledFor: cancelledMeeting.scheduledFor,
        scheduledEnd: cancelledMeeting.scheduledEnd,
        title: cancelledMeeting.title || 'Meeting',
        meetingState: SEARCHING_MEETING_STATE,
        timeType: cancelledMeeting.timeType || FUTURE_TIME_TYPE,
        targetType: cancelledMeeting.targetType || OPEN_TARGET_TYPE,
        targetUserIds: cancelledMeeting.targetUserIds || [],
        sourceType: SYSTEM_REAL_TIME_SOURCE_TYPE,
        minParticipants: cancelledMeeting.minParticipants ?? 1,
        maxParticipants: cancelledMeeting.maxParticipants ?? 1,
        ...(cancelledMeeting.intentLabel && {intentLabel: cancelledMeeting.intentLabel}),
    } as CreateDraftMeetingParams);

    // Process offers using unified logic, excluding users who already interacted with original
    await processOffersForNewMeeting(respawnedMeeting, suppressNotificationUserIds);


    return respawnedMeeting;
};
