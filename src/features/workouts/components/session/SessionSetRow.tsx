import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/theme/AppThemeProvider';

type SessionSetRowProps = {
  completed: boolean;
  draftValue: { reps: string; weight: string };
  index: number;
  onCommit: () => void;
  onLongPress: () => void;
  onRepsChange: (value: string) => void;
  onToggle: () => void;
  onWeightChange: (value: string) => void;
  previousLabel: string;
};

export const SessionSetRow = memo(function SessionSetRow({
  completed,
  draftValue,
  index,
  onCommit,
  onRepsChange,
  onToggle,
  onWeightChange,
  previousLabel,
}: SessionSetRowProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isDark = colors.background === Colors.dark.background;

  return (
    <View style={styles.rowWrap}>
      <View style={[styles.row, completed && (isDark ? styles.rowCompletedDark : styles.rowCompletedLight)]}>
        <Text selectable style={[styles.cell, styles.colSet]}>
          {index + 1}
        </Text>
        <Text selectable numberOfLines={1} style={[styles.cell, styles.previousCell, styles.colPrevious]}>
          {previousLabel}
        </Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          blurOnSubmit
          value={draftValue.weight}
          keyboardType="decimal-pad"
          placeholder="—"
          placeholderTextColor={colors.textSecondary}
          selectionColor={colors.accent}
          style={[styles.inputCell, completed && styles.inputCellCompleted, styles.colWeight]}
          onChangeText={onWeightChange}
          onEndEditing={onCommit}
          onSubmitEditing={onCommit}
        />
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          blurOnSubmit
          value={draftValue.reps}
          keyboardType="number-pad"
          placeholder="—"
          placeholderTextColor={colors.textSecondary}
          selectionColor={colors.accent}
          style={[styles.inputCell, completed && styles.inputCellCompleted, styles.colReps]}
          onChangeText={onRepsChange}
          onEndEditing={onCommit}
          onSubmitEditing={onCommit}
        />
        <Pressable accessibilityRole="button" onPress={onToggle} style={({ pressed }) => [styles.iconCell, styles.colCompletion, completed && (isDark ? styles.iconCellCompletedDark : styles.iconCellCompletedLight), pressed && styles.pressed]}>
          <Text style={[styles.checkLabel, completed && styles.checkLabelCompleted]}>✓</Text>
        </Pressable>
      </View>
    </View>
  );
});

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    cell: {
      color: colors.textPrimary,
      fontSize: 16,
      lineHeight: 42,
      textAlign: 'center',
    },
    checkLabel: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '900',
      lineHeight: 18,
    },
    checkLabelCompleted: {
      color: '#FFFFFF',
    },
    colCompletion: {
      width: 44,
    },
    colPrevious: {
      flex: 1,
      minWidth: 0,
      textAlign: 'left',
    },
    colReps: {
      width: 78,
    },
    colSet: {
      width: 42,
    },
    colWeight: {
      width: 78,
    },
    iconCell: {
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
      borderCurve: 'continuous',
      borderRadius: 999,
      height: 34,
      justifyContent: 'center',
    },
    iconCellCompletedDark: {
      backgroundColor: '#2ED66F',
    },
    iconCellCompletedLight: {
      backgroundColor: '#2DBA20',
    },
    inputCell: {
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: 8,
      borderWidth: StyleSheet.hairlineWidth,
      color: colors.textPrimary,
      fontSize: 16,
      height: 42,
      lineHeight: 23,
      paddingHorizontal: 4,
      textAlign: 'center',
      fontVariant: ['tabular-nums'],
    },
    inputCellCompleted: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
    },
    previousCell: {
      color: colors.textSecondary,
    },
    pressed: {
      opacity: 0.72,
    },
    row: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.one,
      minHeight: 52,
      width: '100%',
    },
    rowCompletedDark: {
      backgroundColor: '#043718',
    },
    rowCompletedLight: {
      backgroundColor: '#D7F3CE',
    },
    rowWrap: {
      marginBottom: 0,
    },
  });
