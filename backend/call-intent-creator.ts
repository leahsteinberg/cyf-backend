import { FRIEND_SPECIFIC_TARGET_TYPE, UNKNOWN_TIME_TYPE, USER_INTENT_SOURCE_TYPE } from "../types.js";
import { createDraftMeeting } from "./draft-meeting.js";


export const createCallIntent = async ({userId, targetUserId}: {userId: string, targetUserId: string}) {
    const userToId = targetUserId;
    // Set scheduledFor to 4 days in the future (defacto expiry)
    const scheduledFor = new Date();
    scheduledFor.setDate(scheduledFor.getDate() + 4);

    // scheduledEnd can be same or slightly after (doesn't matter for UNKNOWN time)
    const scheduledEnd = new Date(scheduledFor);
    scheduledEnd.setHours(scheduledEnd.getHours() + 1);

    // Generate 3 backup times, each 1 day apart from the original, same hour
    const backupScheduledTimes: Date[] = [];
    for (let i = 1; i <= 3; i++) {
        const backupTime = new Date(scheduledFor);
        backupTime.setDate(backupTime.getDate() + i);
        backupScheduledTimes.push(backupTime);
    }

    // Create draft meeting with UNKNOWN time and FRIEND_SPECIFIC target
    const draftMeeting = await createDraftMeeting({
        userFromId: userId,
        scheduledFor,
        scheduledEnd,
        backupScheduledTimes,
        title: 'Call intent',
        timeType: UNKNOWN_TIME_TYPE,
        targetType: FRIEND_SPECIFIC_TARGET_TYPE,
        targetUserId: userToId,
        sourceType: USER_INTENT_SOURCE_TYPE,
        intentLabel: 'call intent label'
    });

    console.log("Call intent created:", {
        meetingId: draftMeeting.id,
        userId,
        userToId,
        expiresAt: scheduledFor,
        backupTimes: backupScheduledTimes
    });
}