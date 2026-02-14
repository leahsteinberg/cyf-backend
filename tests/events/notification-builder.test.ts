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
    it('uses friendly default title when no vibe is set', () => {
      const event = createMockOfferCreatedEvent({
        broadcasterDisplayName: 'Alice',
        intentLabel: null,
      });

      const notification = buildOfferCreatedNotification(event, null);

      expect(notification.title).toBe('Alice is free to talk!');
    });

    it('uses vibe-specific title for "hi" intent', () => {
      const event = createMockOfferCreatedEvent({
        broadcasterDisplayName: 'Alice',
        intentLabel: 'hi',
      });

      const notification = buildOfferCreatedNotification(event, null);

      expect(notification.title).toBe('Alice says hi!');
    });

    it('uses vibe-specific title for "catchup" intent', () => {
      const event = createMockOfferCreatedEvent({
        broadcasterDisplayName: 'Alice',
        intentLabel: 'catchup',
      });

      const notification = buildOfferCreatedNotification(event, null);

      expect(notification.title).toBe('Alice wants to catch up!');
    });

    it('uses vibe-specific title for "miss" intent', () => {
      const event = createMockOfferCreatedEvent({
        broadcasterDisplayName: 'Alice',
        intentLabel: 'miss',
      });

      const notification = buildOfferCreatedNotification(event, null);

      expect(notification.title).toBe('Alice misses you!');
    });

    it('uses vibe-specific title for "yap" intent', () => {
      const event = createMockOfferCreatedEvent({
        broadcasterDisplayName: 'Alice',
        intentLabel: 'yap',
      });

      const notification = buildOfferCreatedNotification(event, null);

      expect(notification.title).toBe('Alice is ready to yap!');
    });

    it('includes meeting title in body when present', () => {
      const event = createMockOfferCreatedEvent({
        meetingTitle: 'Quick catch-up',
        scheduledFor: new Date('2025-03-18T15:00:00Z'),
      });

      const notification = buildOfferCreatedNotification(event, null);

      expect(notification.body).toContain('Quick catch-up');
    });

    it('includes vibe noun in body when no meeting title', () => {
      const event = createMockOfferCreatedEvent({
        meetingTitle: null,
        intentLabel: 'catchup',
        scheduledFor: new Date('2025-03-18T15:00:00Z'),
      });

      const notification = buildOfferCreatedNotification(event, null);

      expect(notification.body).toContain('catch up');
    });

    it('shows tap to join when no meeting title and no vibe', () => {
      const event = createMockOfferCreatedEvent({
        meetingTitle: null,
        intentLabel: null,
        scheduledFor: new Date('2025-03-18T15:00:00Z'),
      });

      const notification = buildOfferCreatedNotification(event, null);

      expect(notification.body).toContain('Tap to join');
    });

    it('uses middle dot separator between detail and date', () => {
      const event = createMockOfferCreatedEvent({
        meetingTitle: 'Coffee chat',
      });

      const notification = buildOfferCreatedNotification(event, null);

      expect(notification.body).toContain('·');
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

      const withTimezone = buildOfferCreatedNotification(event, 'America/New_York');
      const withoutTimezone = buildOfferCreatedNotification(event, null);

      expect(withTimezone.body).toBeDefined();
      expect(withoutTimezone.body).toBeDefined();
    });
  });

  describe('buildOfferAcceptedNotification', () => {
    it('creates notification with accepter name', () => {
      const event = createMockOfferAcceptedEvent({
        acceptedByDisplayName: 'Bob',
      });

      const notification = buildOfferAcceptedNotification(event, null);

      expect(notification.title).toBe('Bob is in!');
    });

    it('includes meeting title in body when present', () => {
      const event = createMockOfferAcceptedEvent({
        meetingTitle: 'Weekly sync',
        scheduledFor: new Date('2025-03-18T15:00:00Z'),
      });

      const notification = buildOfferAcceptedNotification(event, null);

      expect(notification.body).toContain('Weekly sync');
      expect(notification.body).toContain('is happening');
    });

    it('uses vibe noun in body when no meeting title', () => {
      const event = createMockOfferAcceptedEvent({
        meetingTitle: null,
        intentLabel: 'yap',
      });

      const notification = buildOfferAcceptedNotification(event, null);

      expect(notification.body).toContain('Your yap session is happening');
    });

    it('falls back to "Your call" when no title and no vibe', () => {
      const event = createMockOfferAcceptedEvent({
        meetingTitle: null,
        intentLabel: null,
      });

      const notification = buildOfferAcceptedNotification(event, null);

      expect(notification.body).toContain('Your call is happening');
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
    it('creates warm notification with caller name', () => {
      const event = createMockCallIntentCreatedEvent({
        fromUserDisplayName: 'Charlie',
      });

      const notification = buildCallIntentNotification(event);

      expect(notification.title).toBe('Charlie is thinking of you');
    });

    it('has friendly body text', () => {
      const event = createMockCallIntentCreatedEvent();

      const notification = buildCallIntentNotification(event);

      expect(notification.body).toBe("They'd love to find a time to talk");
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
    it('creates notification with broadcaster name', () => {
      const event = createMockBroadcastEndedEvent({
        broadcasterDisplayName: 'Diana',
      });

      const notification = buildBroadcastEndedNotification(event);

      expect(notification.title).toBe('Diana is no longer free');
    });

    it('has encouraging body text', () => {
      const event = createMockBroadcastEndedEvent();

      const notification = buildBroadcastEndedNotification(event);

      expect(notification.body).toBe('Maybe next time!');
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
