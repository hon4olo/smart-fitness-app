import { ChevronDown, Ellipsis, Timer } from 'lucide-react-native';
import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';
import { useLocalization } from '@/localization';
import { useAppTheme } from '@/theme/AppThemeProvider';
import { useUnitPreferences, weightFromKg } from '@/units';

type SessionHeaderProps = {
  elapsedLabel: string;
  finishDisabled?: boolean;
  onBack: () => void;
  onFinish: () => void;
  onOverflow: () => void;
  reps: number;
  sets: number;
  title: string;
  volume: number;
};

export const SessionHeader = memo(function SessionHeader({
  elapsedLabel,
  finishDisabled = false,
  onBack,
  onFinish,
  onOverflow,
  reps,
  sets,
  volume,
}: SessionHeaderProps) {
  const { colors } = useAppTheme();
  const { formatNumber, t } = useLocalization();
  const { weight } = useUnitPreferences();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const formattedVolume = `${formatNumber(weightFromKg(volume, weight), {
    maximumFractionDigits: 1,
  })} ${weight}`;
  const finishDisabledReason = t('workouts.session.finishRequiresCompletedSet');

  return (
    <View style={[styles.container, { paddingTop: insets.top + 4 }]}>
      <View style={[styles.topRow, { borderBottomColor: colors.borderSubtle }]}>
        <Pressable
          accessibilityLabel={t('workouts.session.backAccessibility')}
          accessibilityRole="button"
          onPress={onBack}
          style={({ pressed }) => [styles.flatIconButton, pressed && styles.pressed]}>
          <ChevronDown color={colors.textPrimary} size={24} strokeWidth={2} />
        </Pressable>
        <View
          accessibilityLabel={t('workouts.session.timerAccessibility')}
          accessibilityRole="image"
          style={styles.flatIconButton}>
          <Timer color={colors.textPrimary} size={22} strokeWidth={2} />
        </View>
        <View style={styles.topSpacer} />
        <Pressable
          accessibilityLabel={t('workouts.session.moreActions')}
          accessibilityRole="button"
          hitSlop={12}
          onPress={onOverflow}
          style={({ pressed }) => [styles.overflowButton, pressed && styles.pressed]}>
          <Ellipsis color={colors.accent} size={24} strokeWidth={2.2} />
        </Pressable>
        <Pressable
          accessibilityHint={finishDisabled ? finishDisabledReason : undefined}
          accessibilityLabel={t('workouts.session.finish')}
          accessibilityRole="button"
          accessibilityState={{ disabled: finishDisabled }}
          disabled={finishDisabled}
          onPress={onFinish}
          style={({ pressed }) => [
            styles.finishButton,
            finishDisabled && styles.finishButtonDisabled,
            pressed && !finishDisabled && styles.finishButtonPressed,
          ]}>
          <Text style={[styles.finishLabel, finishDisabled && styles.finishLabelDisabled]}>
            {t('workouts.session.finish')}
          </Text>
        </Pressable>
      </View>

      {finishDisabled ? (
        <Text accessibilityLiveRegion="polite" style={styles.finishHint}>
          {finishDisabledReason}
        </Text>
      ) : null}

      {sets > 0 ? (
        <View style={styles.statsRow}>
          <Stat
            label={t('workouts.session.sets')}
            value={formatNumber(sets, { maximumFractionDigits: 0 })}
          />
          <Stat
            label={t('workouts.session.reps')}
            value={formatNumber(reps, { maximumFractionDigits: 0 })}
          />
          <Stat label={t('workouts.session.volume')} value={formattedVolume} />
        </View>
      ) : null}

      <Text selectable style={styles.timer}>
        {elapsedLabel}
      </Text>
    </View>
  );
});

function Stat({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.stat}>
      <Text numberOfLines={1} style={styles.statLabel}>
        {label}
      </Text>
      <Text selectable numberOfLines={1} style={styles.statValue}>
        {value}
      </Text>
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    container: {
      alignSelf: 'stretch',
      backgroundColor: colors.background,
      paddingBottom: 52,
    },
    finishButton: {
      alignItems: 'center',
      backgroundColor: colors.accent,
      borderCurve: 'continuous',
      borderRadius: 16,
      flexShrink: 1,
      justifyContent: 'center',
      minHeight: 44,
      minWidth: 78,
      paddingHorizontal: Spacing.two,
      paddingVertical: Spacing.one,
    },
    finishButtonDisabled: {
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderWidth: StyleSheet.hairlineWidth,
    },
    finishButtonPressed: {
      backgroundColor: colors.accentPressed,
    },
    finishHint: {
      color: colors.textMuted,
      flexShrink: 1,
      fontSize: 12,
      lineHeight: 16,
      paddingHorizontal: Spacing.four,
      paddingTop: Spacing.two,
      textAlign: 'right',
    },
    finishLabel: {
      color: colors.textOnAccent,
      flexShrink: 1,
      fontSize: 14,
      fontWeight: '600',
      lineHeight: 18,
      textAlign: 'center',
    },
    finishLabelDisabled: {
      color: colors.textMuted,
    },
    flatIconButton: {
      alignItems: 'center',
      height: 50,
      justifyContent: 'center',
      width: 44,
    },
    overflowButton: {
      alignItems: 'center',
      flexShrink: 0,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    pressed: {
      opacity: 0.72,
    },
    stat: {
      alignItems: 'center',
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    statLabel: {
      color: colors.textMuted,
      flexShrink: 1,
      fontSize: 12,
      lineHeight: 16,
      textAlign: 'center',
    },
    statsRow: {
      flexDirection: 'row',
      paddingHorizontal: Spacing.four,
      paddingTop: Spacing.four,
    },
    statValue: {
      color: colors.textPrimary,
      flexShrink: 1,
      fontSize: 16,
      fontVariant: ['tabular-nums'],
      lineHeight: 22,
      textAlign: 'center',
    },
    timer: {
      color: colors.textPrimary,
      fontSize: 32,
      fontVariant: ['tabular-nums'],
      fontWeight: '700',
      lineHeight: 40,
      marginTop: 48,
      textAlign: 'center',
    },
    topRow: {
      alignItems: 'center',
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: Spacing.three,
      minHeight: 50,
      paddingLeft: 8,
      paddingRight: 16,
    },
    topSpacer: {
      flex: 1,
      minWidth: 0,
    },
  });