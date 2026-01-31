/**
 * Event Bus Tests
 *
 * Tests the event bus singleton that handles event emission and handling.
 * Note: The eventBus is a singleton, so tests may affect each other.
 * Handlers registered in tests should be cleaned up.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { eventBus } from '../../backend/events/event-bus.js';
import { EVENT_TYPES } from '../../backend/events/event-types.js';
import type { OfferCreatedEvent, CallIntentCreatedEvent } from '../../backend/events/event-types.js';
import {
  createMockOfferCreatedEvent,
  createMockCallIntentCreatedEvent,
} from '../helpers/mock-factories.js';

describe('EventBus', () => {
  // Track handlers to clean up after each test
  const handlers: Array<{ eventType: string; handler: Function }> = [];

  afterEach(() => {
    // Clean up any handlers registered during tests
    for (const { eventType, handler } of handlers) {
      eventBus.removeListener(eventType, handler as any);
    }
    handlers.length = 0;
  });

  function registerHandler<T>(eventType: string, handler: (event: T) => void) {
    eventBus.onEvent(eventType as any, handler as any);
    handlers.push({ eventType, handler });
  }

  describe('emitEvent', () => {
    it('returns true when event is emitted with listeners', (done) => {
      const handler = () => done();
      registerHandler(EVENT_TYPES.OFFER_CREATED, handler);

      const event = createMockOfferCreatedEvent();
      const result = eventBus.emitEvent(event);

      expect(result).toBe(true);
    });

    it('returns false when no listeners are registered', () => {
      // Use a unique event type that has no listeners
      const event = {
        type: 'NONEXISTENT_EVENT' as any,
      };

      const result = eventBus.emitEvent(event as any);

      expect(result).toBe(false);
    });
  });

  describe('onEvent', () => {
    it('handler receives the emitted event', (done) => {
      const testEvent = createMockOfferCreatedEvent({
        offerId: 'test-offer-id-123',
        broadcasterDisplayName: 'Test Name',
      });

      const handler = (event: OfferCreatedEvent) => {
        expect(event.offerId).toBe('test-offer-id-123');
        expect(event.broadcasterDisplayName).toBe('Test Name');
        expect(event.type).toBe(EVENT_TYPES.OFFER_CREATED);
        done();
      };

      registerHandler(EVENT_TYPES.OFFER_CREATED, handler);
      eventBus.emitEvent(testEvent);
    });

    it('different event types go to different handlers', (done) => {
      let offerCreatedCalled = false;
      let callIntentCalled = false;

      const offerHandler = (_event: OfferCreatedEvent) => {
        offerCreatedCalled = true;
        checkDone();
      };

      const callIntentHandler = (_event: CallIntentCreatedEvent) => {
        callIntentCalled = true;
        checkDone();
      };

      function checkDone() {
        if (offerCreatedCalled && callIntentCalled) {
          done();
        }
      }

      registerHandler(EVENT_TYPES.OFFER_CREATED, offerHandler);
      registerHandler(EVENT_TYPES.CALL_INTENT_CREATED, callIntentHandler);

      eventBus.emitEvent(createMockOfferCreatedEvent());
      eventBus.emitEvent(createMockCallIntentCreatedEvent());
    });

    it('multiple handlers for same event type all receive the event', (done) => {
      let handler1Called = false;
      let handler2Called = false;

      const handler1 = () => {
        handler1Called = true;
        checkDone();
      };

      const handler2 = () => {
        handler2Called = true;
        checkDone();
      };

      function checkDone() {
        if (handler1Called && handler2Called) {
          done();
        }
      }

      registerHandler(EVENT_TYPES.OFFER_CREATED, handler1);
      registerHandler(EVENT_TYPES.OFFER_CREATED, handler2);

      eventBus.emitEvent(createMockOfferCreatedEvent());
    });

    it('handler only receives events of registered type', () => {
      const handler = jest.fn();

      registerHandler(EVENT_TYPES.OFFER_CREATED, handler);

      // Emit a different event type
      eventBus.emitEvent(createMockCallIntentCreatedEvent());

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('event data integrity', () => {
    it('preserves all event fields', (done) => {
      const scheduledFor = new Date('2025-03-18T15:00:00Z');
      const testEvent = createMockOfferCreatedEvent({
        offerId: 'offer-xyz',
        meetingId: 'meeting-abc',
        userOfferedId: 'user-123',
        broadcasterDisplayName: 'Alice',
        meetingTitle: 'Test Call',
        scheduledFor,
      });

      const handler = (event: OfferCreatedEvent) => {
        expect(event.offerId).toBe('offer-xyz');
        expect(event.meetingId).toBe('meeting-abc');
        expect(event.userOfferedId).toBe('user-123');
        expect(event.broadcasterDisplayName).toBe('Alice');
        expect(event.meetingTitle).toBe('Test Call');
        expect(event.scheduledFor).toEqual(scheduledFor);
        done();
      };

      registerHandler(EVENT_TYPES.OFFER_CREATED, handler);
      eventBus.emitEvent(testEvent);
    });

    it('handles null meetingTitle', (done) => {
      const testEvent = createMockOfferCreatedEvent({
        meetingTitle: null,
      });

      const handler = (event: OfferCreatedEvent) => {
        expect(event.meetingTitle).toBeNull();
        done();
      };

      registerHandler(EVENT_TYPES.OFFER_CREATED, handler);
      eventBus.emitEvent(testEvent);
    });
  });

  describe('async handlers', () => {
    it('async handlers are called', (done) => {
      const handler = async (event: OfferCreatedEvent) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        expect(event.type).toBe(EVENT_TYPES.OFFER_CREATED);
        done();
      };

      registerHandler(EVENT_TYPES.OFFER_CREATED, handler);
      eventBus.emitEvent(createMockOfferCreatedEvent());
    });
  });
});

describe('EVENT_TYPES', () => {
  it('has OFFER_CREATED constant', () => {
    expect(EVENT_TYPES.OFFER_CREATED).toBe('OFFER_CREATED');
  });

  it('has OFFER_ACCEPTED constant', () => {
    expect(EVENT_TYPES.OFFER_ACCEPTED).toBe('OFFER_ACCEPTED');
  });

  it('has CALL_INTENT_CREATED constant', () => {
    expect(EVENT_TYPES.CALL_INTENT_CREATED).toBe('CALL_INTENT_CREATED');
  });

  it('has BROADCAST_ENDED constant', () => {
    expect(EVENT_TYPES.BROADCAST_ENDED).toBe('BROADCAST_ENDED');
  });

  it('all event types are unique', () => {
    const types = Object.values(EVENT_TYPES);
    const uniqueTypes = new Set(types);
    expect(uniqueTypes.size).toBe(types.length);
  });
});
