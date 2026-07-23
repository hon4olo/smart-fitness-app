import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppCard } from '@/components/ui/AppCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Colors, MaxContentWidth, Radii, Spacing, Typography } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { useWeightSync } from '@/context/SyncContext';
import { useAppTheme } from '@/theme/AppThemeProvider';
import type { UserLimitation } from '@/types';

const formatCode = (value: string): string =>
  value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const sortLimitations = (limitations: UserLimitation[]): UserLimitation[] =>
  [...limitations].sort((left, right) => {
    if (left.status !== right.status) return left.status === 'active' ? -1 : 1;
    return right.updatedAt.localeCompare(left.updatedAt);
  });

export default function UserLimitationsListScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { isRestoringState, userLimitations } = useAppContext();
  const { error, pendingOperations, status } = useWeightSync();
  const limitations = useMemo(
    () => sortLimitations(userLimitations),
    [userLimitations],
  );
  const activeCount = limitations.filter((item) => item.status === 'active').length;
  const resolvedCount = limitations.length - activeCount;

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
          <Text style={styles.title}>Training limitations</Text>
          <Text style={styles.subtitle}>Self-reported restrictions and movement rules</Text>
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
            <Text style={styles.cardTitle}>Records</Text>
            <View style={styles.metricRow}>
              <View style={styles.metricCell}>
                <Text style={styles.metricValue}>{activeCount}</Text>
                <Text style={styles.metaText}>Active</Text>
              </View>
              <View style={styles.metricCell}>
                <Text style={styles.metricValue}>{resolvedCount}</Text>
                <Text style={styles.metaText}>Resolved</Text>
              </View>
            </View>
            <Text style={styles.metaText}>
              Sync: {status} · pending operations: {pendingOperations}
            </Text>
            {error ? <Text style={styles.warningText}>{error}</Text> : null}
            <PrimaryButton
              disabled={isRestoringState}
              label="Add limitation"
              onPress={() => router.push('/profile/limitation')}
            />
          </AppCard>

          <AppCard>
            <Text style={styles.cardTitle}>Saved limitations</Text>
            {limitations.length === 0 ? (
              <Text style={styles.bodyText}>
                No limitations have been recorded. Add one only when you want an explicit restriction
                included in deterministic readiness reviews.
              </Text>
            ) : (
              <View style={styles.list}>
                {limitations.map((limitation) => (
                  <Pressable
                    key={limitation.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Edit ${formatCode(limitation.bodyRegion)} limitation`}
                    onPress={() =>
                      router.push({
                        pathname: '/profile/limitation',
                        params: { limitationId: limitation.id },
                      })
                    }
                    style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
                    <View style={styles.rowCopy}>
                      <Text style={styles.rowTitle}>
                        {formatCode(limitation.bodyRegion)} · {formatCode(limitation.side)}
                      </Text>
                      <Text style={styles.bodyText}>
                        {formatCode(limitation.kind)} · {formatCode(limitation.trainingImpact)}
                      </Text>
                      {limitation.movementPatterns.length > 0 ? (
                        <Text numberOfLines={2} style={styles.metaText}>
                          {limitation.movementPatterns.map(formatCode).join(', ')}
                        </Text>
                      ) : null}
                    </View>
                    <View style={styles.rowMeta}>
                      <Text
                        style={[
                          styles.statusBadge,
                          limitation.status === 'active'
                            ? styles.statusActive
                            : styles.statusResolved,
                        ]}>
                        {limitation.status.toUpperCase()}
                      </Text>
                      <Text style={styles.severityLabel}>
                        {limitation.severity.toUpperCase()}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </AppCard>

          <AppCard>
            <Text style={styles.cardTitle}>Safety & Recovery</Text>
            <Text style={styles.bodyText}>
              A readiness review combines active limitations with a recent recovery check-in. Notes
              remain reference text and are not interpreted by the deterministic worker.
            </Text>
            <SecondaryButton
              label="Add recovery check-in"
              onPress={() => router.push('/profile/recovery-check-in')}
            />
            <SecondaryButton
              label="Open readiness review"
              onPress={() => router.push('/profile/safety-recovery')}
            />
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
      minWidth: 0,
    },
    list: {
      gap: Spacing.two,
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
    metricRow: {
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
    row: {
      alignItems: 'flex-start',
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.medium,
      borderWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: Spacing.two,
      padding: Spacing.two,
    },
    rowCopy: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    rowMeta: {
      alignItems: 'flex-end',
      gap: Spacing.one,
    },
    rowTitle: {
      color: colors.textPrimary,
      fontSize: Typography.bodyStrong.fontSize,
      fontWeight: Typography.bodyStrong.fontWeight,
      lineHeight: Typography.bodyStrong.lineHeight,
    },
    screen: {
      backgroundColor: colors.background,
      flex: 1,
    },
    severityLabel: {
      color: colors.textMuted,
      fontSize: Typography.caption.fontSize,
      fontWeight: '800',
    },
    statusActive: {
      color: colors.warning,
    },
    statusBadge: {
      fontSize: Typography.caption.fontSize,
      fontWeight: '800',
    },
    statusResolved: {
      color: colors.success,
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
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
  });
