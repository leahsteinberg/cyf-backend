import { describe, it, expect } from '@jest/globals';
import { validateUsername, toDisplayUsername } from '../../backend/username-validation.js';

describe('validateUsername', () => {
  describe('valid usernames', () => {
    it('accepts a plain lowercase handle', () => {
      expect(validateUsername('leah')).toEqual({ valid: true });
    });

    it('accepts a handle with underscores', () => {
      expect(validateUsername('leah_s')).toEqual({ valid: true });
    });

    it('accepts a handle with numbers', () => {
      expect(validateUsername('leah123')).toEqual({ valid: true });
    });

    it('accepts a handle with mixed case', () => {
      expect(validateUsername('LeahSteinberg')).toEqual({ valid: true });
    });

    it('accepts the minimum length of 2 characters', () => {
      expect(validateUsername('ab')).toEqual({ valid: true });
    });

    it('accepts the maximum length of 30 characters', () => {
      expect(validateUsername('a'.repeat(30))).toEqual({ valid: true });
    });
  });

  describe('invalid usernames', () => {
    it('rejects undefined', () => {
      const result = validateUsername(undefined);
      expect(result.valid).toBe(false);
      expect((result as any).error).toBeTruthy();
    });

    it('rejects an empty string', () => {
      const result = validateUsername('');
      expect(result.valid).toBe(false);
    });

    it('rejects a whitespace-only string', () => {
      const result = validateUsername('   ');
      expect(result.valid).toBe(false);
    });

    it('rejects usernames with spaces', () => {
      const result = validateUsername('leah steinberg');
      expect(result.valid).toBe(false);
      expect((result as any).error).toMatch(/space/i);
    });

    it('rejects usernames with periods', () => {
      const result = validateUsername('leah.s');
      expect(result.valid).toBe(false);
    });

    it('rejects usernames with hyphens', () => {
      const result = validateUsername('leah-s');
      expect(result.valid).toBe(false);
    });

    it('rejects usernames with @', () => {
      const result = validateUsername('@leah');
      expect(result.valid).toBe(false);
    });

    it('rejects a single character (too short)', () => {
      const result = validateUsername('a');
      expect(result.valid).toBe(false);
    });

    it('rejects a username longer than 30 characters', () => {
      const result = validateUsername('a'.repeat(31));
      expect(result.valid).toBe(false);
    });

    it('returns an error message string on failure', () => {
      const result = validateUsername('bad username!');
      expect(result.valid).toBe(false);
      expect(typeof (result as any).error).toBe('string');
    });
  });
});

describe('toDisplayUsername', () => {
  it('prepends @ to the username', () => {
    expect(toDisplayUsername('leah')).toBe('@leah');
  });

  it('works with underscores and numbers', () => {
    expect(toDisplayUsername('leah_123')).toBe('@leah_123');
  });
});
