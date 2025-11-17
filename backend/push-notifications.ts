import { Expo } from 'expo-server-sdk';

// Create a new Expo SDK client
const expo = new Expo();

/**
 * Validates if a push token is valid for Expo
 */
export const isValidExpoPushToken = (pushToken: string): boolean => {
    return Expo.isExpoPushToken(pushToken);
};

/**
 * Sends a push notification to a single device
 */
export const sendPushNotification = async ({
    pushToken,
    title,
    body,
    data = {}
}: {
    pushToken: string;
    title: string;
    body: string;
    data?: Record<string, any>;
}) => {
    // Check that the push token is valid
    if (!isValidExpoPushToken(pushToken)) {
        throw new Error(`Push token ${pushToken} is not a valid Expo push token`);
    }

    // Construct the message
    const message = {
        to: pushToken,
        sound: 'default',
        title: title,
        body: body,
        data: data,
    };

    try {
        // Send the notification
        const ticketChunk = await expo.sendPushNotificationsAsync([message]);
        console.log('Push notification sent:', ticketChunk);
        return ticketChunk[0];
    } catch (error) {
        console.error('Error sending push notification:', error);
        throw error;
    }
};

/**
 * Sends push notifications to multiple devices
 */
export const sendPushNotifications = async ({
    pushTokens,
    title,
    body,
    data = {}
}: {
    pushTokens: string[];
    title: string;
    body: string;
    data?: Record<string, any>;
}) => {
    // Filter out invalid tokens
    const validTokens = pushTokens.filter(token => isValidExpoPushToken(token));

    if (validTokens.length === 0) {
        throw new Error('No valid Expo push tokens provided');
    }

    // Construct messages for all tokens
    const messages = validTokens.map(token => ({
        to: token,
        sound: 'default',
        title: title,
        body: body,
        data: data,
    }));

    try {
        // The Expo push notification service accepts batches of notifications
        // so we chunk them to avoid hitting rate limits
        const chunks = expo.chunkPushNotifications(messages);
        const tickets = [];

        for (const chunk of chunks) {
            try {
                const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                tickets.push(...ticketChunk);
            } catch (error) {
                console.error('Error sending chunk:', error);
            }
        }

        console.log(`Sent ${tickets.length} push notifications`);
        return tickets;
    } catch (error) {
        console.error('Error sending push notifications:', error);
        throw error;
    }
};
