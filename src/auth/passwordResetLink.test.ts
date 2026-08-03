import { describe, expect, it } from 'vitest';

import {
  PASSWORD_RESET_TOKEN_LENGTH,
  isValidPasswordResetToken,
  resolvePasswordResetTokenParam,
} from './passwordResetLink';

const validToken = 'A'.repeat(PASSWORD_RESET_TOKEN_LENGTH);

describe('password reset link token handling', () => {
  it('accepts one exact URL-safe backend token', () => {
    expect(resolvePasswordResetTokenParam(`  ${validToken}  `)).toEqual({
      status: 'valid',
      token: validToken,
    });
    expect(isValidPasswordResetToken(`aB0_-`.padEnd(43, 'x'))).toBe(true);
  });

  it('distinguishes missing links from invalid links', () => {
    expect(resolvePasswordResetTokenParam(undefined)).toEqual({
      status: 'missing',
      token: '',
    });
    expect(resolvePasswordResetTokenParam('short')).toEqual({
      status: 'invalid',
      token: '',
    });
  });

  it('rejects duplicate query parameters instead of selecting one value', () => {
    expect(resolvePasswordResetTokenParam([validToken])).toEqual({
      status: 'invalid',
      token: '',
    });
    expect(resolvePasswordResetTokenParam([validToken, validToken])).toEqual({
      status: 'invalid',
      token: '',
    });
  });

  it.each([
    'A'.repeat(42),
    'A'.repeat(44),
    `${'A'.repeat(42)}=`,
    `${'A'.repeat(42)}+`,
    `${'A'.repeat(42)}/`,
    `${'A'.repeat(42)}.`,
    `${'A'.repeat(20)} ${'A'.repeat(22)}`,
  ])('rejects malformed token material without normalization: %s', (value) => {
    expect(isValidPasswordResetToken(value)).toBe(false);
  });
});
