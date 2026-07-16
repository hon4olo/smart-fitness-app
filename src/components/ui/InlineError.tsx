import { StyleSheet, Text } from 'react-native';

import { Colors, Typography } from '@/constants/theme';

type InlineErrorProps = {
  message?: string | null;
};

export function InlineError({ message }: InlineErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <Text accessibilityRole="alert" style={styles.error}>
      {message}
    </Text>
  );
}

const styles = StyleSheet.create({
  error: {
    color: Colors.dark.error,
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
  },
});
