import { forwardRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';

import { Colors, Radii, Spacing, Typography } from '@/constants/theme';
import { InlineError } from './InlineError';

type FormFieldProps = TextInputProps & {
  errorMessage?: string | null;
  helperText?: string;
  label: string;
  value: string;
};

export const FormField = forwardRef<TextInput, FormFieldProps>(function FormField(
  { errorMessage, helperText, label, onBlur, onFocus, style, value, ...inputProps },
  ref
) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        ref={ref}
        accessibilityLabel={inputProps.accessibilityLabel ?? label}
        placeholderTextColor={Colors.dark.textMuted}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        style={[styles.input, focused && styles.inputFocused, errorMessage && styles.inputError, style]}
        value={value}
        {...inputProps}
      />
      {helperText ? <Text style={styles.helper}>{helperText}</Text> : null}
      <InlineError message={errorMessage} />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  helper: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
  },
  input: {
    backgroundColor: Colors.dark.surfaceSecondary,
    borderColor: Colors.dark.borderSubtle,
    borderCurve: 'continuous',
    borderRadius: Radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    color: Colors.dark.textPrimary,
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
    minHeight: 48,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  inputError: {
    borderColor: Colors.dark.error,
  },
  inputFocused: {
    backgroundColor: Colors.dark.surfacePrimary,
    borderColor: Colors.dark.accent,
  },
  label: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.label.fontSize,
    fontWeight: Typography.label.fontWeight,
    lineHeight: Typography.label.lineHeight,
  },
});
