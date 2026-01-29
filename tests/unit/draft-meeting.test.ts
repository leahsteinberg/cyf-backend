/**
 * Draft Meeting Tests
 *
 * Tests the creation and validation of DRAFT meetings (suggestions).
 * DRAFT meetings are system-generated meeting proposals that users
 * can accept or dismiss.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { validateDraftMeetingOwnership } from '../../backend/draft-meeting.js';
import { createMockMeeting, createMockDraftMeeting } from '../helpers/mock-factories.js';

describe('Draft Meeting Logic', () => {
  /**
   * validateDraftMeetingOwnership
   *
   * Ensures only the owner can modify their draft meetings
   */
  describe('validateDraftMeetingOwnership', () => {
    it('allows the owner to modify their own draft', () => {
      const draft = createMockDraftMeeting({
        userFromId: 'user-123',
      });

      // Should not throw
      expect(() => {
        validateDraftMeetingOwnership(draft, 'user-123');
      }).not.toThrow();
    });

    it('throws when non-owner tries to modify', () => {
      const draft = createMockDraftMeeting({
        userFromId: 'user-123',
      });

      expect(() => {
        validateDraftMeetingOwnership(draft, 'different-user');
      }).toThrow('You can only modify your own draft meetings');
    });

    it('throws when meeting is not in DRAFT state', () => {
      const searchingMeeting = createMockMeeting({
        userFromId: 'user-123',
        meetingState: 'SEARCHING',
      });

      expect(() => {
        validateDraftMeetingOwnership(searchingMeeting, 'user-123');
      }).toThrow('Meeting is not in DRAFT state');
    });

    it('throws when ACCEPTED meeting is modified', () => {
      const acceptedMeeting = createMockMeeting({
        userFromId: 'user-123',
        meetingState: 'ACCEPTED',
      });

      expect(() => {
        validateDraftMeetingOwnership(acceptedMeeting, 'user-123');
      }).toThrow(/DRAFT state/);
    });

    it('includes current state in error message', () => {
      const canceledMeeting = createMockMeeting({
        userFromId: 'user-123',
        meetingState: 'CANCELED',
      });

      expect(() => {
        validateDraftMeetingOwnership(canceledMeeting, 'user-123');
      }).toThrow(/current: CANCELED/);
    });
  });

  /**
   * Draft Meeting Structure
   *
   * Tests that draft meetings have the expected structure
   */
  describe('draft meeting structure', () => {
    it('draft meetings have DRAFT meetingState', () => {
      const draft = createMockDraftMeeting();

      expect(draft.meetingState).toBe('DRAFT');
    });

    it('draft meetings can have a suggestionReason', () => {
      const draft = createMockDraftMeeting({
        suggestionReason: 'You usually walk around this time',
      });

      expect(draft.suggestionReason).toBe('You usually walk around this time');
    });

    it('draft meetings can have a sourceType', () => {
      const draft = createMockDraftMeeting({
        sourceType: 'SYSTEM_PATTERN',
      });

      expect(draft.sourceType).toBe('SYSTEM_PATTERN');
    });

    it('draft meetings can have targetUserIds', () => {
      const draft = createMockDraftMeeting({
        targetType: 'FRIEND_SPECIFIC',
        targetUserIds: ['friend-1', 'friend-2'],
      });

      expect(draft.targetUserIds).toEqual(['friend-1', 'friend-2']);
    });
  });
});
