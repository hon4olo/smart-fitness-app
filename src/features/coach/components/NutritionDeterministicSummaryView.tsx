import { StyleSheet, Text, View } from 'react-native';

import { Colors, Radii, Spacing, Typography } from '@/constants/theme';
import type { NutritionDeterministicSummary } from '../nutritionDeterministicSummary';

const FIELD_LABELS: Record<string, string> = {
  fitnessProfile: 'Complete Coach profile',
  'fitnessProfile.dateOfBirth': 'Date of birth',
  'fitnessProfile.calculationSex': 'Calculation formula',
  'fitnessProfile.heightCm': 'Height',
  'fitnessProfile.goal': 'Goal',
  'fitnessProfile.activityLevel': 'Activity level',
  'fitnessProfile.targetWeeklyWeightChangeKg': 'Target weekly weight change',
  latestWeight: 'Latest synchronized weight',
  'nutritionHistory.minimumTrackedDays': 'At least three tracked nutrition days',
};

const formatNumber = (value: number, maximumFractionDigits = 0): string =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits }).format(value);

const formatSigned = (value: number): string =>
  `${value > 0 ? '+' : ''}${formatNumber(value)}`;

export function NutritionDeterministicSummaryView({
  summary,
}: {
  summary: NutritionDeterministicSummary;
}) {
  if (summary.readiness.status === 'needs_input') {
    return (
      <View style={styles.warningBox}>
        <Text style={styles.warningTitle}>Coach profile needs input</Text>
        <Text style={styles.bodyText}>
          Deterministic energy calculations were not run. Add or synchronize:
        </Text>
        {summary.readiness.missingFields.map((field) => (
          <Text key={field} style={styles.listItem}>
            • {FIELD_LABELS[field] ?? field}
          </Text>
        ))}
      </View>
    );
  }

  if (summary.readiness.status === 'blocked') {
    return (
      <View style={styles.errorBox}>
        <Text style={styles.errorTitle}>Energy calculation blocked</Text>
        {summary.readiness.issues.map((issue) => (
          <Text key={`${issue.code}:${issue.field}`} style={styles.listItem}>
            • {issue.message}
          </Text>
        ))}
      </View>
    );
  }

  const energy = summary.energy;
  if (!energy) return null;

  return (
    <View style={styles.stack}>
      <View style={styles.readyHeader}>
        <View>
          <Text style={styles.sectionTitle}>Deterministic energy model</Text>
          <Text style={styles.metaText}>
            Mifflin–St Jeor · profile revision {summary.readiness.profileRevision}
          </Text>
        </View>
        <Text style={styles.readyBadge}>READY</Text>
      </View>

      <View style={styles.metricGrid}>
        <View style={styles.metricCell}>
          <Text style={styles.metricValue}>{formatNumber(energy.bmrCalories)}</Text>
          <Text style={styles.metaText}>BMR kcal</Text>
        </View>
        <View style={styles.metricCell}>
          <Text style={styles.metricValue}>{formatNumber(energy.tdeeCalories)}</Text>
          <Text style={styles.metaText}>TDEE kcal</Text>
        </View>
        <View style={styles.metricCell}>
          <Text style={styles.metricValue}>{formatNumber(energy.goalAdjustedCalories)}</Text>
          <Text style={styles.metaText}>Goal target</Text>
        </View>
      </View>

      <View style={styles.infoBox}>
        <View style={styles.infoRow}>
          <Text style={styles.metaText}>Permissible calorie range</Text>
          <Text style={styles.infoValue}>
            {formatNumber(energy.permissibleCalories.min)}–{formatNumber(energy.permissibleCalories.max)}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.metaText}>Applied daily energy delta</Text>
          <Text style={styles.infoValue}>
            {formatSigned(energy.appliedDailyEnergyDeltaKcal)} kcal
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.metaText}>Protein policy range</Text>
          <Text style={styles.infoValue}>
            {formatNumber(energy.proteinGrams.min)}–{formatNumber(energy.proteinGrams.max)} g
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.metaText}>Fat policy range</Text>
          <Text style={styles.infoValue}>
            {formatNumber(energy.fatGrams.min)}–{formatNumber(energy.fatGrams.max)} g
          </Text>
        </View>
      </View>

      {energy.deltaWasClamped ? (
        <Text style={styles.clampText}>
          Requested weekly rate exceeded the configured policy. The displayed energy delta was clamped deterministically.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bodyText: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
  },
  clampText: {
    color: Colors.dark.warning,
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
  },
  errorBox: {
    backgroundColor: Colors.dark.errorSoft,
    borderColor: Colors.dark.error,
    borderRadius: Radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.one,
    padding: Spacing.three,
  },
  errorTitle: {
    color: Colors.dark.error,
    fontSize: Typography.label.fontSize,
    fontWeight: '800',
  },
  infoBox: {
    gap: Spacing.two,
  },
  infoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.three,
    justifyContent: 'space-between',
  },
  infoValue: {
    color: Colors.dark.textPrimary,
    fontSize: Typography.bodyEmphasized.fontSize,
    fontWeight: Typography.bodyEmphasized.fontWeight,
    textAlign: 'right',
  },
  listItem: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
  },
  metaText: {
    color: Colors.dark.textMuted,
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
  },
  metricCell: {
    flex: 1,
    gap: 2,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  metricValue: {
    color: Colors.dark.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  readyBadge: {
    backgroundColor: Colors.dark.accentSoft,
    borderRadius: Radii.pill,
    color: Colors.dark.accent,
    fontSize: Typography.caption.fontSize,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  readyHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.three,
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: Colors.dark.textPrimary,
    fontSize: Typography.label.fontSize,
    fontWeight: Typography.label.fontWeight,
    lineHeight: Typography.label.lineHeight,
  },
  stack: {
    borderTopColor: Colors.dark.borderSubtle,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.three,
    paddingTop: Spacing.three,
  },
  warningBox: {
    backgroundColor: Colors.dark.warningSoft,
    borderColor: Colors.dark.warning,
    borderRadius: Radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.one,
    padding: Spacing.three,
  },
  warningTitle: {
    color: Colors.dark.warning,
    fontSize: Typography.label.fontSize,
    fontWeight: '800',
  },
});
