import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useAppTheme } from '@/theme/AppThemeProvider';

type WorkoutSessionEmptyStateProps = {
  actionLabel: string;
  description: string;
  onAction: () => void;
  title: string;
};

export function WorkoutSessionEmptyState({ actionLabel, description, onAction, title }: WorkoutSessionEmptyStateProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <AppCard style={styles.card}>
      <View style={styles.copy}>
        <Text selectable style={styles.title}>
          {title}
        </Text>
        <Text selectable style={styles.description}>
          {description}
        </Text>
      </View>

      <Pressable accessibilityRole="button" onPress={onAction} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
        <Text style={styles.buttonLabel}>{actionLabel}</Text>
      </Pressable>
    </AppCard>
  );
}

const createStyles = (colors: typeof Colors.dark) =>
  StyleSheet.create({
    button: {
      alignItems: 'center',
      alignSelf: 'stretch',
      backgroundColor: colors.accent,
      borderCurve: 'continuous',
      borderRadius: 16,
      justifyContent: 'center',
      minHeight: 48,
      paddingHorizontal: Spacing.four,
      paddingVertical: Spacing.two,
    },
    buttonLabel: {
      color: colors.textOnAccent,
      fontSize: Typography.button.fontSize,
      fontWeight: Typography.button.fontWeight,
      lineHeight: Typography.button.lineHeight,
    },
    buttonPressed: {
      backgroundColor: colors.accentPressed,
    },
    card: {
      alignSelf: 'stretch',
      gap: Spacing.three,
      padding: Spacing.four,
    },
    copy: {
      gap: Spacing.one,
    },
    description: {
      color: colors.textSecondary,
      fontSize: Typography.callout.fontSize,
      lineHeight: Typography.callout.lineHeight,
    },
    title: {
      color: colors.textPrimary,
      fontSize: Typography.cardTitle.fontSize,
      fontWeight: '900',
      lineHeight: Typography.cardTitle.lineHeight,
    },
  });
