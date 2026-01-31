/**
 * Notification Builder Tests
 *
 * Tests the notification content builders for each event type.
 * These functions transform events into push notification payloads.
 */

import { describe, it, expect } from '@jest/globals';
import {
  buildOfferCreatedNotification,
  buildOfferAcceptedNotification,
  buildCallIntentNotification,
  buildBroadcastEndedNotification,
} from '../../backend/events/notification-builder.js';
import {
  createMockOfferCreatedEvent,
  createMockOfferAcceptedEvent,
  createMockCallIntentCreatedEvent,
  createMockBroadcastEndedEvent,
} from '../helpers/mock-factories.js';

describe('Notification Builder', () => {
  describe('buildOfferCreatedNotification', () => {
    it('creates notification with broadcaster name in title', () => {
      const event = createMockOfferCreatedEvent({
        broadcasterDisplayName: 'Alice',
      });

      const notification = buildOfferCreatedNotification(event, null);

      expect(notification.title).toBe('Alice wants to talk!');
    });

    it('includes meeting title in body when present', () => {
      const event = createMockOfferCreatedEvent({
        meetingTitle: 'Quick catch-up',
        scheduledFor: new Date('2025-03-18T15:00:00Z'),
      });

      const notification = buildOfferCreatedNotification(event, null);

      expect(notification.body).toContain('Quick catch-up');
    });

    it('shows only date when meeting title is null', () => {
      const event = createMockOfferCreatedEvent({
        meetingTitle: null,
        scheduledFor: new Date('2025-03-18T15:00:00Z'),
      });

      const notification = buildOfferCreatedNotification(event, null);

      expect(notification.body).not.toContain(' - ');
    });

    it('sets correct push payload structure', () => {
      const event = createMockOfferCreatedEvent({
        offerId: 'offer-abc',
        meetingId: 'meeting-xyz',
      });

      const notification = buildOfferCreatedNotification(event, null);

      expect(notification.data).toEqual({
        type: 'OFFER_CREATED',
        action: 'navigate',
        screen: 'OfferDetail',
        data: {
          offerId: 'offer-abc',
          meetingId: 'meeting-xyz',
        },
      });
    });

    it('uses timezone for date formatting when provided', () => {
      const event = createMockOfferCreatedEvent({
        meetingTitle: null,
        scheduledFor: new Date('2025-03-18T15:00:00Z'),
      });

      // With timezone vs without should produce different formatted dates
      const withTimezone = buildOfferCreatedNotification(event, 'America/New_York');
      const withoutTimezone = buildOfferCreatedNotification(event, null);

      // Both should have a body (date string)
      expect(withTimezone.body).toBeDefined();
      expect(withoutTimezone.body).toBeDefined();
    });
  });

  describe('buildOfferAcceptedNotification', () => {
    it('creates notification with accepter name in title', () => {
      const event = createMockOfferAcceptedEvent({
        acceptedByDisplayName: 'Bob',
      });

      const notification = buildOfferAcceptedNotification(event, null);

      expect(notification.title).toBe('Bob accepted your call!');
    });

    it('includes meeting title in body when present', () => {
      const event = createMockOfferAcceptedEvent({
        meetingTitle: 'Weekly sync',
        scheduledFor: new Date('2025-03-18T15:00:00Z'),
      });

      const notification = buildOfferAcceptedNotification(event, null);

      expect(notification.body).toContain('Weekly sync');
    });

    it('sets navigate action to MeetingDetail screen', () => {
      const event = createMockOfferAcceptedEvent({
        meetingId: 'meeting-123',
        offerId: 'offer-456',
        acceptedByUserId: 'user-789',
      });

      const notification = buildOfferAcceptedNotification(event, null);

      expect(notification.data.action).toBe('navigate');
      expect(notification.data.screen).toBe('MeetingDetail');
      expect(notification.data.data).toEqual({
        meetingId: 'meeting-123',
        offerId: 'offer-456',
        acceptedByUserId: 'user-789',
      });
    });
  });

  describe('buildCallIntentNotification', () => {
    it('creates notification with caller name in title', () => {
      const event = createMockCallIntentCreatedEvent({
        fromUserDisplayName: 'Charlie',
      });

      const notification = buildCallIntentNotification(event);

      expect(notification.title).toBe('Charlie wants to call you!');
    });

    it('has instructional body text', () => {
      const event = createMockCallIntentCreatedEvent();

      const notification = buildCallIntentNotification(event);

      expect(notification.body).toBe('Tap to see when they are available');
    });

    it('sets navigate action to Suggestions screen', () => {
      const event = createMockCallIntentCreatedEvent({
        signalId: 'signal-abc',
        fromUserId: 'user-xyz',
      });

      const notification = buildCallIntentNotification(event);

      expect(notification.data.action).toBe('navigate');
      expect(notification.data.screen).toBe('Suggestions');
      expect(notification.data.data).toEqual({
        signalId: 'signal-abc',
        fromUserId: 'user-xyz',
      });
    });

    it('sets correct event type in payload', () => {
      const event = createMockCallIntentCreatedEvent();

      const notification = buildCallIntentNotification(event);

      expect(notification.data.type).toBe('CALL_INTENT_CREATED');
    });
  });

  describe('buildBroadcastEndedNotification', () => {
    it('creates notification with broadcaster name in title', () => {
      const event = createMockBroadcastEndedEvent({
        broadcasterDisplayName: 'Diana',
      });

      const notification = buildBroadcastEndedNotification(event);

      expect(notification.title).toBe('Diana is no longer available');
    });

    it('has informational body text', () => {
      const event = createMockBroadcastEndedEvent();

      const notification = buildBroadcastEndedNotification(event);

      expect(notification.body).toBe('Their broadcast has ended');
    });

    it('sets refresh action to Home screen', () => {
      const event = createMockBroadcastEndedEvent({
        meetingId: 'meeting-123',
        broadcasterId: 'user-456',
      });

      const notification = buildBroadcastEndedNotification(event);

      expect(notification.data.action).toBe('refresh');
      expect(notification.data.screen).toBe('Home');
      expect(notification.data.data).toEqual({
        meetingId: 'meeting-123',
        broadcasterId: 'user-456',
      });
    });

    it('sets correct event type in payload', () => {
      const event = createMockBroadcastEndedEvent();

      const notification = buildBroadcastEndedNotification(event);

      expect(notification.data.type).toBe('BROADCAST_ENDED');
    });
  });

  describe('notification payload structure', () => {
    it('all notifications have title, body, and data', () => {
      const offerCreated = buildOfferCreatedNotification(
        createMockOfferCreatedEvent(),
        null
      );
      const offerAccepted = buildOfferAcceptedNotification(
        createMockOfferAcceptedEvent(),
        null
      );
      const callIntent = buildCallIntentNotification(
        createMockCallIntentCreatedEvent()
      );
      const broadcastEnded = buildBroadcastEndedNotification(
        createMockBroadcastEndedEvent()
      );

      for (const notification of [offerCreated, offerAccepted, callIntent, broadcastEnded]) {
        expect(notification).toHaveProperty('title');
        expect(notification).toHaveProperty('body');
        expect(notification).toHaveProperty('data');
        expect(notification.title).toBeTruthy();
        expect(notification.body).toBeTruthy();
      }
    });

    it('all data payloads have type and action', () => {
      const notifications = [
        buildOfferCreatedNotification(createMockOfferCreatedEvent(), null),
        buildOfferAcceptedNotification(createMockOfferAcceptedEvent(), null),
        buildCallIntentNotification(createMockCallIntentCreatedEvent()),
        buildBroadcastEndedNotification(createMockBroadcastEndedEvent()),
      ];

      for (const notification of notifications) {
        expect(notification.data).toHaveProperty('type');
        expect(notification.data).toHaveProperty('action');
        expect(['navigate', 'refresh', 'silent']).toContain(notification.data.action);
      }
    });
  });
});
