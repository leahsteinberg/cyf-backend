import type { CallIntentCreatedEvent } from '../event-types.js';
import { eventBus } from '../event-bus.js';
import { EVENT_TYPES } from '../event-types.js';
import { sendPushNotification } from '../../push-notifications.js';
import { getUserPushToken } from '../../query/user-lookup.js';
import { buildCallIntentNotification } from '../notification-builder.js';
import { logEvent } from '../../update/event-tracking.js';

const handleCallIntentCreated = async (event: CallIntentCreatedEvent): Promise<void> => {
    console.log('[Handler] CALL_INTENT_CREATED', event);

    // Log event for analytics
    await logEvent({
        userId: event.targetUserId,
        eventType: 'call_intent_received_notification',
        metadata: {
            signalId: event.signalId,
            fromUserId: event.fromUserId,
        }
    });

    // Get push token for target user
    const pushToken = await getUserPushToken({ userId: event.targetUserId });
    if (!pushToken) {
        console.log(`[Handler] No push token for user ${event.targetUserId}`);
        return;
    }

    // Build and send notification
    const notification = buildCallIntentNotification(event);

    try {
        await sendPushNotification({
            pushToken,
            title: notification.title,
            body: notification.body,
            data: notification.data,
        });
        console.log(`[Handler] Push sent for CALL_INTENT_CREATED to ${event.targetUserId}`);
    } catch (error) {
        console.error('[Handler] Failed to send CALL_INTENT_CREATED push:', error);
    }
};

// Register handler
eventBus.onEvent(EVENT_TYPES.CALL_INTENT_CREATED, handleCallIntentCreated);

export { handleCallIntentCreated };
