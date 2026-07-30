import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Colors, Radii, Spacing, Typography } from '@/constants/theme';
import { useLocalization } from '@/localization';
import type { NutritionCoachCopy } from '@/localization/nutritionCoachCopy';
import { formatEnergyValue, useUnitPreferences } from '@/units';
import type { NutritionStrategyViewModel } from '../nutritionStrategyViewModel';

type StrategyResultView = Extract<
  NutritionStrategyViewModel,
  { kind: 'proposal' | 'applied' }
>;

export function NutritionStrategyProposalView({
  confirmationSupported,
  confirming,
  copy,
  onConfirm,
  viewModel,
}: {
  confirmationSupported: boolean;
  confirming: boolean;
  copy: NutritionCoachCopy;
  onConfirm: () => void;
  viewModel: StrategyResultView;
}) {
  const { formatDate, formatNumber, locale } = useLocalization();
  const { energy } = useUnitPreferences();
  const { proposal } = viewModel;
  const applied = viewModel.kind === 'applied';
  const rationaleLabels: Record<string, string> = {
    goal_energy_delta: locale === 'ru' ? 'Диапазон энергии по цели' : 'Goal-based energy range',
    weight_trend: locale === 'ru' ? 'Наблюдаемая динамика веса' : 'Observed weight trend',
    tracked_intake: locale === 'ru' ? 'Отслеживаемое потребление' : 'Tracked intake',
    protein_floor: locale === 'ru' ? 'Минимум белка по политике' : 'Protein policy floor',
    fat_floor: locale === 'ru' ? 'Минимум жиров по политике' : 'Fat policy floor',
    adherence_stability: locale === 'ru' ? 'Стабильность соблюдения' : 'Adherence stability',
    current_target_continuity: locale === 'ru' ? 'Непрерывность текущей цели' : 'Current target continuity',
  };
  const caveatLabels: Record<string, string> = {
    limited_tracking_coverage:
      locale === 'ru' ? 'Покрытие отслеживания ограничено' : 'Tracking coverage is limited',
    weight_trend_unavailable:
      locale === 'ru' ? 'Динамика веса недоступна' : 'Weight trend is unavailable',
    short_observation_window:
      locale === 'ru' ? 'Короткий период наблюдения' : 'Observation window is short',
    target_requires_confirmation:
      locale === 'ru' ? 'Изменение цели требует подтверждения' : 'Any target change requires confirmation',
  };
  const dataQualityLabels: Record<string, string> = {
    high: locale === 'ru' ? 'Высокое' : 'High',
    medium: locale === 'ru' ? 'Среднее' : 'Medium',
    low: locale === 'ru' ? 'Низкое' : 'Low',
  };
  const formatTimestamp = (value: string): string =>
    formatDate(value, { dateStyle: 'medium', timeStyle: 'short' });
  const energyValue = (value: number): string =>
    `${formatEnergyValue(value, energy)} ${energy}`;

  return (
    <View style={styles.stack}>
      <View style={applied ? styles.appliedBanner : styles.previewBanner}>
        <Text style={applied ? styles.appliedTitle : styles.previewTitle}>
          {applied ? copy.applied : copy.previewNotApplied}
        </Text>
        <Text style={styles.previewText}>
          {applied
            ? `${copy.revision} ${formatNumber(viewModel.appliedRevision, {
                maximumFractionDigits: 0,
              })} · ${formatTimestamp(viewModel.appliedAt)}`
            : confirmationSupported
              ? copy.confirmationBody
              : copy.previewOnly}
        </Text>
      </View>

      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.sectionLabel}>{copy.strategy}</Text>
          <Text style={styles.strategyValue}>
            {copy.strategyLabels[proposal.strategy] ?? proposal.strategy}
          </Text>
        </View>
        <View style={styles.validBadge}>
          <Text style={styles.validBadgeText}>{copy.guardrailValid}</Text>
        </View>
      </View>

      <View style={styles.metricGrid}>
        <View style={styles.metricCell}>
          <Text style={styles.metricValue}>{energyValue(proposal.calorieTarget)}</Text>
          <Text style={styles.metricLabel}>{copy.calories}</Text>
        </View>
        <View style={styles.metricCell}>
          <Text style={styles.metricValue}>{formatNumber(proposal.macros.protein)} g</Text>
          <Text style={styles.metricLabel}>{copy.protein}</Text>
        </View>
        <View style={styles.metricCell}>
          <Text style={styles.metricValue}>{formatNumber(proposal.macros.carbs)} g</Text>
          <Text style={styles.metricLabel}>{copy.carbs}</Text>
        </View>
        <View style={styles.metricCell}>
          <Text style={styles.metricValue}>{formatNumber(proposal.macros.fats)} g</Text>
          <Text style={styles.metricLabel}>{copy.fats}</Text>
        </View>
      </View>

      <View style={styles.infoStack}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{copy.confidence}</Text>
          <Text style={styles.infoValue}>
            {formatNumber(proposal.confidence * 100, { maximumFractionDigits: 0 })}%
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{copy.dataQuality}</Text>
          <Text style={styles.infoValue}>
            {dataQualityLabels[proposal.dataQuality] ?? proposal.dataQuality}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{copy.cadence}</Text>
          <Text style={styles.infoValue}>
            {copy.days(
              proposal.adjustmentCadenceDays,
              formatNumber(proposal.adjustmentCadenceDays, { maximumFractionDigits: 0 }),
            )}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{copy.macroCalories}</Text>
          <Text style={styles.infoValue}>{energyValue(viewModel.calculatedMacroCalories)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{copy.mismatch}</Text>
          <Text style={styles.infoValue}>
            {viewModel.calorieMathMismatch > 0 ? '+' : ''}
            {energyValue(viewModel.calorieMathMismatch)}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{copy.attempts}</Text>
          <Text style={styles.infoValue}>
            {formatNumber(viewModel.modelAttempts, { maximumFractionDigits: 0 })}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{copy.summary}</Text>
        <Text style={styles.bodyText}>{proposal.userSummary}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{copy.rationale}</Text>
        {proposal.rationaleCodes.map((code) => (
          <Text key={code} style={styles.listItem}>
            • {rationaleLabels[code] ?? copy.typedIssue}
          </Text>
        ))}
      </View>

      {proposal.caveatCodes.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{copy.caveats}</Text>
          {proposal.caveatCodes.map((code) => (
            <Text key={code} style={styles.listItem}>
              • {caveatLabels[code] ?? copy.typedIssue}
            </Text>
          ))}
        </View>
      ) : null}

      {viewModel.issues.length > 0 ? (
        <View style={styles.issueBox}>
          <Text style={styles.issueTitle}>{copy.deterministicIssues}</Text>
          {viewModel.issues.map((issue) => (
            <Text key={`${issue.code}:${issue.path}`} style={styles.issueText}>
              • {copy.typedIssue}
            </Text>
          ))}
        </View>
      ) : null}

      {!applied && confirmationSupported ? (
        <View style={styles.confirmationSection}>
          <Text style={styles.confirmationText}>{copy.confirmationText}</Text>
          <PrimaryButton
            disabled={confirming}
            label={copy.applyTargets}
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
  headerCopy: { flex: 1, gap: 2, minWidth: 0 },
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
  infoStack: { gap: Spacing.two },
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
  metricCell: { flexBasis: '47%', gap: 2 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.four },
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
  section: { gap: Spacing.one },
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
  stack: { gap: Spacing.four },
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
