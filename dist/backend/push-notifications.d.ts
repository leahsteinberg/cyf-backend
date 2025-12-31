/**
 * Validates if a push token is valid for Expo
 */
export declare const isValidExpoPushToken: (pushToken: string) => boolean;
/**
 * Sends a push notification to a single device
 */
export declare const sendPushNotification: ({ pushToken, title, body, data }: {
    pushToken: string;
    title: string;
    body: string;
    data?: Record<string, any>;
}) => Promise<import("expo-server-sdk").ExpoPushTicket | undefined>;
/**
 * Sends push notifications to multiple devices
 */
export declare const sendPushNotifications: ({ pushTokens, title, body, data }: {
    pushTokens: string[];
    title: string;
    body: string;
    data?: Record<string, any>;
}) => Promise<(import("expo-server-sdk").ExpoPushSuccessTicket | import("expo-server-sdk").ExpoPushErrorReceipt)[]>;
//# sourceMappingURL=push-notifications.d.ts.map