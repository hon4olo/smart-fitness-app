import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useAuthSession } from '@/hooks/useAuthSession';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing } from '@/constants/theme';
import { buildProfileAuthViewModel } from '@/auth/auth-ui';

export function AuthGateCard() {
  const router = useRouter();
  const { error, fetchProfile, logout, profile, ready, refresh, session, status } = useAuthSession();
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

  if (viewModel.status === 'restoring') {
    return (
      <AppCard>
        <Text style={styles.title}>{viewModel.title}</Text>
        <Text style={styles.helpText}>{viewModel.description}</Text>
        <View style={styles.loadingRow}>
          <ActivityIndicator color={Colors.dark.accent} />
          <Text style={styles.loadingText}>Checking session…</Text>
        </View>
      </AppCard>
    );
  }

  if (viewModel.status === 'signed_in') {
    return (
      <AppCard>
        <Text style={styles.title}>{viewModel.title}</Text>
        <Text style={styles.helpText}>{viewModel.description}</Text>

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

        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>{viewModel.localDataCopy}</Text>
          <Text style={styles.noticeText}>{viewModel.accountAccessCopy}</Text>
          <Text style={styles.noticeText}>{viewModel.currentScopeCopy}</Text>
        </View>

        <AppButton
          disabled={busyAction === 'refresh'}
          label={busyAction === 'refresh' ? 'Refreshing…' : 'Refresh profile'}
          onPress={handleRefreshProfile}
        />
        <AppButton
          disabled={busyAction === 'logout'}
          label={busyAction === 'logout' ? 'Logging out…' : 'Logout'}
          onPress={handleLogout}
          variant="secondary"
        />
      </AppCard>
    );
  }

  return (
    <AppCard>
      <Text style={styles.title}>{viewModel.title}</Text>
      <Text style={styles.helpText}>{viewModel.description}</Text>
      {status === 'auth_error' && error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.noticeBox}>
        <Text style={styles.noticeText}>{viewModel.localDataCopy}</Text>
        <Text style={styles.noticeText}>{viewModel.accountAccessCopy}</Text>
        <Text style={styles.noticeText}>{viewModel.currentScopeCopy}</Text>
      </View>

      <AppButton label={viewModel.primaryActionLabel ?? 'Sign in'} onPress={goToSignIn} />
      <AppButton label={viewModel.secondaryActionLabel ?? 'Create account'} onPress={goToRegister} variant="secondary" />
    </AppCard>
  );
}

const styles = {
  errorText: {
    color: '#FF9CA5',
    fontSize: 13,
    lineHeight: 18,
  },
  helpText: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  loadingRow: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    gap: Spacing.two,
  },
  loadingText: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
  },
  metaLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
  },
  metaRow: {
    borderColor: Colors.dark.border,
    borderTopWidth: 1,
    gap: Spacing.half,
    paddingTop: Spacing.two,
  },
  metaValue: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '700' as const,
  },
  noticeBox: {
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous' as const,
    borderRadius: 10,
    borderWidth: 1,
    gap: Spacing.one,
    padding: Spacing.two,
  },
  noticeText: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '800' as const,
  },
};
