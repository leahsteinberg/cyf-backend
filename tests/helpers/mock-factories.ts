/**
 * Mock Factory Functions
 *
 * These functions create test objects with sensible defaults.
 * Override any field by passing it in the options object.
 */

import type { Meeting, Offer, User } from '../../types.js';

/**
 * Creates a mock user for testing
 */
export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-test-123',
    name: 'Test User',
    email: 'test@example.com',
    username: 'testuser',
    displayUsername: '@testuser',
    ...overrides,
  };
}

/**
 * Creates a mock meeting for testing
 */
export function createMockMeeting(overrides: Partial<Meeting> = {}): Meeting {
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

  return {
    id: 'meeting-test-123',
    userFromId: 'user-test-123',
    scheduledFor: now,
    scheduledEnd: oneHourFromNow,
    backupScheduledTimes: [],
    createdAt: now,
    acceptedUserId: null,
    acceptedUserIds: [],
    meetingState: 'SEARCHING',
    title: 'Test Meeting',
    meetingType: 'ADVANCE',
    timeType: 'FUTURE',
    targetType: 'OPEN',
    sourceType: null,
    intentLabel: null,
    targetUserIds: [],
    suggestionReason: null,
    minParticipants: 1,
    maxParticipants: 1,
    ...overrides,
  };
}

/**
 * Creates a mock broadcast meeting (IMMEDIATE time type)
 */
export function createMockBroadcast(overrides: Partial<Meeting> = {}): Meeting {
  return createMockMeeting({
    meetingType: 'BROADCAST',
    timeType: 'IMMEDIATE',
    targetType: 'OPEN',
    ...overrides,
  });
}

/**
 * Creates a mock DRAFT meeting (suggestion)
 */
export function createMockDraftMeeting(overrides: Partial<Meeting> = {}): Meeting {
  return createMockMeeting({
    meetingState: 'DRAFT',
    sourceType: 'SYSTEM_PATTERN',
    suggestionReason: 'You usually walk around this time',
    ...overrides,
  });
}

/**
 * Creates a mock offer for testing
 */
export function createMockOffer(overrides: Partial<Offer> = {}): Offer {
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

  return {
    id: 'offer-test-123',
    meetingId: 'meeting-test-123',
    userOfferedId: 'user-offered-123',
    createdAt: now,
    offerState: 'OPEN',
    expiresAt: oneHourFromNow,
    ...overrides,
  };
}

/**
 * Creates a meeting that is past its scheduled end time (stale)
 */
export function createStaleMeeting(overrides: Partial<Meeting> = {}): Meeting {
  const pastDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
  const pastEndDate = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago

  return createMockMeeting({
    scheduledFor: pastDate,
    scheduledEnd: pastEndDate,
    ...overrides,
  });
}

/**
 * Creates a meeting in a terminal state
 */
export function createTerminalMeeting(
  state: 'PAST' | 'EXPIRED' | 'CANCELED' | 'DISMISSED_DRAFT',
  overrides: Partial<Meeting> = {}
): Meeting {
  return createMockMeeting({
    meetingState: state,
    ...overrides,
  });
}
