import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppCard } from '@/components/ui/AppCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Colors, MaxContentWidth, Radii, Spacing, Typography } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { useWeightSync } from '@/context/SyncContext';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useLocalization } from '@/localization';
import { getSafetyRecoveryPreflightCopy } from '@/localization/safetyRecoveryPreflightCopy';
import { useAppTheme } from '@/theme/AppThemeProvider';
import { buildSafetyRecoveryLocalSummary } from '../safetyRecoveryLocalSummary';

export default function SafetyRecoveryPreflightScreen() {
  const { colors } = useAppTheme();
  const { formatDate, formatNumber, locale } = useLocalization();
  const copy = getSafetyRecoveryPreflightCopy(locale);
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
  const readinessCopy = copy.readiness[summary.readiness] ?? copy.readiness.ready;
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
  const syncStatusLabel = copy.syncLabel(String(status));
  const formatTimestamp = (value: string | null) => {
    if (!value) return copy.notAvailable;
    const parsed = new Date(value);
    if (!Number.isFinite(parsed.getTime())) return copy.notAvailable;
    return formatDate(parsed, { dateStyle: 'medium', timeStyle: 'short' });
  };

  const synchronize = async () => {
    if (syncing || !isAuthenticated) return;
    setSyncing(true);
    setSyncMessage(null);
    try {
      await syncNow();
      setSyncMessage(copy.syncAttemptCompleted);
    } catch {
      setSyncMessage(copy.syncAttemptFailed);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable
          accessibilityLabel={copy.back}
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Text style={styles.backLabel}>‹</Text>
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.subtitle}>{copy.subtitle}</Text>
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
                <Text style={styles.cardTitle}>{readinessCopy.title}</Text>
                <Text style={styles.bodyText}>{readinessCopy.message}</Text>
              </View>
              <Text
                style={[
                  styles.readinessBadge,
                  summary.reviewReady ? styles.readyBadge : styles.inputBadge,
                ]}>
                {summary.reviewReady ? copy.readyBadge : copy.inputBadge}
              </Text>
            </View>

            <View style={styles.metricGrid}>
              <View style={styles.metricCell}>
                <Text style={styles.metricValue}>
                  {formatNumber(summary.latestSignalCount, { maximumFractionDigits: 0 })}
                </Text>
                <Text style={styles.metaText}>{copy.latestSignals}</Text>
              </View>
              <View style={styles.metricCell}>
                <Text style={styles.metricValue}>
                  {formatNumber(summary.activeLimitationCount, { maximumFractionDigits: 0 })}
                </Text>
                <Text style={styles.metaText}>{copy.activeLimitations}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.metaText}>{copy.latestCheckIn}</Text>
              <Text style={styles.infoValue}>{formatTimestamp(summary.latestCheckInAt)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.metaText}>{copy.checkInAge}</Text>
              <Text style={styles.infoValue}>
                {summary.latestCheckInAgeHours === null
                  ? '—'
                  : copy.hours(
                      summary.latestCheckInAgeHours,
                      formatNumber(summary.latestCheckInAgeHours, { maximumFractionDigits: 0 }),
                    )}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.metaText}>{copy.resolvedLimitations}</Text>
              <Text style={styles.infoValue}>
                {formatNumber(summary.resolvedLimitationCount, { maximumFractionDigits: 0 })}
              </Text>
            </View>

            <PrimaryButton
              label={summary.reviewReady ? copy.addAnotherCheckIn : copy.addCheckIn}
              onPress={() => router.push('/profile/recovery-check-in')}
            />
            <SecondaryButton
              label={copy.manageLimitations}
              onPress={() => router.push('/profile/limitations')}
            />
          </AppCard>

          <AppCard>
            <Text style={styles.cardTitle}>{copy.syncGate}</Text>
            <Text style={styles.bodyText}>{copy.syncGateBody}</Text>

            <View style={styles.infoRow}>
              <Text style={styles.metaText}>{copy.account}</Text>
              <Text style={styles.infoValue}>
                {isAuthenticated ? copy.signedIn : copy.signInRequired}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.metaText}>{copy.syncStatus}</Text>
              <Text style={styles.infoValue}>{syncStatusLabel}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.metaText}>{copy.pendingOperations}</Text>
              <Text style={styles.infoValue}>
                {formatNumber(pendingOperations, { maximumFractionDigits: 0 })}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.metaText}>{copy.conflicts}</Text>
              <Text style={styles.infoValue}>
                {formatNumber(conflictCount, { maximumFractionDigits: 0 })}
              </Text>
            </View>

            {error ? <Text style={styles.warningText}>{copy.syncIssue}</Text> : null}
            {syncMessage ? <Text style={styles.metaText}>{syncMessage}</Text> : null}

            {!isAuthenticated ? (
              <PrimaryButton label={copy.signIn} onPress={() => router.push('/auth/sign-in')} />
            ) : (
              <SecondaryButton
                disabled={syncing || status === 'syncing'}
                label={copy.synchronize}
                loading={syncing || status === 'syncing'}
                onPress={() => void synchronize()}
              />
            )}
          </AppCard>

          <AppCard>
            <Text style={styles.cardTitle}>{copy.reviewTitle}</Text>
            <Text style={styles.bodyText}>{copy.reviewBody}</Text>
            <PrimaryButton
              disabled={!reviewEnabled}
              label={copy.continueReview}
              onPress={() => router.push('/profile/safety-recovery/review')}
            />
            {!reviewEnabled ? (
              <Text style={styles.metaText}>{copy.requirementsHint}</Text>
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
