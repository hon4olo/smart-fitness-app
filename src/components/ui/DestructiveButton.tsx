import { Pressable, StyleSheet, Text } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { Colors, Radii, Spacing, Typography } from '@/constants/theme';
import { resolveButtonState } from './button-state';

type DestructiveButtonProps = {
  accessibilityHint?: string;
  accessibilityLabel?: string;
  disabled?: boolean;
  label: string;
  loading?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function DestructiveButton({ accessibilityHint, accessibilityLabel, disabled, label, loading, onPress, style }: DestructiveButtonProps) {
  const state = resolveButtonState({ disabled, loading });

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={state.accessibilityState}
      disabled={state.disabled}
      onPress={state.disabled ? undefined : onPress}
      style={({ pressed }) => [styles.button, pressed && !state.disabled && styles.pressed, state.disabled && styles.disabled, style]}>
      <Text style={styles.label}>{loading ? `${label}…` : label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: '#2A1720',
    borderColor: '#4A2331',
    borderCurve: 'continuous',
    borderRadius: Radii.medium,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    color: Colors.dark.error,
    fontSize: Typography.button.fontSize,
    fontWeight: Typography.button.fontWeight,
    lineHeight: Typography.button.lineHeight,
  },
  pressed: {
    opacity: 0.84,
  },
});
