import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { Colors, Radii, Spacing, Typography } from '@/constants/theme';
import { resolveButtonState } from './button-state';

type SecondaryButtonProps = {
  accessibilityHint?: string;
  accessibilityLabel?: string;
  disabled?: boolean;
  label: string;
  loading?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function SecondaryButton({ accessibilityHint, accessibilityLabel, disabled, label, loading, onPress, style }: SecondaryButtonProps) {
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
      <View style={styles.content}>
        {state.loading ? <ActivityIndicator color={Colors.dark.text} /> : null}
        <Text style={styles.label}>{state.loading ? `${label}…` : label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: Colors.dark.backgroundSelected,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: Radii.large,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.one,
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    color: Colors.dark.text,
    fontSize: Typography.button.fontSize,
    fontWeight: Typography.button.fontWeight,
    lineHeight: Typography.button.lineHeight,
  },
  pressed: {
    opacity: 0.84,
  },
});
