import type { Offer, Meeting } from "../types.js";
import { sendPushNotification } from "./push-notifications.js";
import { getUserPushToken } from "./user.js";
import { prisma } from "./auth.js";

/**
 * Generates push notification content for an offer
 * @param pushToken - The user's push notification token
 * @param offer - The offer object (must include meeting with userFrom data)
 * @returns Push notification configuration object
 */
const generateOfferPush = async ({ pushToken, offer }: { pushToken: string, offer: Offer }) => {

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

    // Format the meeting time
    console.log("meeitng time before - ", meeting.scheduledFor)
    const meetingTime = new Date(meeting.scheduledFor);
    console.log("meeting time after,", meetingTime)
    const timeString = meetingTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
    const dateString = meetingTime.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });

    return {
        pushToken,
        title: `${userName} wants to talk!`,
        body: `${dateString} at ${timeString}${meeting.title ? ` - ${meeting.title}` : ''}`,
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

    try {
        const notificationConfig = await generateOfferPush({ pushToken, offer });

        const notification = await sendPushNotification(notificationConfig);

        console.log(`Offer push notification sent to user ${userId}:`, notification);
        return notification;
    } catch (error) {
        console.error(`Error sending offer push notification to user ${userId}:`, error);
        throw error;
    }
};