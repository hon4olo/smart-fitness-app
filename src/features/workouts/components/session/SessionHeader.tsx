import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/theme/AppThemeProvider';

type SessionHeaderProps = {
  elapsedLabel: string;
  finishDisabled?: boolean;
  onBack: () => void;
  onFinish: () => void;
  onOverflow: () => void;
};

export const SessionHeader = memo(function SessionHeader({ elapsedLabel, finishDisabled = false, onBack, onFinish, onOverflow }: SessionHeaderProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.container, { borderBottomColor: colors.borderSubtle, backgroundColor: colors.background, paddingTop: insets.top + Spacing.two }]}>
      <Pressable accessibilityRole="button" onPress={onBack} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
        <Text style={styles.iconLabel}>‹</Text>
      </Pressable>
      <Text selectable style={styles.timer}>
        {elapsedLabel}
      </Text>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" hitSlop={12} onPress={onOverflow} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          <Text style={styles.iconLabel}>⋯</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: finishDisabled }} disabled={finishDisabled} onPress={onFinish} style={({ pressed }) => [styles.finishButton, finishDisabled && styles.finishButtonDisabled, pressed && !finishDisabled && styles.finishButtonPressed]}>
          <Text style={[styles.finishLabel, finishDisabled && styles.finishLabelDisabled]}>Finish</Text>
        </Pressable>
      </View>
    </View>
  );
});

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    actions: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.one,
    },
    container: {
      alignItems: 'center',
      alignSelf: 'stretch',
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: Spacing.two,
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.two,
      paddingBottom: Spacing.two,
    },
    finishButton: {
      backgroundColor: colors.accent,
      borderCurve: 'continuous',
      borderRadius: 999,
      paddingHorizontal: Spacing.two,
      paddingVertical: 8,
    },
    finishButtonDisabled: {
      opacity: 0.4,
    },
    finishButtonPressed: {
      opacity: 0.85,
    },
    finishLabel: {
      color: colors.background,
      fontSize: 13,
      fontWeight: '900',
    },
    finishLabelDisabled: {
      color: colors.textSecondary,
    },
    iconButton: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderCurve: 'continuous',
      borderRadius: 999,
      height: 34,
      justifyContent: 'center',
      width: 34,
    },
    iconLabel: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: '700',
      lineHeight: 22,
      marginTop: -1,
    },
    pressed: {
      opacity: 0.72,
    },
    timer: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: 18,
      fontVariant: ['tabular-nums'],
      fontWeight: '900',
      letterSpacing: -0.2,
      textAlign: 'center',
    },
  });
