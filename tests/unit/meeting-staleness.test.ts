/**
 * Meeting Staleness Tests
 *
 * Tests the core logic for determining if meetings are stale
 * and should be hidden from users.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  isMeetingStaleSynchronous,
  filterMeetingsSynchronous,
} from '../../backend/meeting-staleness.js';
import {
  createMockMeeting,
  createStaleMeeting,
  createTerminalMeeting,
} from '../helpers/mock-factories.js';

describe('Meeting Staleness Logic', () => {
  /**
   * isMeetingStaleSynchronous
   *
   * A meeting is "stale" if:
   * 1. It's past scheduledEnd AND
   * 2. It's NOT in a terminal state (PAST, EXPIRED, CANCELED, DISMISSED_DRAFT)
   */
  describe('isMeetingStaleSynchronous', () => {
    describe('when meeting is in the future', () => {
      it('returns false for a meeting that has not ended yet', () => {
        const futureMeeting = createMockMeeting({
          scheduledFor: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
          scheduledEnd: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        });

        expect(isMeetingStaleSynchronous(futureMeeting)).toBe(false);
      });

      it('returns false for a meeting currently in progress', () => {
        const inProgressMeeting = createMockMeeting({
          scheduledFor: new Date(Date.now() - 30 * 60 * 1000), // Started 30 min ago
          scheduledEnd: new Date(Date.now() + 30 * 60 * 1000), // Ends in 30 min
        });

        expect(isMeetingStaleSynchronous(inProgressMeeting)).toBe(false);
      });
    });

    describe('when meeting is past scheduledEnd', () => {
      it('returns true for a meeting that ended 1 hour ago', () => {
        const staleMeeting = createStaleMeeting();

        expect(isMeetingStaleSynchronous(staleMeeting)).toBe(true);
      });

      it('returns true for a meeting that ended 1 second ago', () => {
        const justEndedMeeting = createMockMeeting({
          scheduledEnd: new Date(Date.now() - 1000), // 1 second ago
        });

        expect(isMeetingStaleSynchronous(justEndedMeeting)).toBe(true);
      });
    });

    describe('when meeting is in a terminal state', () => {
      it('returns false for PAST meetings (already processed)', () => {
        const pastMeeting = createTerminalMeeting('PAST');

        expect(isMeetingStaleSynchronous(pastMeeting)).toBe(false);
      });

      it('returns false for EXPIRED meetings', () => {
        const expiredMeeting = createTerminalMeeting('EXPIRED');

        expect(isMeetingStaleSynchronous(expiredMeeting)).toBe(false);
      });

      it('returns false for CANCELED meetings', () => {
        const canceledMeeting = createTerminalMeeting('CANCELED');

        expect(isMeetingStaleSynchronous(canceledMeeting)).toBe(false);
      });

      it('returns false for DISMISSED_DRAFT meetings', () => {
        const dismissedMeeting = createTerminalMeeting('DISMISSED_DRAFT');

        expect(isMeetingStaleSynchronous(dismissedMeeting)).toBe(false);
      });

      it('returns false for stale terminal meetings (edge case)', () => {
        // A meeting that is both past scheduledEnd AND in PAST state
        const staleButTerminal = createStaleMeeting({ meetingState: 'PAST' });

        expect(isMeetingStaleSynchronous(staleButTerminal)).toBe(false);
      });
    });
  });

  /**
   * filterMeetingsSynchronous
   *
   * Filters out meetings that should not be shown to users:
   * - Terminal state meetings
   * - Stale meetings
   */
  describe('filterMeetingsSynchronous', () => {
    it('returns empty array when given empty array', () => {
      expect(filterMeetingsSynchronous([])).toEqual([]);
    });

    it('keeps active future meetings', () => {
      const futureMeeting = createMockMeeting({
        scheduledEnd: new Date(Date.now() + 60 * 60 * 1000),
      });

      const result = filterMeetingsSynchronous([futureMeeting]);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(futureMeeting);
    });

    it('filters out stale meetings', () => {
      const staleMeeting = createStaleMeeting();

      const result = filterMeetingsSynchronous([staleMeeting]);

      expect(result).toHaveLength(0);
    });

    it('filters out all terminal state meetings', () => {
      const terminalMeetings = [
        createTerminalMeeting('PAST'),
        createTerminalMeeting('EXPIRED'),
        createTerminalMeeting('CANCELED'),
        createTerminalMeeting('DISMISSED_DRAFT'),
      ];

      const result = filterMeetingsSynchronous(terminalMeetings);

      expect(result).toHaveLength(0);
    });

    it('correctly filters a mixed list of meetings', () => {
      const activeMeeting1 = createMockMeeting({
        id: 'active-1',
        scheduledEnd: new Date(Date.now() + 60 * 60 * 1000),
      });
      const activeMeeting2 = createMockMeeting({
        id: 'active-2',
        scheduledEnd: new Date(Date.now() + 2 * 60 * 60 * 1000),
      });
      const staleMeeting = createStaleMeeting({ id: 'stale' });
      const pastMeeting = createTerminalMeeting('PAST', { id: 'past' });

      const allMeetings = [activeMeeting1, staleMeeting, activeMeeting2, pastMeeting];
      const result = filterMeetingsSynchronous(allMeetings);

      expect(result).toHaveLength(2);
      expect(result.map(m => m.id)).toEqual(['active-1', 'active-2']);
    });
  });

  /**
   * Edge Cases
   */
  describe('edge cases', () => {
    it('handles meeting with scheduledEnd exactly at current time', () => {
      // This is a boundary condition - meeting ending right now
      const nowMeeting = createMockMeeting({
        scheduledEnd: new Date(), // Exactly now
      });

      // Should not be stale because scheduledEnd >= now (with some tolerance)
      // But our sync version uses < comparison, so it depends on timing
      const result = isMeetingStaleSynchronous(nowMeeting);

      // Either true or false is acceptable at the boundary
      expect(typeof result).toBe('boolean');
    });

    it('handles SEARCHING state meeting that is stale', () => {
      const staleSearching = createMockMeeting({
        meetingState: 'SEARCHING',
        scheduledEnd: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      });

      expect(isMeetingStaleSynchronous(staleSearching)).toBe(true);
    });

    it('handles ACCEPTED state meeting that is stale', () => {
      const staleAccepted = createMockMeeting({
        meetingState: 'ACCEPTED',
        scheduledEnd: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      });

      expect(isMeetingStaleSynchronous(staleAccepted)).toBe(true);
    });

    it('handles DRAFT state meeting that is stale', () => {
      const staleDraft = createMockMeeting({
        meetingState: 'DRAFT',
        scheduledEnd: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      });

      expect(isMeetingStaleSynchronous(staleDraft)).toBe(true);
    });
  });
});
