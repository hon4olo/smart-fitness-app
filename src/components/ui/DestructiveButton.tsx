import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';

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
    backgroundColor: Colors.dark.errorSoft,
    borderColor: Colors.dark.error,
    borderCurve: 'continuous',
    borderRadius: Radii.large,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
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
    backgroundColor: Colors.dark.errorSoft,
    opacity: 0.86,
  },
});
