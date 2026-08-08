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
  const visuallyDisabled = Boolean(disabled) && !state.loading;

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={state.accessibilityState}
      disabled={state.disabled}
      onPress={state.disabled ? undefined : onPress}
      style={({ pressed }) => [styles.button, pressed && !state.disabled && styles.pressed, visuallyDisabled && styles.disabled, style]}>
      <View style={styles.content}>
        {state.loading ? <ActivityIndicator color={Colors.dark.textPrimary} /> : null}
        <Text style={[styles.label, visuallyDisabled && styles.disabledLabel]}>
          {state.loading ? `${label}…` : label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: Colors.dark.surfaceSecondary,
    borderColor: Colors.dark.borderSubtle,
    borderCurve: 'continuous',
    borderRadius: Radii.large,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.one,
    justifyContent: 'center',
  },
  disabled: {
    backgroundColor: Colors.dark.backgroundSecondary,
    borderColor: Colors.dark.divider,
  },
  disabledLabel: {
    color: Colors.dark.textMuted,
  },
  label: {
    color: Colors.dark.textPrimary,
    fontSize: Typography.button.fontSize,
    fontWeight: Typography.button.fontWeight,
    lineHeight: Typography.button.lineHeight,
  },
  pressed: {
    backgroundColor: Colors.dark.backgroundSelected,
  },
});