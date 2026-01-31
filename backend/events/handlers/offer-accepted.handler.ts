import type { OfferAcceptedEvent } from '../event-types.js';
import { eventBus } from '../event-bus.js';
import { EVENT_TYPES } from '../event-types.js';
import { sendPushNotification } from '../../push-notifications.js';
import { getUserPushToken, getUserTimezone } from '../../query/user-lookup.js';
import { buildOfferAcceptedNotification } from '../notification-builder.js';
import { logEvent } from '../../update/event-tracking.js';

const handleOfferAccepted = async (event: OfferAcceptedEvent): Promise<void> => {
    console.log('[Handler] OFFER_ACCEPTED', event);

    // Log event for analytics
    await logEvent({
        userId: event.meetingCreatorId,
        eventType: 'offer_accepted_notification',
        metadata: {
            offerId: event.offerId,
            meetingId: event.meetingId,
            acceptedByUserId: event.acceptedByUserId,
        }
    });

    // Get push token for meeting creator
    const pushToken = await getUserPushToken({ userId: event.meetingCreatorId });
    if (!pushToken) {
        console.log(`[Handler] No push token for user ${event.meetingCreatorId}`);
        return;
    }

    // Get timezone for date formatting
    const timezone = await getUserTimezone({ userId: event.meetingCreatorId });

    // Build and send notification
    const notification = buildOfferAcceptedNotification(event, timezone);

    try {
        await sendPushNotification({
            pushToken,
            title: notification.title,
            body: notification.body,
            data: notification.data,
        });
        console.log(`[Handler] Push sent for OFFER_ACCEPTED to ${event.meetingCreatorId}`);
    } catch (error) {
        console.error('[Handler] Failed to send OFFER_ACCEPTED push:', error);
    }
};

// Register handler
eventBus.onEvent(EVENT_TYPES.OFFER_ACCEPTED, handleOfferAccepted);

export { handleOfferAccepted };
