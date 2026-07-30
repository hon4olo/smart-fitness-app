import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Radii, Spacing, Typography } from '@/constants/theme';
import { useLocalization } from '@/localization';
import { getRecoveryCheckInCopy } from '@/localization/recoveryCheckInCopy';
import { useAppTheme } from '@/theme/AppThemeProvider';

export function RecoveryScorePicker<T extends number>({
  helperText,
  label,
  onChange,
  options,
  value,
}: {
  helperText: string;
  label: string;
  onChange(value: T | null): void;
  options: readonly T[];
  value: T | null;
}) {
  const { colors } = useAppTheme();
  const { locale } = useLocalization();
  const copy = getRecoveryCheckInCopy(locale);

  return (
    <View style={styles.fieldGroup}>
      <View style={styles.fieldHeader}>
        <View style={styles.fieldCopy}>
          <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>{label}</Text>
          <Text style={[styles.helperText, { color: colors.textMuted }]}>{helperText}</Text>
        </View>
        <Pressable
          accessibilityLabel={copy.clearField(label)}
          accessibilityRole="button"
          disabled={value === null}
          onPress={() => onChange(null)}>
          <Text
            style={[
              styles.clearLabel,
              { color: value === null ? colors.textMuted : colors.accent },
            ]}>
            {copy.clear}
          </Text>
        </Pressable>
      </View>
      <View style={styles.scoreRow}>
        {options.map((option) => {
          const selected = option === value;
          return (
            <Pressable
              key={option}
              accessibilityLabel={copy.scoreAccessibility(label, option)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => onChange(option)}
              style={({ pressed }) => [
                styles.scoreButton,
                {
                  backgroundColor: selected ? colors.accentSoft : colors.surfaceElevated,
                  borderColor: selected ? colors.accent : colors.borderSubtle,
                },
                pressed && styles.pressed,
              ]}>
              <Text
                style={[
                  styles.scoreButtonLabel,
                  { color: selected ? colors.accent : colors.textPrimary },
                ]}>
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  clearLabel: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '700',
  },
  fieldCopy: {
    flex: 1,
    minWidth: 0,
  },
  fieldGroup: {
    gap: Spacing.one,
  },
  fieldHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  fieldLabel: {
    fontSize: Typography.label.fontSize,
    fontWeight: Typography.label.fontWeight,
    lineHeight: Typography.label.lineHeight,
  },
  helperText: {
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
  },
  pressed: {
    opacity: 0.68,
  },
  scoreButton: {
    alignItems: 'center',
    borderRadius: Radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
  },
  scoreButtonLabel: {
    fontSize: Typography.bodyStrong.fontSize,
    fontWeight: '800',
    lineHeight: Typography.bodyStrong.lineHeight,
  },
  scoreRow: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
});
