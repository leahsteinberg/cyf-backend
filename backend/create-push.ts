import type { Offer } from "../types.js";
import { sendPushNotification } from "./push-notifications.js";
import { getRelativeDateString } from "./utils.js";
import { findMeetingWithUserFromOffer } from "./query/meeting-lookup.js";
import { getUserPushToken, getUserTimezone } from "./query/user-lookup.js";

/**
 * Generates push notification content for an offer
 * @param pushToken - The user's push notification token
 * @param offer - The offer object (must include meeting with userFrom data)
 * @returns Push notification configuration object
 */
const generateOfferPush = async ({ pushToken, offer, timezone }: { pushToken: string, offer: Offer, timezone: string | null }) => {

    const meeting = await findMeetingWithUserFromOffer({offer});

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