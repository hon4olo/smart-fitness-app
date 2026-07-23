import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppCard } from '@/components/ui/AppCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Colors, MaxContentWidth, Radii, Spacing, Typography } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { useWeightSync } from '@/context/SyncContext';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useAppTheme } from '@/theme/AppThemeProvider';
import { buildSafetyRecoveryLocalSummary } from '../safetyRecoveryLocalSummary';

const formatTimestamp = (value: string | null): string => {
  if (!value) return 'Not available';
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return 'Not available';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
};

const getReadinessCopy = (
  readiness: ReturnType<typeof buildSafetyRecoveryLocalSummary>['readiness'],
): { title: string; message: string } => {
  if (readiness === 'missing_check_in') {
    return {
      title: 'Recovery check-in required',
      message: 'Add at least two explicit recovery signals before requesting a readiness review.',
    };
  }
  if (readiness === 'stale_check_in') {
    return {
      title: 'Recovery check-in is stale',
      message: 'The latest check-in is older than 72 hours. Add a current check-in before reviewing.',
    };
  }
  if (readiness === 'insufficient_signals') {
    return {
      title: 'More recovery signals required',
      message: 'The latest local check-in has fewer than two usable signals.',
    };
  }
  return {
    title: 'Local data is ready',
    message: 'The latest check-in is recent and contains enough explicit recovery signals.',
  };
};

export default function SafetyRecoveryPreflightScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { ready, session } = useAuthSession();
  const app = useAppContext();
  const {
    conflictCount,
    error,
    pendingOperations,
    status,
    syncNow,
  } = useWeightSync();
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const summary = useMemo(
    () =>
      buildSafetyRecoveryLocalSummary({
        recoveryCheckIns: app.recoveryCheckIns,
        userLimitations: app.userLimitations,
      }),
    [app.recoveryCheckIns, app.userLimitations],
  );
  const copy = getReadinessCopy(summary.readiness);
  const isAuthenticated = Boolean(session?.tokens.accessToken);
  const syncBlocked =
    pendingOperations > 0 ||
    conflictCount > 0 ||
    status === 'syncing' ||
    status === 'offline' ||
    status === 'conflict' ||
    status === 'error';
  const reviewEnabled =
    ready &&
    !app.isRestoringState &&
    isAuthenticated &&
    summary.reviewReady &&
    !syncBlocked;

  const synchronize = async () => {
    if (syncing || !isAuthenticated) return;
    setSyncing(true);
    setSyncMessage(null);
    await syncNow();
    setSyncing(false);
    setSyncMessage('Synchronization attempt completed. Review the status below.');
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable
          accessibilityLabel="Back"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Text style={styles.backLabel}>‹</Text>
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Safety & Recovery</Text>
          <Text style={styles.subtitle}>Prepare synchronized data before review</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.eight },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <AppCard>
            <View style={styles.statusHeader}>
              <View style={styles.headerCopy}>
                <Text style={styles.cardTitle}>{copy.title}</Text>
                <Text style={styles.bodyText}>{copy.message}</Text>
              </View>
              <Text
                style={[
                  styles.readinessBadge,
                  summary.reviewReady ? styles.readyBadge : styles.inputBadge,
                ]}>
                {summary.reviewReady ? 'READY' : 'INPUT'}
              </Text>
            </View>

            <View style={styles.metricGrid}>
              <View style={styles.metricCell}>
                <Text style={styles.metricValue}>{summary.latestSignalCount}</Text>
                <Text style={styles.metaText}>Latest signals</Text>
              </View>
              <View style={styles.metricCell}>
                <Text style={styles.metricValue}>{summary.activeLimitationCount}</Text>
                <Text style={styles.metaText}>Active limitations</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.metaText}>Latest check-in</Text>
              <Text style={styles.infoValue}>{formatTimestamp(summary.latestCheckInAt)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.metaText}>Check-in age</Text>
              <Text style={styles.infoValue}>
                {summary.latestCheckInAgeHours === null
                  ? '—'
                  : `${summary.latestCheckInAgeHours} hours`}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.metaText}>Resolved limitations</Text>
              <Text style={styles.infoValue}>{summary.resolvedLimitationCount}</Text>
            </View>

            <PrimaryButton
              label={summary.reviewReady ? 'Add another recovery check-in' : 'Add recovery check-in'}
              onPress={() => router.push('/profile/recovery-check-in')}
            />
            <SecondaryButton
              label="Manage training limitations"
              onPress={() => router.push('/profile/limitations')}
            />
          </AppCard>

          <AppCard>
            <Text style={styles.cardTitle}>Synchronization gate</Text>
            <Text style={styles.bodyText}>
              The backend review reads synchronized records, not unsent local changes. Pending or
              conflicted records must be resolved before the review starts.
            </Text>

            <View style={styles.infoRow}>
              <Text style={styles.metaText}>Account</Text>
              <Text style={styles.infoValue}>{isAuthenticated ? 'Signed in' : 'Sign in required'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.metaText}>Sync status</Text>
              <Text style={styles.infoValue}>{status}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.metaText}>Pending operations</Text>
              <Text style={styles.infoValue}>{pendingOperations}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.metaText}>Conflicts</Text>
              <Text style={styles.infoValue}>{conflictCount}</Text>
            </View>

            {error ? <Text style={styles.warningText}>{error}</Text> : null}
            {syncMessage ? <Text style={styles.metaText}>{syncMessage}</Text> : null}

            {!isAuthenticated ? (
              <PrimaryButton label="Sign in" onPress={() => router.push('/auth/sign-in')} />
            ) : (
              <SecondaryButton
                disabled={syncing || status === 'syncing'}
                label="Synchronize records"
                loading={syncing || status === 'syncing'}
                onPress={() => void synchronize()}
              />
            )}
          </AppCard>

          <AppCard>
            <Text style={styles.cardTitle}>Deterministic readiness review</Text>
            <Text style={styles.bodyText}>
              The review can recommend normal training, modification, more input, or a block. It never
              diagnoses a condition or applies workout changes automatically.
            </Text>
            <PrimaryButton
              disabled={!reviewEnabled}
              label="Continue to readiness review"
              onPress={() => router.push('/profile/safety-recovery/review')}
            />
            {!reviewEnabled ? (
              <Text style={styles.metaText}>
                Complete the local data and synchronization requirements above to continue.
              </Text>
            ) : null}
          </AppCard>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    backButton: {
      alignItems: 'center',
      height: 42,
      justifyContent: 'center',
      width: 42,
    },
    backLabel: {
      color: colors.textPrimary,
      fontSize: 42,
      fontWeight: '300',
      lineHeight: 42,
    },
    bodyText: {
      color: colors.textSecondary,
      fontSize: Typography.body.fontSize,
      lineHeight: Typography.body.lineHeight,
    },
    cardTitle: {
      color: colors.textPrimary,
      fontSize: Typography.cardTitle.fontSize,
      fontWeight: Typography.cardTitle.fontWeight,
      lineHeight: Typography.cardTitle.lineHeight,
    },
    container: {
      gap: Spacing.four,
      maxWidth: MaxContentWidth,
      width: '100%',
    },
    content: {
      alignItems: 'center',
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.three,
    },
    header: {
      alignItems: 'center',
      backgroundColor: colors.background,
      flexDirection: 'row',
      gap: Spacing.one,
      paddingBottom: Spacing.two,
      paddingHorizontal: Spacing.two,
    },
    headerCopy: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    infoRow: {
      alignItems: 'flex-start',
      borderColor: colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: Spacing.three,
      justifyContent: 'space-between',
      paddingTop: Spacing.two,
    },
    infoValue: {
      color: colors.textPrimary,
      flexShrink: 1,
      fontSize: Typography.callout.fontSize,
      fontWeight: Typography.callout.fontWeight,
      lineHeight: Typography.callout.lineHeight,
      textAlign: 'right',
      textTransform: 'capitalize',
    },
    inputBadge: {
      backgroundColor: colors.warningSoft,
      color: colors.warning,
    },
    metaText: {
      color: colors.textMuted,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    metricCell: {
      flex: 1,
      gap: 2,
    },
    metricGrid: {
      flexDirection: 'row',
      gap: Spacing.four,
    },
    metricValue: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: '800',
      lineHeight: 28,
    },
    pressed: {
      opacity: 0.65,
    },
    readinessBadge: {
      borderCurve: 'continuous',
      borderRadius: Radii.pill,
      fontSize: Typography.caption.fontSize,
      fontWeight: '800',
      overflow: 'hidden',
      paddingHorizontal: Spacing.two,
      paddingVertical: Spacing.one,
    },
    readyBadge: {
      backgroundColor: colors.successSoft,
      color: colors.success,
    },
    screen: {
      backgroundColor: colors.background,
      flex: 1,
    },
    statusHeader: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: Spacing.two,
      justifyContent: 'space-between',
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: '900',
      lineHeight: 30,
    },
    warningText: {
      color: colors.warning,
      fontSize: Typography.callout.fontSize,
      lineHeight: Typography.callout.lineHeight,
    },
  });
