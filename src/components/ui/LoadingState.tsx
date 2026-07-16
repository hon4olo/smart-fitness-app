import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing, Typography } from '@/constants/theme';

type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = 'Loading…' }: LoadingStateProps) {
  return (
    <View accessibilityRole="progressbar" style={styles.container}>
      <ActivityIndicator color={Colors.dark.accent} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
  },
  label: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.callout.fontSize,
    lineHeight: Typography.callout.lineHeight,
  },
});
