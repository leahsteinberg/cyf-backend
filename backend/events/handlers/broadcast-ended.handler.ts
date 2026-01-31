import type { BroadcastEndedEvent } from '../event-types.js';
import { eventBus } from '../event-bus.js';
import { EVENT_TYPES } from '../event-types.js';
import { sendPushNotifications } from '../../push-notifications.js';
import { getUsersFromIds } from '../../query/user-lookup.js';
import { buildBroadcastEndedNotification } from '../notification-builder.js';
import { logEvent } from '../../update/event-tracking.js';

const handleBroadcastEnded = async (event: BroadcastEndedEvent): Promise<void> => {
    console.log('[Handler] BROADCAST_ENDED', event);

    // Log event for analytics
    await logEvent({
        userId: event.broadcasterId,
        eventType: 'broadcast_ended_notification',
        metadata: {
            meetingId: event.meetingId,
            recipientCount: event.offerRecipientIds.length,
        }
    });

    if (event.offerRecipientIds.length === 0) {
        console.log('[Handler] No recipients to notify for broadcast end');
        return;
    }

    // Get push tokens for all recipients
    const users = await getUsersFromIds(event.offerRecipientIds);
    const pushTokens = users
        .map(u => u.pushToken)
        .filter((token): token is string => !!token);

    if (pushTokens.length === 0) {
        console.log('[Handler] No valid push tokens for broadcast end recipients');
        return;
    }

    // Build and send notifications
    const notification = buildBroadcastEndedNotification(event);

    try {
        await sendPushNotifications({
            pushTokens,
            title: notification.title,
            body: notification.body,
            data: notification.data,
        });
        console.log(`[Handler] Push sent for BROADCAST_ENDED to ${pushTokens.length} users`);
    } catch (error) {
        console.error('[Handler] Failed to send BROADCAST_ENDED push:', error);
    }
};

// Register handler
eventBus.onEvent(EVENT_TYPES.BROADCAST_ENDED, handleBroadcastEnded);

export { handleBroadcastEnded };
