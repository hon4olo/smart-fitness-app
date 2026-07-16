import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radii, Spacing, Typography } from '@/constants/theme';

type SegmentedOption<Value extends string> = {
  label: string;
  value: Value;
};

type SegmentedControlProps<Value extends string> = {
  accessibilityLabel: string;
  onChange: (value: Value) => void;
  options: SegmentedOption<Value>[];
  value: Value;
};

export function SegmentedControl<Value extends string>({ accessibilityLabel, onChange, options, value }: SegmentedControlProps<Value>) {
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: Radii.large,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.one,
    padding: Spacing.one,
  },
  label: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.caption.fontSize,
    fontWeight: '700',
    lineHeight: Typography.caption.lineHeight,
  },
  labelSelected: {
    color: Colors.dark.text,
  },
  pressed: {
    opacity: 0.84,
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
    backgroundColor: Colors.dark.backgroundSelected,
  },
});
