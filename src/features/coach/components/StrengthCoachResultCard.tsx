import { Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { useLocalization } from '@/localization';
import type { StrengthCoachCopy } from '@/localization/strengthCoachCopy';
import { useUnitPreferences, weightFromKg } from '@/units';

import type {
  StrengthCoachMetricSummary,
  StrengthCoachViewModel,
} from '../strengthCoachViewModel';
import type { StrengthCoachScreenStyles } from '../screens/strengthCoachScreen.styles';

function MetricGrid({
  copy,
  metrics,
  styles,
}: {
  copy: StrengthCoachCopy;
  metrics: StrengthCoachMetricSummary;
  styles: StrengthCoachScreenStyles;
}) {
  const { formatNumber } = useLocalization();
  const { weight } = useUnitPreferences();
  const items = [
    {
      label: copy.completedSets,
      value: formatNumber(metrics.completedSets, { maximumFractionDigits: 0 }),
    },
    {
      label: copy.totalReps,
      value: formatNumber(metrics.totalReps, { maximumFractionDigits: 0 }),
    },
    {
      label: `${copy.tonnage} (${weight})`,
      value: formatNumber(weightFromKg(metrics.totalTonnage, weight), {
        maximumFractionDigits: 1,
      }),
    },
    {
      label: copy.averageRpe,
      value:
        metrics.averageActualRpe === null
          ? '—'
          : formatNumber(metrics.averageActualRpe, { maximumFractionDigits: 1 }),
    },
  ];

  return (
    <View style={styles.metricGrid}>
      {items.map((item) => (
        <View key={item.label} style={styles.metricCell}>
          <Text style={styles.metricValue}>{item.value}</Text>
          <Text style={styles.metricLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const getResultCopy = (copy: StrengthCoachCopy, viewModel: StrengthCoachViewModel) => {
  switch (viewModel.kind) {
    case 'pending':
      return {
        title: copy.analysisInProgressTitle,
        message: copy.analysisInProgressBody,
      };
    case 'failed':
      return {
        title: copy.resultUnavailableTitle,
        message: copy.resultUnavailableBody,
      };
    case 'rejected':
      return {
        title: copy.moreDataRequiredTitle,
        message: copy.moreDataRequiredBody,
      };
    case 'review':
      return {
        title: copy.workoutReviewTitle,
        message: copy.workoutReviewBody,
      };
    case 'proposal':
      return {
        title: copy.nextWorkoutProposalTitle,
        message: copy.nextWorkoutProposalBody,
      };
  }
};

export function StrengthCoachResultCard({
  copy,
  runStatus,
  styles,
  viewModel,
}: {
  copy: StrengthCoachCopy;
  runStatus: string;
  styles: StrengthCoachScreenStyles;
  viewModel: StrengthCoachViewModel;
}) {
  const { formatNumber } = useLocalization();
  const { weight } = useUnitPreferences();
  const resultCopy = getResultCopy(copy, viewModel);

  return (
    <AppCard>
      <View style={styles.resultHeader}>
        <Text style={styles.cardTitle}>{resultCopy.title}</Text>
        <Text style={styles.resultStatus}>{runStatus}</Text>
      </View>
      <Text style={styles.bodyText}>{resultCopy.message}</Text>

      {viewModel.kind === 'review' || viewModel.kind === 'proposal' ? (
        <MetricGrid copy={copy} metrics={viewModel.metrics} styles={styles} />
      ) : null}

      {viewModel.kind === 'proposal' ? (
        <View style={styles.proposalList}>
          <View style={styles.guardrailRow}>
            <Text style={styles.metaText}>{copy.guardrail}</Text>
            <Text style={styles.resultStatus}>
              {copy.guardrailLabel(viewModel.guardrailStatus)}
            </Text>
          </View>
          {viewModel.sets.map((set, index) => (
            <View key={`${set.sourceSetId}-${index}`} style={styles.proposalRow}>
              <View style={styles.proposalCopy}>
                <Text numberOfLines={1} style={styles.sessionTitle}>
                  {set.exerciseName}
                </Text>
                <Text style={styles.metaText}>
                  {formatNumber(weightFromKg(set.weight, weight), {
                    maximumFractionDigits: 1,
                  })}{' '}
                  {weight} × {copy.reps(
                    set.reps,
                    formatNumber(set.reps, { maximumFractionDigits: 0 }),
                  )}{' '}
                  · {copy.targetRpe} {formatNumber(set.targetRpe, { maximumFractionDigits: 1 })}
                </Text>
              </View>
              <Text style={styles.adjustmentLabel}>
                {copy.adjustmentLabel(set.adjustment)}{' '}
                {set.adjustmentPercent > 0 ? '+' : ''}
                {formatNumber(set.adjustmentPercent, { maximumFractionDigits: 1 })}%
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {viewModel.kind === 'rejected' || viewModel.kind === 'proposal' ? (
        viewModel.issues.length > 0 ? (
          <View style={styles.issueList}>
            <Text style={styles.issueText}>
              • {copy.deterministicIssues(
                viewModel.issues.length,
                formatNumber(viewModel.issues.length, { maximumFractionDigits: 0 }),
              )}
            </Text>
          </View>
        ) : null
      ) : null}
    </AppCard>
  );
}
