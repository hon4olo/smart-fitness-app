import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import { useWorkoutTheme } from '@/features/workouts/workoutTheme';

export type SessionEmptySetsProps = {
  label?: string;
};

export const SessionEmptySets = memo(function SessionEmptySets({ label = 'No exercises added' }: SessionEmptySetsProps) {
  const { colors } = useWorkoutTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{label}</Text>
      <Text style={styles.subtitle}>Add exercises to start logging sets.</Text>
    </View>
  );
});

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      gap: 4,
      paddingVertical: Spacing.two,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 12,
      lineHeight: 18,
      textAlign: 'center',
    },
    title: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '800',
      textAlign: 'center',
    },
  });
