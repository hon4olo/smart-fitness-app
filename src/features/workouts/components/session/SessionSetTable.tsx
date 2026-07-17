import { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { WorkoutSet } from '@/context/AppContext';
import { Colors } from '@/constants/theme';
import { useWorkoutTheme } from '@/features/workouts/workoutTheme';

import { SessionEmptySets } from './SessionEmptySets';
import { SessionSetRow } from './SessionSetRow';
import { SESSION_TABLE_COLUMNS } from './sessionTableLayout';
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
  const { colors } = useWorkoutTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const previousLabel = previousSet ? `${previousSet.weight} kg · ${previousSet.reps} reps` : '—';

  if (sets.length === 0) {
    return <SessionEmptySets />;
  }

  return (
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text style={[styles.headerText, styles.colSet]}>Set</Text>
        <Text style={[styles.headerText, styles.colPrevious]}>Previous</Text>
        <Text style={[styles.headerText, styles.colWeight]}>kg</Text>
        <Text style={[styles.headerText, styles.colReps]}>Reps</Text>
        <Text style={[styles.headerText, styles.colCompletion]}>✓</Text>
        <Text style={[styles.headerText, styles.colOverflow]}>⋯</Text>
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
            previousLabel={index === 0 ? previousLabel : `${sets[index - 1].weight} kg · ${sets[index - 1].reps} reps`}
          />
        ))}
      </View>
    </View>
  );
});

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    colCompletion: {
      width: SESSION_TABLE_COLUMNS.completion,
      textAlign: 'center',
    },
    colOverflow: {
      width: SESSION_TABLE_COLUMNS.overflow,
      textAlign: 'center',
    },
    colPrevious: {
      width: SESSION_TABLE_COLUMNS.previous,
    },
    colReps: {
      width: SESSION_TABLE_COLUMNS.reps,
      textAlign: 'center',
    },
    colSet: {
      width: SESSION_TABLE_COLUMNS.set,
      textAlign: 'left',
    },
    colWeight: {
      width: SESSION_TABLE_COLUMNS.weight,
      textAlign: 'center',
    },
    headerText: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.2,
      textAlign: 'left',
      textTransform: 'uppercase',
    },
    table: {
      gap: 2,
      width: '100%',
    },
    tableBody: {
      gap: 2,
    },
    tableHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      marginBottom: 6,
      paddingBottom: 4,
    },
  });
