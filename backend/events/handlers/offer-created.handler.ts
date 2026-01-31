import type { OfferCreatedEvent } from '../event-types.js';
import { eventBus } from '../event-bus.js';
import { EVENT_TYPES } from '../event-types.js';
import { sendPushNotification } from '../../push-notifications.js';
import { getUserPushToken, getUserTimezone } from '../../query/user-lookup.js';
import { buildOfferCreatedNotification } from '../notification-builder.js';
import { logEvent } from '../../update/event-tracking.js';

const handleOfferCreated = async (event: OfferCreatedEvent): Promise<void> => {
    console.log('[Handler] OFFER_CREATED', event);

    // Log event for analytics
    await logEvent({
        userId: event.userOfferedId,
        eventType: 'offer_created_notification',
        metadata: {
            offerId: event.offerId,
            meetingId: event.meetingId,
        }
    });

    // Get push token for the user receiving the offer
    const pushToken = await getUserPushToken({ userId: event.userOfferedId });
    if (!pushToken) {
        console.log(`[Handler] No push token for user ${event.userOfferedId}`);
        return;
    }

    // Get timezone for date formatting
    const timezone = await getUserTimezone({ userId: event.userOfferedId });

    // Build and send notification
    const notification = buildOfferCreatedNotification(event, timezone);

    try {
        await sendPushNotification({
            pushToken,
            title: notification.title,
            body: notification.body,
            data: notification.data,
        });
        console.log(`[Handler] Push sent for OFFER_CREATED to ${event.userOfferedId}`);
    } catch (error) {
        console.error('[Handler] Failed to send OFFER_CREATED push:', error);
    }
};

// Register handler
eventBus.onEvent(EVENT_TYPES.OFFER_CREATED, handleOfferCreated);

export { handleOfferCreated };
