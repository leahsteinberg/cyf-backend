// Event type constants
export const EVENT_TYPES = {
    OFFER_ACCEPTED: 'OFFER_ACCEPTED',
    CALL_INTENT_CREATED: 'CALL_INTENT_CREATED',
    BROADCAST_ENDED: 'BROADCAST_ENDED',
} as const;

// Event payloads
export interface OfferAcceptedEvent {
    type: typeof EVENT_TYPES.OFFER_ACCEPTED;
    offerId: string;
    meetingId: string;
    acceptedByUserId: string;
    meetingCreatorId: string;
    acceptedByDisplayName: string;
    meetingTitle: string | null;
    scheduledFor: Date;
}

export interface CallIntentCreatedEvent {
    type: typeof EVENT_TYPES.CALL_INTENT_CREATED;
    signalId: string;
    fromUserId: string;
    targetUserId: string;
    fromUserDisplayName: string;
}

export interface BroadcastEndedEvent {
    type: typeof EVENT_TYPES.BROADCAST_ENDED;
    meetingId: string;
    broadcasterId: string;
    broadcasterDisplayName: string;
    offerRecipientIds: string[];
}

// Union type for all events
export type AppEvent =
    | OfferAcceptedEvent
    | CallIntentCreatedEvent
    | BroadcastEndedEvent;

// Push notification payload structure (sent to client)
export interface PushPayload {
    type: string;
    action: 'navigate' | 'refresh' | 'silent';
    screen?: string;
    data: Record<string, any>;
}
