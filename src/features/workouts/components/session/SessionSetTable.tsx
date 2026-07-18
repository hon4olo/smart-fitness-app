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
  previousSets?: Array<{ reps: number; weight: number }>;
  sets: WorkoutSet[];
};

export const SessionSetTable = memo(function SessionSetTable({
  draftInputs,
  onCommitRowInputs,
  onLongPressRow,
  onRepsChange,
  onToggleSetCompletion,
  onWeightChange,
  previousSets = [],
  sets,
}: SessionSetTableProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
            previousLabel={previousSets[index] ? `${previousSets[index].weight} kg · ${previousSets[index].reps} reps` : '—'}
          />
        ))}
      </View>
    </View>
  );
});

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    colCompletion: {
      textAlign: 'center',
      width: 42,
    },
    colPrevious: {
      flex: 1,
      minWidth: 0,
    },
    colReps: {
      textAlign: 'center',
      width: 66,
    },
    colSet: {
      textAlign: 'center',
      width: 42,
    },
    colWeight: {
      textAlign: 'center',
      width: 66,
    },
    headerText: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '700',
      textAlign: 'left',
    },
    table: {
      alignSelf: 'stretch',
      gap: Spacing.one,
      width: '100%',
    },
    tableBody: {
      gap: 0,
    },
    tableHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.one,
      width: '100%',
    },
  });
