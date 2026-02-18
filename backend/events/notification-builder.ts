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

// Maps intentLabel IDs to friendly display text for notifications
const VIBE_TEXT: Record<string, { title: (name: string) => string; noun: string }> = {
    hi: { title: (name) => `${name} says hi!`, noun: 'chat' },
    catchup: { title: (name) => `${name} wants to catch up!`, noun: 'catch up' },
    miss: { title: (name) => `${name} misses you!`, noun: 'call' },
    yap: { title: (name) => `${name} is ready to yap!`, noun: 'yap session' },
};

export const buildOfferCreatedNotification = (
    event: OfferCreatedEvent,
    timezone: string | null
): NotificationContent => {
    const name = event.broadcasterDisplayName;
    const vibe = event.intentLabel ? VIBE_TEXT[event.intentLabel] : null;

    // Title: use vibe-specific text or a friendly default
    const title = vibe
        ? vibe.title(name)
        : `${name} is free to talk!`;

    const relativeDateString = getRelativeDateString(
        new Date(event.scheduledFor),
        timezone
    );
    const detail = event.meetingTitle || (vibe ? vibe.noun : null);
    const body = detail
        ? `${detail} · ${relativeDateString}`
        : `Tap to join · ${relativeDateString}`;

    return {
        title,
        body,
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
    const name = event.acceptedByDisplayName;
    const vibe = event.intentLabel ? VIBE_TEXT[event.intentLabel] : null;

    const title = `${name} is in!`;

    const relativeDateString = getRelativeDateString(
        new Date(event.scheduledFor),
        timezone
    );
    const detail = event.meetingTitle || (vibe ? `Your ${vibe.noun}` : 'Your call');
    const body = `${detail} is happening · ${relativeDateString}`;

    return {
        title,
        body,
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
        title: `${event.fromUserDisplayName} is thinking of you`,
        body: "They'd love to find a time to talk",
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
        title: `${event.broadcasterDisplayName} is no longer free`,
        body: 'Maybe next time!',
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
