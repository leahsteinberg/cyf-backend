import { AISuggestedMeetingSchema, AISuggestionResponseSchema } from '../../backend/ai/suggestion-schema.js';
import {describe, it, expect} from '@jest/globals';

describe('AISuggestedMeetingSchema', () => {
  describe('valid suggestions', () => {
    it('accepts a valid NOW suggestion', () => {
      const validSuggestion = {
        confidence: 0.8,
        reason: 'You usually walk around this time',
        time: {
          kind: 'NOW' as const,
        },
        target: {
          kind: 'FRIEND' as const,
          friendId: 'user-123',
        },
      };

      const result = AISuggestedMeetingSchema.safeParse(validSuggestion);
      expect(result.success).toBe(true);
    });

    it('accepts a valid FUTURE suggestion with timestamps', () => {
      const validSuggestion = {
        confidence: 0.9,
        reason: 'Good time for a catch-up call',
        time: {
          kind: 'FUTURE' as const,
          startsAt: '2025-03-18T15:00:00Z',
          endsAt: '2025-03-18T15:30:00Z',
        },
        target: {
          kind: 'FRIEND' as const,
          friendId: 'user-456',
        },
        metadata: {
          signalTypesUsed: ['CALL_INTENT', 'WALK_PATTERN'],
          tags: ['walk', 'catch-up'],
        },
      };

      const result = AISuggestedMeetingSchema.safeParse(validSuggestion);
      expect(result.success).toBe(true);
    });

    it('accepts suggestion without optional metadata', () => {
      const suggestion = {
        confidence: 0.5,
        reason: 'You wanted to call them',
        time: { kind: 'NOW' as const },
        target: { kind: 'FRIEND' as const, friendId: 'abc' },
      };

      const result = AISuggestedMeetingSchema.safeParse(suggestion);
      expect(result.success).toBe(true);
    });
  });

  describe('confidence validation', () => {
    it('rejects confidence below 0', () => {
      const suggestion = {
        confidence: -0.1,
        reason: 'Test',
        time: { kind: 'NOW' as const },
        target: { kind: 'FRIEND' as const, friendId: 'abc' },
      };

      const result = AISuggestedMeetingSchema.safeParse(suggestion);
      expect(result.success).toBe(false);
    });

    it('rejects confidence above 1', () => {
      const suggestion = {
        confidence: 1.5,
        reason: 'Test',
        time: { kind: 'NOW' as const },
        target: { kind: 'FRIEND' as const, friendId: 'abc' },
      };

      const result = AISuggestedMeetingSchema.safeParse(suggestion);
      expect(result.success).toBe(false);
    });

    it('accepts edge case confidence of 0', () => {
      const suggestion = {
        confidence: 0,
        reason: 'Test',
        time: { kind: 'NOW' as const },
        target: { kind: 'FRIEND' as const, friendId: 'abc' },
      };

      const result = AISuggestedMeetingSchema.safeParse(suggestion);
      expect(result.success).toBe(true);
    });

    it('accepts edge case confidence of 1', () => {
      const suggestion = {
        confidence: 1,
        reason: 'Test',
        time: { kind: 'NOW' as const },
        target: { kind: 'FRIEND' as const, friendId: 'abc' },
      };

      const result = AISuggestedMeetingSchema.safeParse(suggestion);
      expect(result.success).toBe(true);
    });
  });

  describe('reason validation', () => {
    it('rejects reason longer than 200 characters', () => {
      const suggestion = {
        confidence: 0.5,
        reason: 'A'.repeat(201),
        time: { kind: 'NOW' as const },
        target: { kind: 'FRIEND' as const, friendId: 'abc' },
      };

      const result = AISuggestedMeetingSchema.safeParse(suggestion);
      expect(result.success).toBe(false);
    });

    it('accepts reason exactly 200 characters', () => {
      const suggestion = {
        confidence: 0.5,
        reason: 'A'.repeat(200),
        time: { kind: 'NOW' as const },
        target: { kind: 'FRIEND' as const, friendId: 'abc' },
      };

      const result = AISuggestedMeetingSchema.safeParse(suggestion);
      expect(result.success).toBe(true);
    });
  });

  describe('time validation', () => {
    it('rejects invalid time kind', () => {
      const suggestion = {
        confidence: 0.5,
        reason: 'Test',
        time: { kind: 'SOMETIME' },
        target: { kind: 'FRIEND' as const, friendId: 'abc' },
      };

      const result = AISuggestedMeetingSchema.safeParse(suggestion);
      expect(result.success).toBe(false);
    });

    it('rejects invalid datetime format', () => {
      const suggestion = {
        confidence: 0.5,
        reason: 'Test',
        time: { kind: 'FUTURE' as const, startsAt: 'not-a-date' },
        target: { kind: 'FRIEND' as const, friendId: 'abc' },
      };

      const result = AISuggestedMeetingSchema.safeParse(suggestion);
      expect(result.success).toBe(false);
    });
  });

  describe('target validation', () => {
    it('only accepts FRIEND as target kind', () => {
      const suggestion = {
        confidence: 0.5,
        reason: 'Test',
        time: { kind: 'NOW' as const },
        target: { kind: 'GROUP', friendId: 'abc' },
      };

      const result = AISuggestedMeetingSchema.safeParse(suggestion);
      expect(result.success).toBe(false);
    });

    it('requires friendId for FRIEND target', () => {
      const suggestion = {
        confidence: 0.5,
        reason: 'Test',
        time: { kind: 'NOW' as const },
        target: { kind: 'FRIEND' as const },
      };

      const result = AISuggestedMeetingSchema.safeParse(suggestion);
      expect(result.success).toBe(false);
    });
  });
});

describe('AISuggestionResponseSchema', () => {
  it('accepts valid response with multiple suggestions', () => {
    const response = {
      suggestions: [
        {
          confidence: 0.8,
          reason: 'First suggestion',
          time: { kind: 'NOW' as const },
          target: { kind: 'FRIEND' as const, friendId: 'user-1' },
        },
        {
          confidence: 0.7,
          reason: 'Second suggestion',
          time: { kind: 'FUTURE' as const, startsAt: '2025-03-18T15:00:00Z' },
          target: { kind: 'FRIEND' as const, friendId: 'user-2' },
        },
      ],
      reasoning: 'Internal notes about why these were suggested',
    };

    const result = AISuggestionResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
  });

  it('accepts empty suggestions array', () => {
    const response = {
      suggestions: [],
    };

    const result = AISuggestionResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
  });

  it('rejects more than 3 suggestions', () => {
    const response = {
      suggestions: [
        { confidence: 0.8, reason: 'One', time: { kind: 'NOW' as const }, target: { kind: 'FRIEND' as const, friendId: '1' } },
        { confidence: 0.7, reason: 'Two', time: { kind: 'NOW' as const }, target: { kind: 'FRIEND' as const, friendId: '2' } },
        { confidence: 0.6, reason: 'Three', time: { kind: 'NOW' as const }, target: { kind: 'FRIEND' as const, friendId: '3' } },
        { confidence: 0.5, reason: 'Four', time: { kind: 'NOW' as const }, target: { kind: 'FRIEND' as const, friendId: '4' } },
      ],
    };

    const result = AISuggestionResponseSchema.safeParse(response);
    expect(result.success).toBe(false);
  });

  it('accepts response without optional reasoning', () => {
    const response = {
      suggestions: [
        { confidence: 0.8, reason: 'Test', time: { kind: 'NOW' as const }, target: { kind: 'FRIEND' as const, friendId: '1' } },
      ],
    };

    const result = AISuggestionResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
  });
});
