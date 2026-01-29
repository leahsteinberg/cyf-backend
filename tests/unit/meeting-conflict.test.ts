/**
 * Meeting Conflict Detection Tests
 *
 * Tests the logic for detecting overlapping meeting times.
 * This is critical business logic - users shouldn't be able to
 * double-book themselves.
 */

import { describe, it, expect } from '@jest/globals';
import { findMeetingTimeConflict } from '../../backend/meeting-conflict.js';
import { createMockMeeting, createMockBroadcast, createMockDraftMeeting } from '../helpers/mock-factories.js';

describe('Meeting Conflict Detection', () => {
  // Helper to create dates relative to a base time
  const baseTime = new Date('2025-03-15T14:00:00Z');
  const hour = (n: number) => new Date(baseTime.getTime() + n * 60 * 60 * 1000);

  /**
   * Basic Overlap Detection
   */
  describe('time overlap detection', () => {
    it('detects conflict when new meeting starts during existing meeting', () => {
      // Existing: 2pm - 4pm
      // New: 3pm - 5pm (starts during existing)
      const existingMeeting = createMockMeeting({
        scheduledFor: hour(0),  // 2pm
        scheduledEnd: hour(2),  // 4pm
        meetingState: 'SEARCHING',
      });

      const result = findMeetingTimeConflict({
        userCreatedMeetings: [existingMeeting],
        userAcceptedMeetings: [],
        scheduledFor: hour(1),  // 3pm
        scheduledEnd: hour(3),  // 5pm
      });

      expect(result).not.toBeNull();
      expect(result?.type).toBe('created');
    });

    it('detects conflict when new meeting ends during existing meeting', () => {
      // Existing: 2pm - 4pm
      // New: 1pm - 3pm (ends during existing)
      const existingMeeting = createMockMeeting({
        scheduledFor: hour(0),  // 2pm
        scheduledEnd: hour(2),  // 4pm
        meetingState: 'SEARCHING',
      });

      const result = findMeetingTimeConflict({
        userCreatedMeetings: [existingMeeting],
        userAcceptedMeetings: [],
        scheduledFor: hour(-1), // 1pm
        scheduledEnd: hour(1),  // 3pm
      });

      expect(result).not.toBeNull();
    });

    it('detects conflict when new meeting completely contains existing', () => {
      // Existing: 2pm - 3pm
      // New: 1pm - 5pm (completely contains existing)
      const existingMeeting = createMockMeeting({
        scheduledFor: hour(0),  // 2pm
        scheduledEnd: hour(1),  // 3pm
        meetingState: 'SEARCHING',
      });

      const result = findMeetingTimeConflict({
        userCreatedMeetings: [existingMeeting],
        userAcceptedMeetings: [],
        scheduledFor: hour(-1), // 1pm
        scheduledEnd: hour(3),  // 5pm
      });

      expect(result).not.toBeNull();
    });

    it('detects conflict when new meeting is completely inside existing', () => {
      // Existing: 1pm - 5pm
      // New: 2pm - 3pm (inside existing)
      const existingMeeting = createMockMeeting({
        scheduledFor: hour(-1), // 1pm
        scheduledEnd: hour(3),  // 5pm
        meetingState: 'SEARCHING',
      });

      const result = findMeetingTimeConflict({
        userCreatedMeetings: [existingMeeting],
        userAcceptedMeetings: [],
        scheduledFor: hour(0),  // 2pm
        scheduledEnd: hour(1),  // 3pm
      });

      expect(result).not.toBeNull();
    });

    it('allows back-to-back meetings (no overlap)', () => {
      // Existing: 2pm - 3pm
      // New: 3pm - 4pm (starts exactly when existing ends)
      const existingMeeting = createMockMeeting({
        scheduledFor: hour(0),  // 2pm
        scheduledEnd: hour(1),  // 3pm
        meetingState: 'SEARCHING',
      });

      const result = findMeetingTimeConflict({
        userCreatedMeetings: [existingMeeting],
        userAcceptedMeetings: [],
        scheduledFor: hour(1),  // 3pm
        scheduledEnd: hour(2),  // 4pm
      });

      expect(result).toBeNull();
    });

    it('allows completely separate time slots', () => {
      // Existing: 2pm - 3pm
      // New: 5pm - 6pm (completely separate)
      const existingMeeting = createMockMeeting({
        scheduledFor: hour(0),  // 2pm
        scheduledEnd: hour(1),  // 3pm
        meetingState: 'SEARCHING',
      });

      const result = findMeetingTimeConflict({
        userCreatedMeetings: [existingMeeting],
        userAcceptedMeetings: [],
        scheduledFor: hour(3),  // 5pm
        scheduledEnd: hour(4),  // 6pm
      });

      expect(result).toBeNull();
    });
  });

  /**
   * Created vs Accepted Meetings
   */
  describe('created vs accepted meetings', () => {
    it('checks conflicts against meetings user created', () => {
      const createdMeeting = createMockMeeting({
        id: 'created-1',
        scheduledFor: hour(0),
        scheduledEnd: hour(2),
        meetingState: 'SEARCHING',
      });

      const result = findMeetingTimeConflict({
        userCreatedMeetings: [createdMeeting],
        userAcceptedMeetings: [],
        scheduledFor: hour(1),
        scheduledEnd: hour(3),
      });

      expect(result?.type).toBe('created');
      expect(result?.conflictingMeeting.id).toBe('created-1');
    });

    it('checks conflicts against meetings user accepted', () => {
      const acceptedMeeting = createMockMeeting({
        id: 'accepted-1',
        scheduledFor: hour(0),
        scheduledEnd: hour(2),
        meetingState: 'ACCEPTED',
      });

      const result = findMeetingTimeConflict({
        userCreatedMeetings: [],
        userAcceptedMeetings: [acceptedMeeting],
        scheduledFor: hour(1),
        scheduledEnd: hour(3),
      });

      expect(result?.type).toBe('accepted');
      expect(result?.conflictingMeeting.id).toBe('accepted-1');
    });

    it('prioritizes created meetings when both conflict', () => {
      const createdMeeting = createMockMeeting({
        id: 'created-1',
        scheduledFor: hour(0),
        scheduledEnd: hour(2),
        meetingState: 'SEARCHING',
      });
      const acceptedMeeting = createMockMeeting({
        id: 'accepted-1',
        scheduledFor: hour(0),
        scheduledEnd: hour(2),
        meetingState: 'ACCEPTED',
      });

      const result = findMeetingTimeConflict({
        userCreatedMeetings: [createdMeeting],
        userAcceptedMeetings: [acceptedMeeting],
        scheduledFor: hour(1),
        scheduledEnd: hour(3),
      });

      // Should find created meeting first
      expect(result?.type).toBe('created');
    });
  });

  /**
   * Excluded Meeting Types
   *
   * These meetings should NOT cause conflicts
   */
  describe('excluded meeting types', () => {
    it('ignores PAST meetings', () => {
      const pastMeeting = createMockMeeting({
        scheduledFor: hour(0),
        scheduledEnd: hour(2),
        meetingState: 'PAST',
      });

      const result = findMeetingTimeConflict({
        userCreatedMeetings: [pastMeeting],
        userAcceptedMeetings: [],
        scheduledFor: hour(1),
        scheduledEnd: hour(3),
      });

      expect(result).toBeNull();
    });

    it('ignores DRAFT meetings (not yet activated)', () => {
      const draftMeeting = createMockDraftMeeting({
        scheduledFor: hour(0),
        scheduledEnd: hour(2),
      });

      const result = findMeetingTimeConflict({
        userCreatedMeetings: [draftMeeting],
        userAcceptedMeetings: [],
        scheduledFor: hour(1),
        scheduledEnd: hour(3),
      });

      expect(result).toBeNull();
    });

    it('ignores DISMISSED_DRAFT meetings', () => {
      const dismissedMeeting = createMockMeeting({
        scheduledFor: hour(0),
        scheduledEnd: hour(2),
        meetingState: 'DISMISSED_DRAFT',
      });

      const result = findMeetingTimeConflict({
        userCreatedMeetings: [dismissedMeeting],
        userAcceptedMeetings: [],
        scheduledFor: hour(1),
        scheduledEnd: hour(3),
      });

      expect(result).toBeNull();
    });

    it('ignores BROADCAST meetings (IMMEDIATE timeType)', () => {
      const broadcastMeeting = createMockBroadcast({
        scheduledFor: hour(0),
        scheduledEnd: hour(2),
        meetingState: 'SEARCHING',
      });

      const result = findMeetingTimeConflict({
        userCreatedMeetings: [broadcastMeeting],
        userAcceptedMeetings: [],
        scheduledFor: hour(1),
        scheduledEnd: hour(3),
      });

      expect(result).toBeNull();
    });

    it('ignores UNKNOWN timeType meetings', () => {
      const unknownTimeMeeting = createMockMeeting({
        scheduledFor: hour(0),
        scheduledEnd: hour(2),
        timeType: 'UNKNOWN',
        meetingState: 'DRAFT',
      });

      const result = findMeetingTimeConflict({
        userCreatedMeetings: [unknownTimeMeeting],
        userAcceptedMeetings: [],
        scheduledFor: hour(1),
        scheduledEnd: hour(3),
      });

      expect(result).toBeNull();
    });
  });

  /**
   * Exclude Meeting ID
   *
   * When checking a meeting against itself (e.g., updating time)
   */
  describe('excludeMeetingId', () => {
    it('excludes the specified meeting from conflict check', () => {
      const meeting = createMockMeeting({
        id: 'meeting-to-update',
        scheduledFor: hour(0),
        scheduledEnd: hour(2),
        meetingState: 'SEARCHING',
      });

      // Check same time slot, excluding the meeting itself
      const result = findMeetingTimeConflict({
        userCreatedMeetings: [meeting],
        userAcceptedMeetings: [],
        scheduledFor: hour(0),
        scheduledEnd: hour(2),
        excludeMeetingId: 'meeting-to-update',
      });

      expect(result).toBeNull();
    });

    it('still finds conflicts with other meetings', () => {
      const meetingToUpdate = createMockMeeting({
        id: 'meeting-to-update',
        scheduledFor: hour(0),
        scheduledEnd: hour(2),
        meetingState: 'SEARCHING',
      });
      const otherMeeting = createMockMeeting({
        id: 'other-meeting',
        scheduledFor: hour(1),
        scheduledEnd: hour(3),
        meetingState: 'SEARCHING',
      });

      const result = findMeetingTimeConflict({
        userCreatedMeetings: [meetingToUpdate, otherMeeting],
        userAcceptedMeetings: [],
        scheduledFor: hour(0),
        scheduledEnd: hour(2),
        excludeMeetingId: 'meeting-to-update',
      });

      expect(result).not.toBeNull();
      expect(result?.conflictingMeeting.id).toBe('other-meeting');
    });
  });

  /**
   * Empty Lists
   */
  describe('empty meeting lists', () => {
    it('returns null when both lists are empty', () => {
      const result = findMeetingTimeConflict({
        userCreatedMeetings: [],
        userAcceptedMeetings: [],
        scheduledFor: hour(0),
        scheduledEnd: hour(2),
      });

      expect(result).toBeNull();
    });
  });
});
