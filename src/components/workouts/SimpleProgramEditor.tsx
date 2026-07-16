import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Colors, Radii, Spacing, Typography } from '@/constants/theme';

export type SimpleProgramWorkoutRow = {
  id: string;
  title: string;
  exerciseCount: number;
  secondary?: string;
};

type Props = {
  colors: typeof Colors.light;
  name: string;
  onNameChange: (value: string) => void;
  onAddWorkout: () => void;
  onOpenWorkout: (id: string) => void;
  onRemoveWorkout: (id: string) => void;
  workoutRows: SimpleProgramWorkoutRow[];
};

export function SimpleProgramEditor({ colors, name, onAddWorkout, onNameChange, onOpenWorkout, onRemoveWorkout, workoutRows }: Props) {
  const styles = createStyles(colors);

  return (
    <View style={styles.block}>
      <View style={styles.sectionHeader}>
        <Text selectable style={styles.sectionTitle}>
          Program
        </Text>
        <Text selectable style={styles.sectionMeta}>
          {workoutRows.length} workout{workoutRows.length === 1 ? '' : 's'}
        </Text>
      </View>

      <TextInput
        autoCapitalize="words"
        placeholder="Program name"
        placeholderTextColor={colors.textSecondary}
        selectionColor={colors.accent}
        style={styles.input}
        value={name}
        onChangeText={onNameChange}
      />

      {workoutRows.length > 0 ? (
        <View style={styles.list}>
          {workoutRows.map((row, index) => (
            <View key={row.id} style={[styles.rowWrap, index > 0 && styles.rowDivider]}>
              <Pressable accessibilityRole="button" onPress={() => onOpenWorkout(row.id)} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
                <View style={styles.rowCopy}>
                  <View style={styles.rowTitleLine}>
                    <Text numberOfLines={1} selectable style={styles.rowTitle}>
                      {row.title}
                    </Text>
                    <Text style={styles.chevron}>›</Text>
                  </View>
                  <Text selectable style={styles.rowMeta}>
                    {row.exerciseCount} exercise{row.exerciseCount === 1 ? '' : 's'}
                  </Text>
                  {row.secondary ? (
                    <Text numberOfLines={1} selectable style={styles.rowSecondary}>
                      {row.secondary}
                    </Text>
                  ) : null}
                </View>

                <Pressable accessibilityRole="button" hitSlop={10} onPress={() => onRemoveWorkout(row.id)} style={({ pressed }) => [styles.menuButton, pressed && styles.menuButtonPressed]}>
                  <Text style={styles.menuLabel}>⋯</Text>
                </Pressable>
              </Pressable>
            </View>
          ))}
        </View>
      ) : (
        <Text selectable style={styles.emptyState}>
          No workouts added yet.
        </Text>
      )}

      <Pressable accessibilityRole="button" onPress={onAddWorkout} style={({ pressed }) => [styles.addRow, pressed && styles.rowPressed]}>
        <Text style={styles.addPlus}>+</Text>
        <Text selectable style={styles.addLabel}>
          Add workout
        </Text>
      </Pressable>
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    addLabel: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '800',
    },
    addPlus: {
      color: colors.accent,
      fontSize: 22,
      fontWeight: '900',
      lineHeight: 22,
      width: 20,
    },
    addRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.two,
      minHeight: 52,
      paddingVertical: Spacing.two,
    },
    block: {
      gap: Spacing.two,
    },
    chevron: {
      color: colors.textSecondary,
      fontSize: 18,
      fontWeight: '800',
      lineHeight: 18,
      marginLeft: Spacing.one,
    },
    emptyState: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    input: {
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '700',
      minHeight: 48,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two,
    },
    list: {
      gap: 0,
    },
    menuButton: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 32,
      minWidth: 32,
    },
    menuButtonPressed: {
      opacity: 0.65,
    },
    menuLabel: {
      color: colors.textSecondary,
      fontSize: 22,
      fontWeight: '700',
      lineHeight: 22,
    },
    row: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.two,
      minHeight: 54,
      paddingVertical: Spacing.two,
    },
    rowCopy: {
      flex: 1,
      gap: 4,
    },
    rowDivider: {
      borderTopColor: colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    rowMeta: {
      color: colors.textSecondary,
      fontSize: 13,
      fontVariant: ['tabular-nums'],
    },
    rowPressed: {
      opacity: 0.72,
    },
    rowSecondary: {
      color: colors.textSecondary,
      fontSize: 12,
      lineHeight: 17,
    },
    rowTitle: {
      color: colors.textPrimary,
      flexShrink: 1,
      fontSize: 15,
      fontWeight: '800',
      lineHeight: 21,
    },
    rowTitleLine: {
      alignItems: 'center',
      flexDirection: 'row',
    },
    sectionHeader: {
      alignItems: 'baseline',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    sectionMeta: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '700',
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '900',
    },
    rowWrap: {},
  });
