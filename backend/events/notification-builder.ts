import type {
    OfferCreatedEvent,
    OfferAcceptedEvent,
    CallIntentCreatedEvent,
    BroadcastEndedEvent,
    PushPayload
} from './event-types.js';
import { getRelativeDateString } from '../utils.js';

interface NotificationContent {
    title: string;
    body: string;
    data: PushPayload;
}

export const buildOfferCreatedNotification = (
    event: OfferCreatedEvent,
    timezone: string | null
): NotificationContent => {
    const relativeDateString = getRelativeDateString(
        new Date(event.scheduledFor),
        timezone
    );

    return {
        title: `${event.broadcasterDisplayName} wants to talk!`,
        body: event.meetingTitle
            ? `${relativeDateString} - ${event.meetingTitle}`
            : relativeDateString,
        data: {
            type: 'OFFER_CREATED',
            action: 'navigate',
            screen: 'OfferDetail',
            data: {
                offerId: event.offerId,
                meetingId: event.meetingId,
            }
        }
    };
};

export const buildOfferAcceptedNotification = (
    event: OfferAcceptedEvent,
    timezone: string | null
): NotificationContent => {
    const relativeDateString = getRelativeDateString(
        new Date(event.scheduledFor),
        timezone
    );

    return {
        title: `${event.acceptedByDisplayName} accepted your call!`,
        body: event.meetingTitle
            ? `${relativeDateString} - ${event.meetingTitle}`
            : relativeDateString,
        data: {
            type: 'OFFER_ACCEPTED',
            action: 'navigate',
            screen: 'MeetingDetail',
            data: {
                meetingId: event.meetingId,
                offerId: event.offerId,
                acceptedByUserId: event.acceptedByUserId,
            }
        }
    };
};

export const buildCallIntentNotification = (
    event: CallIntentCreatedEvent
): NotificationContent => {
    return {
        title: `${event.fromUserDisplayName} wants to call you!`,
        body: 'Tap to see when they are available',
        data: {
            type: 'CALL_INTENT_CREATED',
            action: 'navigate',
            screen: 'Suggestions',
            data: {
                signalId: event.signalId,
                fromUserId: event.fromUserId,
            }
        }
    };
};

export const buildBroadcastEndedNotification = (
    event: BroadcastEndedEvent
): NotificationContent => {
    return {
        title: `${event.broadcasterDisplayName} is no longer available`,
        body: 'Their broadcast has ended',
        data: {
            type: 'BROADCAST_ENDED',
            action: 'refresh',
            screen: 'Home',
            data: {
                meetingId: event.meetingId,
                broadcasterId: event.broadcasterId,
            }
        }
    };
};
