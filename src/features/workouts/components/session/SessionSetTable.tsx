import { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { WorkoutSet } from '@/context/AppContext';
import { Colors } from '@/constants/theme';
import { useLocalization } from '@/localization';
import { useAppTheme } from '@/theme/AppThemeProvider';
import { displayWeightInputToKg, formatWeightValue, useUnitPreferences } from '@/units';

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
  const { formatNumber, t } = useLocalization();
  const { weight: weightUnit } = useUnitPreferences();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const rowCount = Math.max(sets.length, targetSetCount);
  const previousLabel = (index: number) =>
    previousSets[index]
      ? `${formatWeightValue(previousSets[index].weight, weightUnit)} ${weightUnit} × ${formatNumber(previousSets[index].reps, { maximumFractionDigits: 0 })}`
      : '—';

  if (rowCount === 0) return <SessionEmptySets />;

  return (
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <View style={[styles.headerCell, styles.colSet]}>
          <Text style={styles.headerText}>{t('workouts.session.set')}</Text>
        </View>
        <View style={[styles.headerCell, styles.colPrevious, styles.headerCellPrevious]}>
          <Text style={styles.headerText}>{t('workouts.session.previous')}</Text>
        </View>
        <View style={[styles.headerCell, styles.colWeight, styles.headerCellWeight]}>
          <Text style={styles.headerText}>{weightUnit}</Text>
        </View>
        <View style={[styles.headerCell, styles.colReps, styles.headerCellReps]}>
          <Text style={styles.headerText}>{t('workouts.session.reps')}</Text>
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
                onWeightChange={(value) => onPlannedWeightChange(index, displayWeightInputToKg(value, weightUnit))}
                previousLabel={previousLabel(index)}
              />
            );
          }

          const canonicalDraft = draftInputs[set.id] ?? { reps: `${set.reps}`, weight: `${set.weight}` };
          const numericWeight = Number(canonicalDraft.weight);
          const displayDraft = {
            reps: canonicalDraft.reps,
            weight: Number.isFinite(numericWeight)
              ? formatWeightValue(numericWeight, weightUnit)
              : canonicalDraft.weight,
          };

          return (
            <SessionSetRow
              key={set.id}
              completed={set.completed !== false}
              draftValue={displayDraft}
              index={index}
              actualRpe={set.actualRpe}
              onCommit={() => onCommitRowInputs(set.id)}
              onEditRpe={() => onEditSetRpe(set.id)}
              onLongPress={() => onLongPressRow(set.id)}
              onRepsChange={(value) => onRepsChange(set.id, value)}
              onToggle={() => onToggleSetCompletion(set.id)}
              onWeightChange={(value) => onWeightChange(set.id, displayWeightInputToKg(value, weightUnit))}
              previousLabel={previousLabel(index)}
            />
          );
        })}
      </View>
    </View>
  );
});

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    colCompletion: { width: SESSION_TABLE_COLUMNS.completion },
    colPrevious: { alignItems: 'flex-start', width: SESSION_TABLE_COLUMNS.previous },
    colReps: { width: SESSION_TABLE_COLUMNS.reps },
    colSet: { width: SESSION_TABLE_COLUMNS.set },
    colWeight: { width: SESSION_TABLE_COLUMNS.weight },
    headerCell: { alignItems: 'center' },
    headerText: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '500',
      lineHeight: 18,
      textAlign: 'center',
    },
    table: { alignSelf: 'center', gap: 8, width: SESSION_TABLE_TOTAL_WIDTH },
    tableBody: { gap: 0 },
    tableHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      columnGap: 0,
      minHeight: 22,
      width: '100%',
    },
    headerCellPrevious: { marginLeft: SESSION_TABLE_GAPS.setToPrevious },
    headerCellWeight: { marginLeft: SESSION_TABLE_GAPS.previousToWeight },
    headerCellReps: { marginLeft: SESSION_TABLE_GAPS.weightToReps },
    headerCellCompletion: { marginLeft: SESSION_TABLE_GAPS.repsToCompletion },
  });
