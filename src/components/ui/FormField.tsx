import { forwardRef } from 'react';
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
  { errorMessage, helperText, label, style, value, ...inputProps },
  ref
) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        ref={ref}
        accessibilityLabel={inputProps.accessibilityLabel ?? label}
        placeholderTextColor={Colors.dark.textMuted}
        style={[styles.input, style]}
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
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: Radii.medium,
    borderWidth: 1,
    color: Colors.dark.text,
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
    minHeight: 48,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  label: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.caption.fontSize,
    fontWeight: '700',
    lineHeight: Typography.caption.lineHeight,
  },
});
