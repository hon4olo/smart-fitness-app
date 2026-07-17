import { memo, useMemo } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Colors, Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/theme/AppThemeProvider';

type FinishWorkoutNotesProps = {
  notes: string;
  onChangeNotes: (value: string) => void;
};

export const FinishWorkoutNotes = memo(function FinishWorkoutNotes({ notes, onChangeNotes }: FinishWorkoutNotesProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.block}>
      <Text selectable style={styles.label}>Notes</Text>
      <TextInput
        multiline
        placeholder="Optional notes"
        placeholderTextColor={colors.textSecondary}
        selectionColor={colors.accent}
        value={notes}
        onChangeText={onChangeNotes}
        style={styles.notesInput}
      />
    </View>
  );
});

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    block: {
      gap: Spacing.two,
    },
    label: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 0.3,
      textTransform: 'uppercase',
    },
    notesInput: {
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      color: colors.textPrimary,
      fontSize: 15,
      minHeight: 96,
      paddingHorizontal: Spacing.three,
      paddingVertical: 12,
      textAlignVertical: 'top',
    },
  });
