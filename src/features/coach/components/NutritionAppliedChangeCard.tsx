import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { CoachNutritionAppliedChange } from '@/api/coach/nutritionAppliedChangeSummary';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useLocalization } from '@/localization';
import { useAppTheme } from '@/theme/AppThemeProvider';
import { useUnitPreferences } from '@/units';
import { getCoachHistoryCopy } from '../coachHistoryCopy';

type NutritionAppliedChangeCardProps = {
  changes: CoachNutritionAppliedChange[];
  invalid: boolean;
};

export function NutritionAppliedChangeCard({
  changes,
  invalid,
}: NutritionAppliedChangeCardProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { formatNumber, locale } = useLocalization();
  const { energy, formatEnergyValue } = useUnitPreferences();
  const copy = getCoachHistoryCopy(locale);

  if (!invalid && changes.length === 0) return null;

  const formatTargets = (values: CoachNutritionAppliedChange['summary']['before']) => [
    { label: copy.calories, value: `${formatEnergyValue(values.calories)} ${energy}` },
    { label: copy.protein, value: `${formatNumber(values.protein)} ${copy.grams}` },
    { label: copy.carbs, value: `${formatNumber(values.carbs)} ${copy.grams}` },
    { label: copy.fats, value: `${formatNumber(values.fats)} ${copy.grams}` },
  ];

  return (
    <AppCard>
      <Text style={styles.cardTitle}>{copy.appliedChanges}</Text>
      {invalid ? (
        <Text style={styles.body}>{copy.appliedChangesUnavailable}</Text>
      ) : (
        changes.map(({ applicationKey, summary }) => (
          <View key={applicationKey} style={styles.changeBlock}>
            <Text style={styles.applicationTitle}>
              {copy.application(applicationKey)}
            </Text>
            <View style={styles.snapshotGrid}>
              <TargetSnapshot
                label={copy.before}
                rows={formatTargets(summary.before)}
                styles={styles}
              />
              <TargetSnapshot
                label={copy.after}
                rows={formatTargets(summary.after)}
                styles={styles}
              />
            </View>
            <View style={styles.explanationBlock}>
              <Text style={styles.sectionLabel}>{copy.rationale}</Text>
              {summary.rationaleCodes.map((code) => (
                <Text key={code} style={styles.body}>
                  • {copy.rationaleCode(code)}
                </Text>
              ))}
            </View>
            <View style={styles.explanationBlock}>
              <Text style={styles.sectionLabel}>{copy.policyReferences}</Text>
              <Text selectable style={styles.body}>
                {summary.policyReferences.join(' · ')}
              </Text>
            </View>
          </View>
        ))
      )}
    </AppCard>
  );
}

type ChangeSummaryStyles = ReturnType<typeof createStyles>;

type TargetSnapshotProps = {
  label: string;
  rows: Array<{ label: string; value: string }>;
  styles: ChangeSummaryStyles;
};

function TargetSnapshot({ label, rows, styles }: TargetSnapshotProps) {
  return (
    <View style={styles.snapshot}>
      <Text style={styles.snapshotTitle}>{label}</Text>
      {rows.map((row) => (
        <View key={row.label} style={styles.row}>
          <Text style={styles.label}>{row.label}</Text>
          <Text style={styles.value}>{row.value}</Text>
        </View>
      ))}
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    applicationTitle: {
      color: colors.textPrimary,
      fontSize: Typography.body.fontSize,
      fontWeight: '700',
    },
    body: {
      color: colors.textSecondary,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    cardTitle: {
      color: colors.textPrimary,
      fontSize: Typography.cardTitle.fontSize,
      fontWeight: Typography.cardTitle.fontWeight,
    },
    changeBlock: {
      borderTopColor: colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
      gap: Spacing.two,
      paddingTop: Spacing.two,
    },
    explanationBlock: { gap: Spacing.one },
    label: {
      color: colors.textSecondary,
      flex: 1,
      fontSize: Typography.caption.fontSize,
    },
    row: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: Spacing.one,
      justifyContent: 'space-between',
    },
    sectionLabel: {
      color: colors.textPrimary,
      fontSize: Typography.caption.fontSize,
      fontWeight: '700',
    },
    snapshot: {
      borderColor: colors.borderSubtle,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      flex: 1,
      gap: Spacing.one,
      minWidth: 0,
      padding: Spacing.two,
    },
    snapshotGrid: {
      flexDirection: 'row',
      gap: Spacing.two,
    },
    snapshotTitle: {
      color: colors.textPrimary,
      fontSize: Typography.body.fontSize,
      fontWeight: '700',
    },
    value: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: Typography.caption.fontSize,
      textAlign: 'right',
    },
  });
