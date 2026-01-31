// Event system exports
export { eventBus } from './event-bus.js';
export { EVENT_TYPES } from './event-types.js';
export type {
    AppEvent,
    OfferAcceptedEvent,
    CallIntentCreatedEvent,
    BroadcastEndedEvent,
    PushPayload
} from './event-types.js';

// Import handlers to register them (side effects)
import './handlers/offer-accepted.handler.js';
import './handlers/call-intent-created.handler.js';
import './handlers/broadcast-ended.handler.js';

console.log('[Events] All event handlers registered');
