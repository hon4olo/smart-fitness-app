import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radii, Spacing, Typography } from '@/constants/theme';
import type { WorkoutSet } from '@/context/AppContext';
import { useAppTheme } from '@/theme/AppThemeProvider';

type WorkoutSessionSetHistoryProps = {
  onDeleteSet: (set: WorkoutSet) => void;
  onEditSet: (set: WorkoutSet) => void;
  sets: WorkoutSet[];
};

const formatSetValue = (set: WorkoutSet) => `${set.weight} kg × ${set.reps}`;

export function WorkoutSessionSetHistory({ onDeleteSet, onEditSet, sets }: WorkoutSessionSetHistoryProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (sets.length === 0) {
    return (
      <Text selectable style={styles.emptyText}>
        No sets logged yet.
      </Text>
    );
  }

  return (
    <View style={styles.container}>
      <Text selectable style={styles.sectionLabel}>
        Added sets
      </Text>
      <View style={styles.surface}>
        {sets.map((set, index) => (
          <View key={set.id} style={[styles.row, index > 0 && styles.rowDivider]}>
            <View style={styles.copy}>
              <Text numberOfLines={1} selectable style={styles.setName}>
                {index + 1} {set.exerciseName}
              </Text>
              <Text selectable style={styles.setValue}>
                {formatSetValue(set)}
              </Text>
            </View>

            <View style={styles.actions}>
              <Pressable accessibilityLabel={`Edit set ${index + 1}`} accessibilityRole="button" onPress={() => onEditSet(set)} style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}>
                <Text style={styles.actionLabel}>Edit</Text>
              </Pressable>
              <Pressable accessibilityLabel={`Delete set ${index + 1}`} accessibilityRole="button" onPress={() => onDeleteSet(set)} style={({ pressed }) => [styles.actionButton, styles.deleteButton, pressed && styles.actionButtonPressed]}>
                <Text style={styles.deleteLabel}>Delete</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const createStyles = (colors: typeof Colors.dark) =>
  StyleSheet.create({
    actionButton: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderCurve: 'continuous',
      borderRadius: Radii.pill,
      justifyContent: 'center',
      minHeight: 44,
      paddingHorizontal: Spacing.two,
      paddingVertical: Spacing.one,
    },
    actionButtonPressed: {
      opacity: 0.85,
    },
    actionLabel: {
      color: colors.textPrimary,
      fontSize: Typography.caption.fontSize,
      fontWeight: Typography.button.fontWeight,
      lineHeight: Typography.caption.lineHeight,
    },
    actions: {
      flexDirection: 'row',
      gap: Spacing.one,
      flexShrink: 0,
    },
    container: {
      gap: Spacing.two,
    },
    copy: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    deleteButton: {
      backgroundColor: colors.errorSoft,
    },
    deleteLabel: {
      color: colors.error,
      fontSize: Typography.caption.fontSize,
      fontWeight: Typography.button.fontWeight,
      lineHeight: Typography.caption.lineHeight,
    },
    emptyText: {
      color: colors.textSecondary,
      fontSize: Typography.callout.fontSize,
      lineHeight: Typography.callout.lineHeight,
    },
    row: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.two,
      justifyContent: 'space-between',
      minHeight: 52,
      paddingHorizontal: Spacing.four,
      paddingVertical: Spacing.two,
    },
    rowDivider: {
      borderTopColor: colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    sectionLabel: {
      color: colors.textSecondary,
      fontSize: Typography.sectionTitle.fontSize,
      fontWeight: Typography.sectionTitle.fontWeight,
      letterSpacing: Typography.sectionTitle.letterSpacing,
      textTransform: Typography.sectionTitle.textTransform,
    },
    setName: {
      color: colors.textPrimary,
      fontSize: Typography.bodyEmphasized.fontSize,
      fontWeight: Typography.bodyEmphasized.fontWeight,
      lineHeight: Typography.bodyEmphasized.lineHeight,
    },
    setValue: {
      color: colors.textSecondary,
      fontSize: Typography.callout.fontSize,
      fontVariant: ['tabular-nums'],
      lineHeight: Typography.callout.lineHeight,
    },
    surface: {
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      overflow: 'hidden',
    },
  });
