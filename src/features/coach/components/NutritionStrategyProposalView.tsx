import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Colors, Radii, Spacing, Typography } from '@/constants/theme';
import type { NutritionStrategyViewModel } from '../nutritionStrategyViewModel';

const STRATEGY_LABELS = {
  maintain: 'Maintain',
  reduce: 'Reduce',
  increase: 'Increase',
  recompose: 'Recompose',
} as const;

const RATIONALE_LABELS: Record<string, string> = {
  goal_energy_delta: 'Goal-based energy range',
  weight_trend: 'Observed weight trend',
  tracked_intake: 'Tracked intake',
  protein_floor: 'Protein policy floor',
  fat_floor: 'Fat policy floor',
  adherence_stability: 'Adherence stability',
  current_target_continuity: 'Current target continuity',
};

const CAVEAT_LABELS: Record<string, string> = {
  limited_tracking_coverage: 'Tracking coverage is limited',
  weight_trend_unavailable: 'Weight trend is unavailable',
  short_observation_window: 'Observation window is short',
  target_requires_confirmation: 'Any target change requires confirmation',
};

const formatNumber = (value: number, maximumFractionDigits = 0): string =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits }).format(value);

const formatConfidence = (value: number): string =>
  `${formatNumber(value * 100)}%`;

const formatTimestamp = (value: string): string => {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date)
    : value;
};

type StrategyResultView = Extract<
  NutritionStrategyViewModel,
  { kind: 'proposal' | 'applied' }
>;

