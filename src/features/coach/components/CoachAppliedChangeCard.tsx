import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type {
  CoachAppliedChange,
  CombinedStrengthAppliedChangeSummary,
  NutritionAppliedChangeSummary,
  StrengthAppliedChangeSummary,
} from '@/api/coach/appliedChangeSummary';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useLocalization } from '@/localization';
import { useAppTheme } from '@/theme/AppThemeProvider';
import { useUnitPreferences } from '@/units';
import { getCoachHistoryCopy } from '../coachHistoryCopy';

type CoachAppliedChangeCardProps = {
  changes: CoachAppliedChange[];
  invalid: boolean;
};

export function CoachAppliedChangeCard({
  changes,
  invalid,
}: CoachAppliedChangeCardProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { formatNumber, locale } = useLocalization();
  const units = useUnitPreferences();
  const copy = getCoachHistoryCopy(locale);

  if (!invalid && changes.length === 0) return null;

  return (
    <AppCard>
      <Text style={styles.cardTitle}>{copy.appliedChanges}</Text>
      {invalid ? (
        <Text style={styles.body}>{copy.appliedChangesUnavailable}</Text>
      ) : (
        changes.map((change) => (
          <View
            key={`${change.applicationKey}:${change.summary.kind}`}
            style={styles.changeBlock}>
            <Text style={styles.applicationTitle}>
              {copy.application(change.applicationKey)}
            </Text>
            {change.summary.kind === 'nutrition_targets' ? (
              <NutritionChange
                summary={change.summary}
                copy={copy}
                formatNumber={formatNumber}
                styles={styles}
                units={units}
              />
            ) : change.summary.kind === 'strength_template' ? (
              <StrengthChange
                summary={change.summary}
                copy={copy}
                formatNumber={formatNumber}
                styles={styles}
                units={units}
              />
            ) : (
              <CombinedStrengthChange
                summary={change.summary}
                copy={copy}
                formatNumber={formatNumber}
                styles={styles}
                units={units}
              />
            )}
          </View>
        ))
      )}
    </AppCard>
  );
}

type Copy = ReturnType<typeof getCoachHistoryCopy>;
type Styles = ReturnType<typeof createStyles>;
type FormatNumber = (value: number, options?: Intl.NumberFormatOptions) => string;
type Units = ReturnType<typeof useUnitPreferences>;

type ChangeProps<T> = {
  summary: T;
  copy: Copy;
  formatNumber: FormatNumber;
  styles: Styles;
  units: Units;
};

function NutritionChange({
  summary,
  copy,
  formatNumber,
  styles,
  units,
}: ChangeProps<NutritionAppliedChangeSummary>) {
  const rows = (values: NutritionAppliedChangeSummary['before']) => [
    { label: copy.calories, value: `${units.formatEnergyValue(values.calories)} ${units.energy}` },
    { label: copy.protein, value: `${formatNumber(values.protein)} ${copy.grams}` },
    { label: copy.carbs, value: `${formatNumber(values.carbs)} ${copy.grams}` },
    { label: copy.fats, value: `${formatNumber(values.fats)} ${copy.grams}` },
  ];
  return (
    <>
      <View style={styles.snapshotGrid}>
        <Snapshot label={copy.before} rows={rows(summary.before)} styles={styles} />
        <Snapshot label={copy.after} rows={rows(summary.after)} styles={styles} />
      </View>
      <BulletList
        label={copy.rationale}
        values={summary.rationaleCodes.map(copy.nutritionRationale)}
        styles={styles}
      />
      <PolicyReferences values={summary.policyReferences} copy={copy} styles={styles} />
    </>
  );
}

function StrengthChange({
  summary,
  copy,
  formatNumber,
  styles,
  units,
}: ChangeProps<StrengthAppliedChangeSummary>) {
  return (
    <>
      <View style={styles.metaBlock}>
        <Row label={copy.strategy} value={summary.strategy} styles={styles} />
        <Row
          label={copy.sourceSessionRevision}
          value={summary.sourceSessionRevision === null ? copy.revisionUnavailable : copy.revision(summary.sourceSessionRevision)}
          styles={styles}
        />
      </View>
      {summary.sets.map((set, index) => (
        <View key={`${set.exerciseName}:${index}`} style={styles.setBlock}>
          <Text style={styles.setTitle}>{set.exerciseName}</Text>
          <View style={styles.snapshotGrid}>
            <Snapshot
              label={copy.before}
              rows={[
                { label: copy.weight, value: `${units.formatWeightValue(set.before.weight)} ${units.weight}` },
                { label: copy.reps, value: formatNumber(set.before.reps) },
                { label: copy.actualRpe, value: set.before.actualRpe === null ? '—' : formatNumber(set.before.actualRpe) },
              ]}
              styles={styles}
            />
            <Snapshot
              label={copy.after}
              rows={[
                { label: copy.weight, value: `${units.formatWeightValue(set.after.weight)} ${units.weight}` },
                { label: copy.reps, value: formatNumber(set.after.reps) },
                { label: copy.targetRpe, value: formatNumber(set.after.targetRpe) },
              ]}
              styles={styles}
            />
          </View>
          <Text style={styles.body}>
            {copy.adjustment(set.adjustment)} · {copy.setRationale(set.rationaleCode)}
          </Text>
        </View>
      ))}
      <BulletList
        label={copy.rationale}
        values={summary.rationaleCodes.map(copy.strengthRationale)}
        styles={styles}
      />
      <BulletList
        label={copy.caveats}
        values={summary.caveatCodes.map(copy.caveat)}
        styles={styles}
      />
      <PolicyReferences values={summary.policyReferences} copy={copy} styles={styles} />
    </>
  );
}

