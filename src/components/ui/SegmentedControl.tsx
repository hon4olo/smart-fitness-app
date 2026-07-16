import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radii, Spacing, Typography } from '@/constants/theme';
import { useAppTheme } from '@/theme/AppThemeProvider';

type SegmentedOption<Value extends string> = {
  label: string;
  value: Value;
};

type SegmentedControlProps<Value extends string> = {
  accessibilityLabel: string;
  onChange: (value: Value) => void;
  options: readonly SegmentedOption<Value>[];
  value: Value;
};

export function SegmentedControl<Value extends string>({ accessibilityLabel, onChange, options, value }: SegmentedControlProps<Value>) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View accessibilityLabel={accessibilityLabel} accessibilityRole="tablist" style={styles.container}>
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [styles.segment, selected && styles.segmentSelected, pressed && !selected && styles.pressed]}>
            <Text style={[styles.label, selected && styles.labelSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (colors: typeof Colors.dark) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: Spacing.one,
      padding: Spacing.one,
    },
    label: {
      color: colors.textSecondary,
      fontSize: Typography.label.fontSize,
      fontWeight: Typography.label.fontWeight,
      lineHeight: Typography.label.lineHeight,
    },
    labelSelected: {
      color: colors.textPrimary,
    },
    pressed: {
      backgroundColor: colors.backgroundSelected,
    },
    segment: {
      alignItems: 'center',
      borderCurve: 'continuous',
      borderRadius: Radii.medium,
      flex: 1,
      justifyContent: 'center',
      minHeight: 44,
      paddingHorizontal: Spacing.two,
      paddingVertical: Spacing.one,
    },
    segmentSelected: {
      backgroundColor: colors.surfacePrimary,
    },
  });