export function NutritionStrategyProposalView({
  confirmationSupported,
  confirming,
  onConfirm,
  viewModel,
}: {
  confirmationSupported: boolean;
  confirming: boolean;
  onConfirm: () => void;
  viewModel: StrategyResultView;
}) {
  const { proposal } = viewModel;
  const applied = viewModel.kind === 'applied';

  return (
    <View style={styles.stack}>
      <View style={applied ? styles.appliedBanner : styles.previewBanner}>
        <Text style={applied ? styles.appliedTitle : styles.previewTitle}>
          {applied ? 'Applied to active target' : 'Preview · not applied'}
        </Text>
        <Text style={styles.previewText}>
          {applied
            ? `Revision ${viewModel.appliedRevision} · ${formatTimestamp(viewModel.appliedAt)}`
            : confirmationSupported
              ? 'Applying requires a separate confirmation. The backend will reload the run, verify the target revision and rerun deterministic guardrails.'
              : 'This backend supports strategy preview but does not advertise strategy confirmation.'}
        </Text>
      </View>

      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.sectionLabel}>Strategy</Text>
          <Text style={styles.strategyValue}>{STRATEGY_LABELS[proposal.strategy]}</Text>
        </View>
        <View style={styles.validBadge}>
          <Text style={styles.validBadgeText}>GUARDRAIL VALID</Text>
        </View>
      </View>

      <View style={styles.metricGrid}>
        <View style={styles.metricCell}>
          <Text style={styles.metricValue}>{formatNumber(proposal.calorieTarget)}</Text>
          <Text style={styles.metricLabel}>Calories</Text>
        </View>
        <View style={styles.metricCell}>
          <Text style={styles.metricValue}>{formatNumber(proposal.macros.protein)} g</Text>
          <Text style={styles.metricLabel}>Protein</Text>
        </View>
        <View style={styles.metricCell}>
          <Text style={styles.metricValue}>{formatNumber(proposal.macros.carbs)} g</Text>
          <Text style={styles.metricLabel}>Carbs</Text>
        </View>
        <View style={styles.metricCell}>
          <Text style={styles.metricValue}>{formatNumber(proposal.macros.fats)} g</Text>
          <Text style={styles.metricLabel}>Fats</Text>
        </View>
      </View>

      <View style={styles.infoStack}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Confidence</Text>
          <Text style={styles.infoValue}>{formatConfidence(proposal.confidence)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Data quality</Text>
          <Text style={styles.infoValue}>{proposal.dataQuality}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Adjustment cadence</Text>
          <Text style={styles.infoValue}>{proposal.adjustmentCadenceDays} days</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Macro calories</Text>
          <Text style={styles.infoValue}>{formatNumber(viewModel.calculatedMacroCalories)} kcal</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Calorie math mismatch</Text>
          <Text style={styles.infoValue}>
            {viewModel.calorieMathMismatch > 0 ? '+' : ''}
            {formatNumber(viewModel.calorieMathMismatch)} kcal
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Validation attempts</Text>
          <Text style={styles.infoValue}>{viewModel.modelAttempts}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Summary</Text>
        <Text style={styles.bodyText}>{proposal.userSummary}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rationale</Text>
        {proposal.rationaleCodes.map((code) => (
          <Text key={code} style={styles.listItem}>
            • {RATIONALE_LABELS[code] ?? code}
          </Text>
        ))}
      </View>

      {proposal.caveatCodes.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Caveats</Text>
          {proposal.caveatCodes.map((code) => (
            <Text key={code} style={styles.listItem}>
              • {CAVEAT_LABELS[code] ?? code}
            </Text>
          ))}
        </View>
      ) : null}

      {viewModel.issues.length > 0 ? (
        <View style={styles.issueBox}>
          <Text style={styles.issueTitle}>Deterministic issues</Text>
          {viewModel.issues.map((issue) => (
            <Text key={`${issue.code}:${issue.path}`} style={styles.issueText}>
              • {issue.message}
            </Text>
          ))}
        </View>
      ) : null}

      {!applied && confirmationSupported ? (
        <View style={styles.confirmationSection}>
          <Text style={styles.confirmationText}>
            Confirmation replaces the active calorie and macro target with the values shown above.
          </Text>
          <PrimaryButton
            disabled={confirming}
            label="Apply strategy to targets"
            loading={confirming}
            onPress={onConfirm}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  appliedBanner: {
    backgroundColor: Colors.dark.successSoft,
    borderColor: Colors.dark.success,
    borderRadius: Radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.one,
    padding: Spacing.three,
  },
  appliedTitle: {
    color: Colors.dark.success,
    fontSize: Typography.label.fontSize,
    fontWeight: '800',
  },
  bodyText: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
  },
  confirmationSection: {
    borderTopColor: Colors.dark.borderSubtle,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
    paddingTop: Spacing.three,
  },
  confirmationText: {
    color: Colors.dark.warning,
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.three,
    justifyContent: 'space-between',
  },
  infoLabel: {
    color: Colors.dark.textMuted,
    flex: 1,
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
  },
  infoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.three,
    justifyContent: 'space-between',
  },
  infoStack: {
    gap: Spacing.two,
  },
  infoValue: {
    color: Colors.dark.textPrimary,
    fontSize: Typography.bodyEmphasized.fontSize,
    fontWeight: Typography.bodyEmphasized.fontWeight,
    lineHeight: Typography.bodyEmphasized.lineHeight,
    textAlign: 'right',
  },
  issueBox: {
    backgroundColor: Colors.dark.warningSoft,
    borderColor: Colors.dark.warning,
    borderRadius: Radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.one,
    padding: Spacing.three,
  },
  issueText: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
  },
  issueTitle: {
    color: Colors.dark.warning,
    fontSize: Typography.label.fontSize,
    fontWeight: '800',
  },
  listItem: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
  },
  metricCell: {
    flexBasis: '47%',
    gap: 2,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.four,
  },
  metricLabel: {
    color: Colors.dark.textMuted,
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
  },
  metricValue: {
    color: Colors.dark.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  previewBanner: {
    backgroundColor: Colors.dark.accentSoft,
    borderColor: Colors.dark.accent,
    borderRadius: Radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.one,
    padding: Spacing.three,
  },
  previewText: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
  },
  previewTitle: {
    color: Colors.dark.accent,
    fontSize: Typography.label.fontSize,
    fontWeight: '800',
  },
  section: {
    gap: Spacing.one,
  },
  sectionLabel: {
    color: Colors.dark.textMuted,
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
  },
  sectionTitle: {
    color: Colors.dark.textPrimary,
    fontSize: Typography.label.fontSize,
    fontWeight: Typography.label.fontWeight,
    lineHeight: Typography.label.lineHeight,
  },
  stack: {
    gap: Spacing.four,
  },
  strategyValue: {
    color: Colors.dark.textPrimary,
    fontSize: Typography.cardTitle.fontSize,
    fontWeight: Typography.cardTitle.fontWeight,
    lineHeight: Typography.cardTitle.lineHeight,
  },
  validBadge: {
    backgroundColor: Colors.dark.successSoft,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  validBadgeText: {
    color: Colors.dark.success,
    fontSize: Typography.caption.fontSize,
    fontWeight: '800',
  },
});
