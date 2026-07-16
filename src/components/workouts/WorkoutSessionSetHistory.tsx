import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Radii, Spacing, Typography } from '@/constants/theme';
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
      <View style={styles.container}>
        <Text selectable style={styles.sectionLabel}>
          Sets
        </Text>
        <Text selectable style={styles.emptyText}>
          No sets logged yet.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text selectable style={styles.sectionLabel}>
        Sets
      </Text>
      <View style={styles.surface}>
        {sets.map((set, index) => (
          <View key={set.id} style={[styles.row, index > 0 && styles.rowDivider]}>
            <Text selectable style={styles.setNumber}>
              {String(index + 1).padStart(2, '0')}
            </Text>

            <View style={styles.valueBlock}>
              <Text selectable style={styles.setValue}>
                {formatSetValue(set)}
              </Text>
              <Text selectable style={styles.setName} numberOfLines={1}>
                {set.exerciseName}
              </Text>
            </View>

            <View style={styles.actions}>
              <Pressable accessibilityLabel={`Edit set ${index + 1}`} accessibilityRole="button" onPress={() => onEditSet(set)} style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}>
                <Text style={styles.actionLabel}>Edit</Text>
              </Pressable>
              <Pressable accessibilityLabel={`Delete set ${index + 1}`} accessibilityRole="button" onPress={() => onDeleteSet(set)} style={({ pressed }) => [styles.actionButton, styles.deleteButton, pressed && styles.actionPressed]}>
                <Text style={styles.deleteLabel}>Delete</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const createStyles = (colors: typeof import('@/constants/theme').Colors.dark) =>
  StyleSheet.create({
    actionButton: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderCurve: 'continuous',
      borderRadius: Radii.pill,
      justifyContent: 'center',
      minHeight: 44,
      minWidth: 58,
      paddingHorizontal: Spacing.two,
      paddingVertical: Spacing.one,
    },
    actionLabel: {
      color: colors.textPrimary,
      fontSize: Typography.caption.fontSize,
      fontWeight: Typography.button.fontWeight,
      lineHeight: Typography.caption.lineHeight,
    },
    actionPressed: {
      opacity: 0.85,
    },
    actions: {
      flexDirection: 'row',
      flexShrink: 0,
      gap: Spacing.one,
    },
    container: {
      gap: Spacing.two,
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
      paddingHorizontal: Spacing.three,
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
      color: colors.textSecondary,
      fontSize: Typography.callout.fontSize,
      lineHeight: Typography.callout.lineHeight,
    },
    setNumber: {
      color: colors.accent,
      fontSize: Typography.bodyEmphasized.fontSize,
      fontWeight: '900',
      fontVariant: ['tabular-nums'],
      lineHeight: Typography.bodyEmphasized.lineHeight,
      textAlign: 'center',
      width: 28,
    },
    setValue: {
      color: colors.textPrimary,
      fontSize: Typography.bodyEmphasized.fontSize,
      fontWeight: '800',
      fontVariant: ['tabular-nums'],
      lineHeight: Typography.bodyEmphasized.lineHeight,
    },
    surface: {
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      overflow: 'hidden',
    },
    valueBlock: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
  });
