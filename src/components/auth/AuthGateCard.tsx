import { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useAuthSession } from '@/hooks/useAuthSession';
import { AppCard } from '@/components/ui/AppCard';
import { InlineError } from '@/components/ui/InlineError';
import { LoadingState } from '@/components/ui/LoadingState';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { buildProfileAuthViewModel } from '@/auth/auth-ui';

export function AuthGateCard() {
  const router = useRouter();
  const { error, fetchProfile, logout, profile, ready, refresh, session } = useAuthSession();
  const viewModel = buildProfileAuthViewModel({ ready, session, profile, error });
  const [busyAction, setBusyAction] = useState<'refresh' | 'logout' | null>(null);

  const goToSignIn = () => router.push('/auth/sign-in');
  const goToRegister = () => router.push('/auth/register');

  const handleRefreshProfile = async () => {
    if (busyAction) {
      return;
    }

    setBusyAction('refresh');
    try {
      await refresh();
      await fetchProfile();
    } finally {
      setBusyAction(null);
    }
  };

  const handleLogout = async () => {
    if (busyAction) {
      return;
    }

    setBusyAction('logout');
    try {
      await logout();
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <AppCard>
      <Text style={styles.title}>Account</Text>
      <Text style={styles.helpText}>{resolveDescription(viewModel.status)}</Text>

      {viewModel.status === 'restoring' ? <LoadingState label="Checking your saved sign-in…" /> : null}
      {viewModel.status === 'auth_error' ? <InlineError message="We could not restore your account right now." /> : null}

      {viewModel.status === 'signed_in' ? (
        <View style={styles.metaStack}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Email</Text>
            <Text selectable style={styles.metaValue}>
              {viewModel.emailLabel}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Display name</Text>
            <Text selectable style={styles.metaValue}>
              {viewModel.displayNameLabel}
            </Text>
          </View>
          <Text style={styles.note}>Local data stays on this device. Sync and backup are limited to weight history for now.</Text>
        </View>
      ) : null}

      {viewModel.status === 'signed_in' ? (
        <>
          <PrimaryButton disabled={busyAction === 'refresh'} label={busyAction === 'refresh' ? 'Refreshing…' : 'Refresh profile'} loading={busyAction === 'refresh'} onPress={handleRefreshProfile} />
          <SecondaryButton disabled={busyAction === 'logout'} label={busyAction === 'logout' ? 'Logging out…' : 'Logout'} loading={busyAction === 'logout'} onPress={handleLogout} />
        </>
      ) : null}

      {viewModel.status !== 'signed_in' ? (
        <>
          <PrimaryButton label="Sign in" onPress={goToSignIn} />
          <SecondaryButton label="Create account" onPress={goToRegister} />
        </>
      ) : null}
    </AppCard>
  );
}

const resolveDescription = (status: string) => {
  if (status === 'restoring') {
    return 'Checking your saved sign-in before you continue.';
  }

  if (status === 'signed_in') {
    return 'Your account is ready.';
  }

  if (status === 'auth_error') {
    return 'Try signing in again or create a new account.';
  }

  return 'Sign in to keep sync and backup ready.';
};

const styles = {
  helpText: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
  },
  metaLabel: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.metricSmall.fontSize,
    fontWeight: Typography.metricSmall.fontWeight,
    lineHeight: Typography.metricSmall.lineHeight,
    textTransform: Typography.metricSmall.textTransform,
  },
  metaRow: {
    borderColor: Colors.dark.border,
    borderTopWidth: 1,
    gap: Spacing.one,
    paddingTop: Spacing.two,
  },
  metaStack: {
    gap: Spacing.one,
  },
  metaValue: {
    color: Colors.dark.text,
    fontSize: Typography.bodyStrong.fontSize,
    fontWeight: Typography.bodyStrong.fontWeight,
    lineHeight: Typography.bodyStrong.lineHeight,
  },
  note: {
    color: Colors.dark.textMuted,
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
  },
  title: {
    color: Colors.dark.text,
    fontSize: Typography.sectionTitle.fontSize,
    fontWeight: Typography.sectionTitle.fontWeight,
    letterSpacing: Typography.sectionTitle.letterSpacing,
    lineHeight: Typography.sectionTitle.lineHeight,
    textTransform: Typography.sectionTitle.textTransform,
  },
};
