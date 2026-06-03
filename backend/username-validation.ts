const USERNAME_REGEX = /^[a-zA-Z0-9_]{2,30}$/;

type UsernameValidationResult =
  | { valid: true }
  | { valid: false; error: string };

export const validateUsername = (username: unknown): UsernameValidationResult => {
  if (typeof username !== 'string' || username.trim() === '') {
    return { valid: false, error: 'Username is required' };
  }

  if (username.includes(' ')) {
    return { valid: false, error: 'Username cannot contain spaces' };
  }

  if (!USERNAME_REGEX.test(username)) {
    return {
      valid: false,
      error: 'Username must be 2–30 characters and contain only letters, numbers, and underscores',
    };
  }

  return { valid: true };
};

export const toDisplayUsername = (username: string): string => `@${username}`;
