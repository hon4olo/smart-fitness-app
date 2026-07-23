import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppCard } from '@/components/ui/AppCard';
import { Colors, MaxContentWidth, Radii, Spacing, Typography } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { useAppTheme } from '@/theme/AppThemeProvider';
import {
  buildWorkoutHistory,
  type WorkoutHistorySafetyTone,
} from '../workoutHistoryViewModel';

const getToneColor = (
  tone: WorkoutHistorySafetyTone,
  colors: typeof Colors.light,
): string => {
  if (tone === 'positive') return colors.success;
  if (tone === 'warning') return colors.warning;
  if (tone === 'critical') return colors.error;
  return colors.textMuted;
};

export default function WorkoutHistoryScreen() {
  const { workoutSessions } = useAppContext();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const history = useMemo(() => buildWorkoutHistory(workoutSessions), [workoutSessions]);
  const reviewedCount = history.filter((item) => item.hasSafetyContext).length;

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
          <Text style={styles.title}>Workout history</Text>
          <Text style={styles.subtitle}>Completed sessions and recorded pre-workout context</Text>
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
            <View style={styles.summaryRow}>
              <View style={styles.summaryCell}>
                <Text style={styles.summaryValue}>{history.length}</Text>
                <Text style={styles.summaryLabel}>Completed workouts</Text>
              </View>
              <View style={styles.summaryCell}>
                <Text style={styles.summaryValue}>{reviewedCount}</Text>
                <Text style={styles.summaryLabel}>With Safety context</Text>
              </View>
            </View>
            <Text style={styles.helperText}>
              Safety & Recovery data here is a historical record of what was displayed before each
              workout. It is not a current readiness recommendation.
            </Text>
          </AppCard>

          {history.length === 0 ? (
            <AppCard>
              <Text style={styles.cardTitle}>No completed workouts yet</Text>
              <Text style={styles.bodyText}>
                Finish and save a workout to create the first history entry.
              </Text>
            </AppCard>
          ) : (
            <View style={styles.list}>
              {history.map((item) => (
                <Pressable
                  key={item.session.id}
                  accessibilityHint="Opens the completed workout details"
                  accessibilityRole="button"
                  onPress={() =>
                    router.push({
                      pathname: '/workout-history/[sessionId]',
                      params: { sessionId: item.session.id },
                    })
                  }
                  style={({ pressed }) => [pressed && styles.pressed]}>
                  <AppCard style={styles.historyCard}>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardHeaderCopy}>
                        <Text numberOfLines={1} style={styles.cardTitle}>
                          {item.session.workoutTitle}
                        </Text>
                        <Text style={styles.metaText}>{item.dateLabel}</Text>
                      </View>
                      <Text
                        style={[
                          styles.safetyBadge,
                          { color: getToneColor(item.safetyTone, colors) },
                        ]}>
                        {item.safetyLabel}
                      </Text>
                    </View>

                    <View style={styles.metricsRow}>
                      <View style={styles.metricCell}>
                        <Text style={styles.metricValue}>{item.durationLabel}</Text>
                        <Text style={styles.metricLabel}>Duration</Text>
                      </View>
                      <View style={styles.metricCell}>
                        <Text style={styles.metricValue}>{item.setCount}</Text>
                        <Text style={styles.metricLabel}>Sets</Text>
                      </View>
                      <View style={styles.metricCell}>
                        <Text style={styles.metricValue}>{item.exerciseCount}</Text>
                        <Text style={styles.metricLabel}>Exercises</Text>
                      </View>
                      <View style={styles.metricCell}>
                        <Text style={styles.metricValue}>{item.volumeLabel}</Text>
                        <Text style={styles.metricLabel}>Volume</Text>
                      </View>
                    </View>

                    <View style={styles.openRow}>
                      <Text style={styles.openLabel}>View workout details</Text>
                      <Text style={styles.chevron}>›</Text>
                    </View>
                  </AppCard>
                </Pressable>
              ))}
            </View>
          )}
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
    cardHeader: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: Spacing.two,
      justifyContent: 'space-between',
    },
    cardHeaderCopy: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    cardTitle: {
      color: colors.textPrimary,
      fontSize: Typography.cardTitle.fontSize,
      fontWeight: Typography.cardTitle.fontWeight,
      lineHeight: Typography.cardTitle.lineHeight,
    },
    chevron: {
      color: colors.textMuted,
      fontSize: 24,
      lineHeight: 24,
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
    helperText: {
      color: colors.textMuted,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    historyCard: {
      gap: Spacing.three,
    },
    list: {
      gap: Spacing.three,
    },
    metaText: {
      color: colors.textMuted,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    metricCell: {
      flexBasis: '46%',
      gap: 2,
    },
    metricLabel: {
      color: colors.textMuted,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    metricValue: {
      color: colors.textPrimary,
      fontSize: Typography.bodyStrong.fontSize,
      fontWeight: Typography.bodyStrong.fontWeight,
      lineHeight: Typography.bodyStrong.lineHeight,
    },
    metricsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.three,
    },
    openLabel: {
      color: colors.textSecondary,
      fontSize: Typography.callout.fontSize,
      fontWeight: Typography.callout.fontWeight,
      lineHeight: Typography.callout.lineHeight,
    },
    openRow: {
      alignItems: 'center',
      borderColor: colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: Spacing.two,
    },
    pressed: {
      opacity: 0.68,
    },
    safetyBadge: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: Radii.pill,
      flexShrink: 1,
      fontSize: Typography.caption.fontSize,
      fontWeight: '800',
      overflow: 'hidden',
      paddingHorizontal: Spacing.two,
      paddingVertical: Spacing.one,
      textAlign: 'right',
    },
    screen: {
      backgroundColor: colors.background,
      flex: 1,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    summaryCell: {
      flex: 1,
      gap: 2,
    },
    summaryLabel: {
      color: colors.textMuted,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    summaryRow: {
      flexDirection: 'row',
      gap: Spacing.four,
    },
    summaryValue: {
      color: colors.textPrimary,
      fontSize: 28,
      fontWeight: '900',
      lineHeight: 34,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: '900',
      lineHeight: 30,
    },
  });
