import { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { WorkoutSet } from '@/context/AppContext';
import { Colors } from '@/constants/theme';
import { useAppTheme } from '@/theme/AppThemeProvider';

import { SessionEmptySets } from './SessionEmptySets';
import { SessionSetRow } from './SessionSetRow';
import { SESSION_TABLE_COLUMNS, SESSION_TABLE_GAPS, SESSION_TABLE_TOTAL_WIDTH } from './sessionTableLayout';
import type { SessionDraftInputs } from './types';

type SessionSetTableProps = {
  draftInputs: SessionDraftInputs;
  onCommitRowInputs: (setId: string) => void;
  onEditSetRpe: (setId: string) => void;
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
  onEditSetRpe,
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
        <View style={[styles.headerCell, styles.colWeight, styles.headerCellWeight]}>
          <Text style={styles.headerText}>kg</Text>
        </View>
        <View style={[styles.headerCell, styles.colReps, styles.headerCellReps]}>
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
              actualRpe={set.actualRpe}
              onCommit={() => onCommitRowInputs(set.id)}
              onEditRpe={() => onEditSetRpe(set.id)}
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
      width: SESSION_TABLE_COLUMNS.completion,
    },
    colPrevious: {
      alignItems: 'flex-start',
      width: SESSION_TABLE_COLUMNS.previous,
    },
    colReps: {
      width: SESSION_TABLE_COLUMNS.reps,
    },
    colSet: {
      width: SESSION_TABLE_COLUMNS.set,
    },
    colWeight: {
      width: SESSION_TABLE_COLUMNS.weight,
    },
    headerCell: {
      alignItems: 'center',
    },
    headerText: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '500',
      lineHeight: 18,
      textAlign: 'center',
    },
    table: {
      alignSelf: 'center',
      gap: 8,
      width: SESSION_TABLE_TOTAL_WIDTH,
    },
    tableBody: {
      gap: 0,
    },
    tableHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      columnGap: 0,
      minHeight: 22,
      width: '100%',
    },
    headerCellPrevious: {
      marginLeft: SESSION_TABLE_GAPS.setToPrevious,
    },
    headerCellWeight: {
      marginLeft: SESSION_TABLE_GAPS.previousToWeight,
    },
    headerCellReps: {
      marginLeft: SESSION_TABLE_GAPS.weightToReps,
    },
    headerCellCompletion: {
      marginLeft: SESSION_TABLE_GAPS.repsToCompletion,
    },
  });
