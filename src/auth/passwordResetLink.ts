export const PASSWORD_RESET_TOKEN_LENGTH = 43 as const;

const PASSWORD_RESET_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/u;

export type PasswordResetTokenParam = string | string[] | undefined;

export type PasswordResetTokenResolution =
  | { status: 'valid'; token: string }
  | { status: 'missing' | 'invalid'; token: '' };

export const isValidPasswordResetToken = (value: string): boolean =>
  value.length === PASSWORD_RESET_TOKEN_LENGTH &&
  PASSWORD_RESET_TOKEN_PATTERN.test(value);

export const resolvePasswordResetTokenParam = (
  value: PasswordResetTokenParam,
): PasswordResetTokenResolution => {
  if (value === undefined) return { status: 'missing', token: '' };
  if (typeof value !== 'string') return { status: 'invalid', token: '' };

  const token = value.trim();
  return isValidPasswordResetToken(token)
    ? { status: 'valid', token }
    : { status: 'invalid', token: '' };
};
