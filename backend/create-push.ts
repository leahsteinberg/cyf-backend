import type { Offer, Meeting } from "../types.js";
import { sendPushNotification } from "./push-notifications.js";
import { getUserPushToken, getUserTimezone } from "./user.js";
import { prisma } from "./auth.js";

/**
 * Generates a relative date string for push notifications
 * Uses user's timezone for accurate day comparisons
 */
const getRelativeDateString = (meetingTime: Date, timezone: string | null): string => {
    const now = new Date();

    // Use timezone if available, otherwise fall back to UTC
    const tz = timezone || 'UTC';

    // Get date parts in user's timezone
    const nowInTz = new Date(now.toLocaleString('en-US', { timeZone: tz }));
    const meetingInTz = new Date(meetingTime.toLocaleString('en-US', { timeZone: tz }));

    // Compare dates (ignoring time)
    const today = new Date(nowInTz.getFullYear(), nowInTz.getMonth(), nowInTz.getDate());
    const meetingDay = new Date(meetingInTz.getFullYear(), meetingInTz.getMonth(), meetingInTz.getDate());

    const diffDays = Math.round((meetingDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays >= 2 && diffDays <= 6) {
        // Return day name (e.g., "Monday")
        return meetingTime.toLocaleDateString('en-US', { weekday: 'long', timeZone: tz });
    }
    // For dates further out, use "Mon, Nov 17" format
    return meetingTime.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        timeZone: tz
    });
};

/**
 * Generates push notification content for an offer
 * @param pushToken - The user's push notification token
 * @param offer - The offer object (must include meeting with userFrom data)
 * @returns Push notification configuration object
 */
const generateOfferPush = async ({ pushToken, offer, timezone }: { pushToken: string, offer: Offer, timezone: string | null }) => {

    const meeting = await prisma.meeting.findUnique({
        where: { id: offer.meetingId },
        include: {
            userFrom: {
                select: {
                    id: true,
                    name: true,
                    displayUsername: true,
                    username: true
                }
            }
        }
    });

    if (!meeting) {
        throw new Error('Meeting not found for offer');
    }

    // Get the user's display name (prefer displayUsername, then username, then name)
    const userName = meeting.userFrom.displayUsername
        || meeting.userFrom.username
        || meeting.userFrom.name
        || 'A friend';

    // Format the meeting time using relative date in user's timezone
    const meetingTime = new Date(meeting.scheduledFor);
    const relativeDateString = getRelativeDateString(meetingTime, timezone);

    return {
        pushToken,
        title: `${userName} wants to talk!`,
        body: `${relativeDateString}${meeting.title ? ` - ${meeting.title}` : ''}`,
        data: {
            type: 'offer',
            offerId: offer.id,
            meetingId: meeting.id,
            userFromId: meeting.userFromId
        }
    };
};

/**
 * Creates and sends a push notification for a new offer
 * @param offer - The offer object
 */
export const createAndSendOfferPush = async ({ offer }: { offer: Offer }) => {
    const userId = offer.userOfferedId;
    const pushToken = await getUserPushToken({userId});

    if (!pushToken) {
        console.log(`No push token found for user ${userId}`);
        return;
    }

    // Get user's timezone for accurate date formatting
    const timezone = await getUserTimezone({userId});

    try {
        const notificationConfig = await generateOfferPush({ pushToken, offer, timezone });

        const notification = await sendPushNotification(notificationConfig);

        console.log(`Offer push notification sent to user ${userId}:`, notification);
        return notification;
    } catch (error) {
        console.error(`Error sending offer push notification to user ${userId}:`, error);
        throw error;
    }
};