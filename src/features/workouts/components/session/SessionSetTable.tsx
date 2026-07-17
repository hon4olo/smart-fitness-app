import { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { WorkoutSet } from '@/context/AppContext';
import { Colors, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/theme/AppThemeProvider';

import { SessionEmptySets } from './SessionEmptySets';
import { SessionSetRow } from './SessionSetRow';
import type { SessionDraftInputs } from './types';

type SessionSetTableProps = {
  draftInputs: SessionDraftInputs;
  onCommitRowInputs: (setId: string) => void;
  onLongPressRow: (setId: string) => void;
  onRepsChange: (setId: string, value: string) => void;
  onToggleSetCompletion: (setId: string) => void;
  onWeightChange: (setId: string, value: string) => void;
  previousSet?: { reps: number; weight: number } | null;
  sets: WorkoutSet[];
};

export const SessionSetTable = memo(function SessionSetTable({
  draftInputs,
  onCommitRowInputs,
  onLongPressRow,
  onRepsChange,
  onToggleSetCompletion,
  onWeightChange,
  previousSet,
  sets,
}: SessionSetTableProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const previousLabel = previousSet ? `${previousSet.weight} × ${previousSet.reps}` : '—';

  if (sets.length === 0) {
    return <SessionEmptySets />;
  }

  return (
    <View>
      <View style={styles.tableHeader}>
        <Text style={[styles.headerText, styles.colSet]}>Set</Text>
        <Text style={[styles.headerText, styles.colPrevious]}>Previous</Text>
        <Text style={[styles.headerText, styles.colWeight]}>kg</Text>
        <Text style={[styles.headerText, styles.colReps]}>Reps</Text>
        <Text style={[styles.headerText, styles.colCheck]}>✓</Text>
      </View>

      <View style={styles.tableBody}>
        {sets.map((set, index) => (
          <SessionSetRow
            key={set.id}
            completed={set.completed !== false}
            draftValue={draftInputs[set.id] ?? { reps: `${set.reps}`, weight: `${set.weight}` }}
            index={index}
            onCommit={() => onCommitRowInputs(set.id)}
            onLongPress={() => onLongPressRow(set.id)}
            onRepsChange={(value) => onRepsChange(set.id, value)}
            onToggle={() => onToggleSetCompletion(set.id)}
            onWeightChange={(value) => onWeightChange(set.id, value)}
            previousLabel={previousLabel}
            set={set}
          />
        ))}
      </View>
    </View>
  );
});

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    colCheck: {
      width: 44,
    },
    colPrevious: {
      width: 112,
    },
    colReps: {
      width: 64,
    },
    colSet: {
      width: 40,
    },
    colWeight: {
      flex: 1,
      minWidth: 82,
    },
    headerText: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.2,
      textTransform: 'uppercase',
    },
    tableBody: {
      gap: 2,
    },
    tableHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      marginBottom: Spacing.one,
      paddingBottom: 6,
    },
  });
