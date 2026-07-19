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
  onPlannedRepsChange: (index: number, value: string) => void;
  onPlannedToggleSetCompletion: (index: number) => void;
  onPlannedWeightChange: (index: number, value: string) => void;
  onRepsChange: (setId: string, value: string) => void;
  onToggleSetCompletion: (setId: string) => void;
  onWeightChange: (setId: string, value: string) => void;
  previousSets?: Array<{ reps: number; weight: number }>;
  sets: WorkoutSet[];
  targetSetCount: number;
};

export const SessionSetTable = memo(function SessionSetTable({
  draftInputs,
  onCommitRowInputs,
  onLongPressRow,
  onPlannedRepsChange,
  onPlannedToggleSetCompletion,
  onPlannedWeightChange,
  onRepsChange,
  onToggleSetCompletion,
  onWeightChange,
  previousSets = [],
  sets,
  targetSetCount,
}: SessionSetTableProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const rowCount = Math.max(sets.length, targetSetCount);

  if (rowCount === 0) {
    return <SessionEmptySets />;
  }

  return (
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <View style={[styles.headerCell, styles.colSet]}>
          <Text style={styles.headerText}>Set</Text>
        </View>
        <View style={[styles.headerCell, styles.colPrevious, styles.headerCellPrevious]}>
          <Text style={styles.headerText}>Previous</Text>
        </View>
        <View style={[styles.headerCell, styles.colWeight]}>
          <Text style={styles.headerText}>kg</Text>
        </View>
        <View style={[styles.headerCell, styles.colReps]}>
          <Text style={styles.headerText}>Reps</Text>
        </View>
        <View style={[styles.headerCell, styles.colCompletion, styles.headerCellCompletion]}>
          <Text style={styles.headerText}>✓</Text>
        </View>
      </View>

      <View style={styles.tableBody}>
        {Array.from({ length: rowCount }, (_, index) => {
          const set = sets[index];

          if (!set) {
            return (
              <SessionSetRow
                key={`planned-${index}`}
                completed={false}
                draftValue={{ reps: '', weight: '' }}
                index={index}
                onCommit={() => undefined}
                onLongPress={() => undefined}
                onRepsChange={(value) => onPlannedRepsChange(index, value)}
                onToggle={() => onPlannedToggleSetCompletion(index)}
                onWeightChange={(value) => onPlannedWeightChange(index, value)}
                previousLabel={previousSets[index] ? `${previousSets[index].weight}kg x ${previousSets[index].reps}` : '-'}
              />
            );
          }

          return (
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
              previousLabel={previousSets[index] ? `${previousSets[index].weight}kg x ${previousSets[index].reps}` : '-'}
            />
          );
        })}
      </View>
    </View>
  );
});

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    colCompletion: {
      textAlign: 'center',
      width: 48,
    },
    colPrevious: {
      flex: 1,
      minWidth: 0,
      paddingLeft: 10,
      textAlign: 'left',
    },
    colReps: {
      textAlign: 'center',
      width: 94,
    },
    colSet: {
      textAlign: 'center',
      width: 48,
    },
    colWeight: {
      textAlign: 'center',
      width: 94,
    },
    headerCell: {
      alignItems: 'center',
    },
    headerCellPrevious: {
      alignItems: 'flex-start',
    },
    headerCellCompletion: {
      marginHorizontal: 7,
    },
    headerText: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '500',
      textAlign: 'center',
    },
    table: {
      alignSelf: 'stretch',
      gap: 6,
      marginHorizontal: -Spacing.four,
    },
    tableBody: {
      gap: 0,
    },
    tableHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 0,
      minHeight: 24,
      width: '100%',
    },
  });
