/**
 * Type Helper Function Tests
 *
 * Tests the helper functions in types.ts that handle
 * meeting type conversions and checks.
 */

import { describe, it, expect } from '@jest/globals';
import {
  meetingTypeToNew,
  newToMeetingType,
  getEffectiveTimeType,
  getEffectiveTargetType,
  isBroadcastMeeting,
  isOpenBroadcast,
  hasNewFields,
} from '../../types.js';
import { createMockMeeting, createMockBroadcast } from '../helpers/mock-factories.js';

describe('Type Helper Functions', () => {
  /**
   * meetingTypeToNew
   *
   * Converts old MeetingType to new TimeType/TargetType system
   */
  describe('meetingTypeToNew', () => {
    it('converts ADVANCE to FUTURE + OPEN', () => {
      const result = meetingTypeToNew('ADVANCE');

      expect(result.timeType).toBe('FUTURE');
      expect(result.targetType).toBe('OPEN');
    });

    it('converts BROADCAST to IMMEDIATE + OPEN', () => {
      const result = meetingTypeToNew('BROADCAST');

      expect(result.timeType).toBe('IMMEDIATE');
      expect(result.targetType).toBe('OPEN');
    });
  });

  /**
   * newToMeetingType
   *
   * Converts new TimeType/TargetType back to old MeetingType
   */
  describe('newToMeetingType', () => {
    it('converts IMMEDIATE + OPEN to BROADCAST', () => {
      const result = newToMeetingType('IMMEDIATE', 'OPEN');

      expect(result).toBe('BROADCAST');
    });

    it('converts FUTURE + OPEN to ADVANCE', () => {
      const result = newToMeetingType('FUTURE', 'OPEN');

      expect(result).toBe('ADVANCE');
    });

    it('defaults to ADVANCE for new combinations not in old system', () => {
      // FRIEND_SPECIFIC didn't exist in old system
      expect(newToMeetingType('FUTURE', 'FRIEND_SPECIFIC')).toBe('ADVANCE');
      expect(newToMeetingType('IMMEDIATE', 'FRIEND_SPECIFIC')).toBe('ADVANCE');
      expect(newToMeetingType('UNKNOWN', 'OPEN')).toBe('ADVANCE');
    });
  });

  /**
   * getEffectiveTimeType
   *
   * Gets the TimeType, falling back to deriving it from old meetingType
   */
  describe('getEffectiveTimeType', () => {
    it('returns timeType when explicitly set', () => {
      const meeting = createMockMeeting({ timeType: 'FUTURE' });

      expect(getEffectiveTimeType(meeting)).toBe('FUTURE');
    });

    it('returns IMMEDIATE when timeType is IMMEDIATE', () => {
      const meeting = createMockMeeting({ timeType: 'IMMEDIATE' });

      expect(getEffectiveTimeType(meeting)).toBe('IMMEDIATE');
    });

    it('falls back to deriving from meetingType when timeType is null', () => {
      const advanceMeeting = createMockMeeting({
        meetingType: 'ADVANCE',
        timeType: null,
      });

      expect(getEffectiveTimeType(advanceMeeting)).toBe('FUTURE');
    });

    it('derives IMMEDIATE from BROADCAST meetingType', () => {
      const broadcastMeeting = createMockMeeting({
        meetingType: 'BROADCAST',
        timeType: null,
      });

      expect(getEffectiveTimeType(broadcastMeeting)).toBe('IMMEDIATE');
    });
  });

  /**
   * getEffectiveTargetType
   *
   * Gets the TargetType, falling back to deriving it from old meetingType
   */
  describe('getEffectiveTargetType', () => {
    it('returns targetType when explicitly set', () => {
      const meeting = createMockMeeting({ targetType: 'FRIEND_SPECIFIC' });

      expect(getEffectiveTargetType(meeting)).toBe('FRIEND_SPECIFIC');
    });

    it('returns OPEN when targetType is OPEN', () => {
      const meeting = createMockMeeting({ targetType: 'OPEN' });

      expect(getEffectiveTargetType(meeting)).toBe('OPEN');
    });

    it('falls back to deriving from meetingType when targetType is null', () => {
      const oldStyleMeeting = createMockMeeting({
        meetingType: 'BROADCAST',
        targetType: null,
      });

      // Old BROADCAST was always OPEN target
      expect(getEffectiveTargetType(oldStyleMeeting)).toBe('OPEN');
    });
  });

  /**
   * isBroadcastMeeting
   *
   * A meeting is a "broadcast" if its effective timeType is IMMEDIATE
   */
  describe('isBroadcastMeeting', () => {
    it('returns true for IMMEDIATE timeType meetings', () => {
      const broadcast = createMockBroadcast();

      expect(isBroadcastMeeting(broadcast)).toBe(true);
    });

    it('returns false for FUTURE timeType meetings', () => {
      const advance = createMockMeeting({ timeType: 'FUTURE' });

      expect(isBroadcastMeeting(advance)).toBe(false);
    });

    it('returns false for UNKNOWN timeType meetings', () => {
      const unknown = createMockMeeting({ timeType: 'UNKNOWN' });

      expect(isBroadcastMeeting(unknown)).toBe(false);
    });

    it('correctly identifies old-style BROADCAST meetings', () => {
      const oldBroadcast = createMockMeeting({
        meetingType: 'BROADCAST',
        timeType: null,
      });

      expect(isBroadcastMeeting(oldBroadcast)).toBe(true);
    });

    it('correctly identifies old-style ADVANCE meetings as not broadcasts', () => {
      const oldAdvance = createMockMeeting({
        meetingType: 'ADVANCE',
        timeType: null,
      });

      expect(isBroadcastMeeting(oldAdvance)).toBe(false);
    });
  });

  /**
   * isOpenBroadcast
   *
   * A meeting is an "open broadcast" if it's IMMEDIATE + OPEN
   * This is the traditional broadcast behavior (broadcast to all friends)
   */
  describe('isOpenBroadcast', () => {
    it('returns true for IMMEDIATE + OPEN meetings', () => {
      const openBroadcast = createMockBroadcast({
        timeType: 'IMMEDIATE',
        targetType: 'OPEN',
      });

      expect(isOpenBroadcast(openBroadcast)).toBe(true);
    });

    it('returns false for IMMEDIATE + FRIEND_SPECIFIC (targeted broadcast)', () => {
      const targetedBroadcast = createMockBroadcast({
        timeType: 'IMMEDIATE',
        targetType: 'FRIEND_SPECIFIC',
      });

      expect(isOpenBroadcast(targetedBroadcast)).toBe(false);
    });

    it('returns false for FUTURE + OPEN (advance meeting)', () => {
      const advance = createMockMeeting({
        timeType: 'FUTURE',
        targetType: 'OPEN',
      });

      expect(isOpenBroadcast(advance)).toBe(false);
    });

    it('returns false for FUTURE + FRIEND_SPECIFIC', () => {
      const specificAdvance = createMockMeeting({
        timeType: 'FUTURE',
        targetType: 'FRIEND_SPECIFIC',
      });

      expect(isOpenBroadcast(specificAdvance)).toBe(false);
    });
  });

  /**
   * hasNewFields
   *
   * Type guard to check if a meeting has the new field system
   */
  describe('hasNewFields', () => {
    it('returns true when both timeType and targetType are set', () => {
      const newStyleMeeting = createMockMeeting({
        timeType: 'FUTURE',
        targetType: 'OPEN',
      });

      expect(hasNewFields(newStyleMeeting)).toBe(true);
    });

    it('returns false when timeType is null', () => {
      const oldStyleMeeting = createMockMeeting({
        timeType: null,
        targetType: 'OPEN',
      });

      expect(hasNewFields(oldStyleMeeting)).toBe(false);
    });

    it('returns false when targetType is null', () => {
      const partialMigration = createMockMeeting({
        timeType: 'FUTURE',
        targetType: null,
      });

      expect(hasNewFields(partialMigration)).toBe(false);
    });

    it('returns false when both are null (old-style meeting)', () => {
      const oldStyleMeeting = createMockMeeting({
        timeType: null,
        targetType: null,
      });

      expect(hasNewFields(oldStyleMeeting)).toBe(false);
    });
  });
});