function CombinedStrengthChange({
  summary,
  copy,
  formatNumber,
  styles,
  units,
}: ChangeProps<CombinedStrengthAppliedChangeSummary>) {
  return (
    <>
      <View style={styles.metaBlock}>
        <Row label={copy.statusLabel} value={summary.status} styles={styles} />
        <Row
          label={copy.loadMultiplier}
          value={`${formatNumber(summary.loadMultiplier * 100, { maximumFractionDigits: 0 })}%`}
          styles={styles}
        />
        <Row
          label={copy.sourceSessionRevision}
          value={summary.sourceSessionRevision === null ? copy.revisionUnavailable : copy.revision(summary.sourceSessionRevision)}
          styles={styles}
        />
      </View>
      {summary.sets.map((set, index) => (
        <View key={`${set.exerciseName}:${index}`} style={styles.setBlock}>
          <Text style={styles.setTitle}>{set.exerciseName}</Text>
          <Snapshot
            label={copy.before}
            rows={[
              { label: copy.weight, value: `${units.formatWeightValue(set.before.weight)} ${units.weight}` },
              { label: copy.reps, value: formatNumber(set.before.reps) },
              { label: copy.actualRpe, value: set.before.actualRpe === null ? '—' : formatNumber(set.before.actualRpe) },
            ]}
            styles={styles}
          />
          <View style={styles.combinedRows}>
            <Row
              label={copy.proposed}
              value={`${units.formatWeightValue(set.after.proposedWeight)} ${units.weight}`}
              styles={styles}
            />
            <Row
              label={copy.maximumAllowed}
              value={`${units.formatWeightValue(set.after.maximumAllowedWeight)} ${units.weight}`}
              styles={styles}
            />
            <Row
              label={copy.effective}
              value={`${units.formatWeightValue(set.after.effectiveWeight)} ${units.weight}`}
              styles={styles}
            />
            <Row label={copy.reps} value={formatNumber(set.after.reps)} styles={styles} />
            <Row label={copy.targetRpe} value={formatNumber(set.after.targetRpe)} styles={styles} />
          </View>
          <Text style={styles.body}>{copy.combinedRationale(set.rationaleCode)}</Text>
          {set.safetyAdjusted ? <Text style={styles.warning}>{copy.safetyAdjusted}</Text> : null}
        </View>
      ))}
      <PolicyReferences values={summary.policyReferences} copy={copy} styles={styles} />
    </>
  );
}

function Snapshot({ label, rows, styles }: { label: string; rows: Array<{ label: string; value: string }>; styles: Styles }) {
  return (
    <View style={styles.snapshot}>
      <Text style={styles.snapshotTitle}>{label}</Text>
      {rows.map((row) => <Row key={row.label} {...row} styles={styles} />)}
    </View>
  );
}

function Row({ label, value, styles }: { label: string; value: string; styles: Styles }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function BulletList({ label, values, styles }: { label: string; values: string[]; styles: Styles }) {
  return (
    <View style={styles.metaBlock}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {values.map((value) => <Text key={value} style={styles.body}>• {value}</Text>)}
    </View>
  );
}

function PolicyReferences({ values, copy, styles }: { values: string[]; copy: Copy; styles: Styles }) {
  return (
    <View style={styles.metaBlock}>
      <Text style={styles.sectionLabel}>{copy.policyReferences}</Text>
      <Text selectable style={styles.body}>{values.join(' · ')}</Text>
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  applicationTitle: { color: colors.textPrimary, fontSize: Typography.body.fontSize, fontWeight: '700' },
  body: { color: colors.textSecondary, fontSize: Typography.caption.fontSize, lineHeight: Typography.caption.lineHeight },
  cardTitle: { color: colors.textPrimary, fontSize: Typography.cardTitle.fontSize, fontWeight: Typography.cardTitle.fontWeight },
  changeBlock: { borderTopColor: colors.borderSubtle, borderTopWidth: StyleSheet.hairlineWidth, gap: Spacing.two, paddingTop: Spacing.two },
  combinedRows: { borderColor: colors.borderSubtle, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, gap: Spacing.one, padding: Spacing.two },
  label: { color: colors.textSecondary, flex: 1, fontSize: Typography.caption.fontSize },
  metaBlock: { gap: Spacing.one },
  row: { alignItems: 'flex-start', flexDirection: 'row', gap: Spacing.one, justifyContent: 'space-between' },
  sectionLabel: { color: colors.textPrimary, fontSize: Typography.caption.fontSize, fontWeight: '700' },
  setBlock: { borderTopColor: colors.borderSubtle, borderTopWidth: StyleSheet.hairlineWidth, gap: Spacing.two, paddingTop: Spacing.two },
  setTitle: { color: colors.textPrimary, fontSize: Typography.body.fontSize, fontWeight: '700' },
  snapshot: { borderColor: colors.borderSubtle, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, flexBasis: 210, flexGrow: 1, gap: Spacing.one, minWidth: 0, padding: Spacing.two },
  snapshotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  snapshotTitle: { color: colors.textPrimary, fontSize: Typography.body.fontSize, fontWeight: '700' },
  value: { color: colors.textPrimary, flex: 1, fontSize: Typography.caption.fontSize, textAlign: 'right' },
  warning: { color: colors.warning, fontSize: Typography.caption.fontSize, fontWeight: '700' },
});
