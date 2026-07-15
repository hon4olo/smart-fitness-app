import { describe, expect, it } from 'vitest';

import { buildProfileAuthViewModel, getSafeLoginErrorMessage, getSafeRegisterErrorMessage, resolveAuthGateStatus, validateLoginForm, validateRegisterForm } from '@/auth';
import type { AuthSession } from '@/auth';

const makeSession = (): AuthSession => ({
  user: {
    id: 'user-1',
    email: 'alice@example.com',
    displayName: 'Alice',
    avatarUrl: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  device: {
    id: 'device-1',
    userId: 'user-1',
    deviceName: 'iPhone 15',
    platform: 'ios',
    appVersion: '1.0.0',
    lastSeenAt: '2026-01-01T00:00:00.000Z',
  },
  session: {
    id: 'session-1',
    userId: 'user-1',
    deviceId: 'device-1',
    expiresAt: '2026-01-01T01:00:00.000Z',
    revokedAt: null,
  },
  tokens: {
    accessToken: 'access',
    refreshToken: 'refresh',
    tokenType: 'Bearer',
  },
});

describe('auth ui helpers', () => {
  it('requires an email for login', () => {
    expect(validateLoginForm({ email: '', password: 'StrongPass123!' }).email).toBe('Email is required.');
  });

  it('rejects invalid login email format', () => {
    expect(validateLoginForm({ email: 'alice', password: 'StrongPass123!' }).email).toBe('Enter a valid email address.');
  });

  it('requires a login password', () => {
    expect(validateLoginForm({ email: 'alice@example.com', password: '' }).password).toBe('Password is required.');
  });

  it('requires a minimum password length for login', () => {
    expect(validateLoginForm({ email: 'alice@example.com', password: 'short' }).password).toBe('Password must be at least 8 characters.');
  });

  it('accepts a valid login payload', () => {
    expect(validateLoginForm({ email: 'alice@example.com', password: 'StrongPass123!' })).toEqual({});
  });

  it('requires password confirmation for registration', () => {
    expect(validateRegisterForm({ email: 'alice@example.com', password: 'StrongPass123!', confirmPassword: '' }).confirmPassword).toBe('Confirm your password.');
  });

  it('rejects mismatched registration passwords', () => {
    expect(validateRegisterForm({ email: 'alice@example.com', password: 'StrongPass123!', confirmPassword: 'Different123!' }).confirmPassword).toBe('Passwords do not match.');
  });

  it('flags an overly long optional display name', () => {
    expect(validateRegisterForm({ email: 'alice@example.com', password: 'StrongPass123!', confirmPassword: 'StrongPass123!', displayName: 'x'.repeat(41) }).displayName).toBe('Display name must be 40 characters or less.');
  });

  it('accepts a valid registration payload with an optional display name', () => {
    expect(validateRegisterForm({ email: 'alice@example.com', password: 'StrongPass123!', confirmPassword: 'StrongPass123!', displayName: 'Alice' })).toEqual({});
  });

  it('shows restoring while the auth provider is bootstrapping', () => {
    expect(resolveAuthGateStatus({ ready: false, session: null, error: null })).toBe('restoring');
  });

  it('shows signed out when ready but no session exists', () => {
    expect(resolveAuthGateStatus({ ready: true, session: null, error: null })).toBe('signed_out');
  });

  it('shows signed in when a session exists', () => {
    expect(resolveAuthGateStatus({ ready: true, session: makeSession(), error: null })).toBe('signed_in');
  });

  it('shows auth error when restore fails unexpectedly', () => {
    expect(resolveAuthGateStatus({ ready: true, session: null, error: 'boom' })).toBe('auth_error');
  });

  it('builds a signed out profile view model with cloud disclosure copy', () => {
    const viewModel = buildProfileAuthViewModel({ ready: true, session: null, profile: null, error: null });

    expect(viewModel.status).toBe('signed_out');
    expect(viewModel.title).toBe('Sign in to sync');
    expect(viewModel.localDataCopy).toContain('Local data stays on this device');
    expect(viewModel.currentScopeCopy).toContain('does not sync workouts');
    expect(viewModel.primaryActionLabel).toBe('Sign in');
    expect(viewModel.secondaryActionLabel).toBe('Create account');
  });

  it('builds an authenticated profile view model with account details', () => {
    const session = makeSession();
    const viewModel = buildProfileAuthViewModel({ ready: true, session, profile: { ...session.user, displayName: 'Alice Sync' }, error: null });

    expect(viewModel.status).toBe('signed_in');
    expect(viewModel.emailLabel).toBe('alice@example.com');
    expect(viewModel.displayNameLabel).toBe('Alice Sync');
    expect(viewModel.primaryActionLabel).toBe('Refresh profile');
    expect(viewModel.secondaryActionLabel).toBe('Logout');
  });

  it('falls back to session user values when profile data is missing', () => {
    const session = makeSession();
    const viewModel = buildProfileAuthViewModel({ ready: true, session, profile: null, error: null });

    expect(viewModel.emailLabel).toBe('alice@example.com');
    expect(viewModel.displayNameLabel).toBe('Alice');
  });

  it('builds a restoring profile model', () => {
    const viewModel = buildProfileAuthViewModel({ ready: false, session: null, profile: null, error: null });

    expect(viewModel.status).toBe('restoring');
    expect(viewModel.title).toBe('Restoring account');
  });

  it('builds an auth error model with safe copy', () => {
    const viewModel = buildProfileAuthViewModel({ ready: true, session: null, profile: null, error: 'failed to restore' });

    expect(viewModel.status).toBe('auth_error');
    expect(viewModel.description).toContain('Local data stays on this device');
    expect(viewModel.primaryActionLabel).toBe('Sign in');
  });

  it('returns a generic login error message', () => {
    expect(getSafeLoginErrorMessage()).toContain('Unable to sign in');
  });

  it('returns a generic register error message', () => {
    expect(getSafeRegisterErrorMessage()).toContain('Unable to create your account');
  });
});
