import { Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import type { NutritionCoachCopy } from '@/localization/nutritionCoachCopy';

import { NutritionDeterministicSummaryView } from './NutritionDeterministicSummaryView';
import { NutritionCoachReviewMetrics } from './NutritionCoachReviewMetrics';
import { NutritionStrategyProposalView } from './NutritionStrategyProposalView';
import type {
  NutritionDeterministicSummary,
  NutritionRejectionCopy,
} from '../nutritionDeterministicSummary';
import type { NutritionCoachViewModel } from '../nutritionCoachViewModel';
import type { NutritionStrategyViewModel } from '../nutritionStrategyViewModel';
import type { NutritionCoachScreenStyles } from '../screens/nutritionCoachScreen.styles';

export function NutritionCoachReviewResultCard({
  copy,
  deterministicSummary,
  rejectionCopy: _rejectionCopy,
  runStatus,
  styles,
  viewModel,
}: {
  copy: NutritionCoachCopy;
  deterministicSummary: NutritionDeterministicSummary | null;
  rejectionCopy: NutritionRejectionCopy | null;
  runStatus: string;
  styles: NutritionCoachScreenStyles;
  viewModel: NutritionCoachViewModel;
}) {
  const title = viewModel.kind === 'review' ? copy.validatedAnalysis : copy.resultUnavailable;
  const message = viewModel.kind === 'review' ? copy.validatedBody : copy.resultUnavailableBody;

  return (
    <AppCard>
      <View style={styles.resultHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.resultStatus}>{runStatus}</Text>
      </View>
      <Text style={styles.bodyText}>{message}</Text>

      {viewModel.kind === 'review' ? (
        <NutritionCoachReviewMetrics copy={copy} metrics={viewModel.metrics} styles={styles} />
      ) : null}

      {deterministicSummary ? (
        <NutritionDeterministicSummaryView summary={deterministicSummary} />
      ) : null}

      {viewModel.kind === 'rejected' ? (
        <View style={styles.resultStack}>
          <Text style={styles.warningText}>{copy.typedReason}</Text>
          {viewModel.metrics ? (
            <View style={styles.infoRow}>
              <Text style={styles.metaText}>{copy.trackedDays}</Text>
              <Text style={styles.infoValue}>
                {viewModel.metrics.completeness.trackedDays} /{' '}
                {viewModel.metrics.period.lookbackDays}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </AppCard>
  );
}

export function NutritionCoachStrategyResultCard({
  confirmationSupported,
  confirming,
  copy,
  deterministicSummary,
  onConfirm,
  runStatus,
  styles,
  viewModel,
}: {
  confirmationSupported: boolean;
  confirming: boolean;
  copy: NutritionCoachCopy;
  deterministicSummary: NutritionDeterministicSummary | null;
  onConfirm(): void;
  runStatus: string;
  styles: NutritionCoachScreenStyles;
  viewModel: NutritionStrategyViewModel;
}) {
  const hasResult = viewModel.kind === 'proposal' || viewModel.kind === 'applied';

  return (
    <AppCard>
      <View style={styles.resultHeader}>
        <Text style={styles.cardTitle}>
          {hasResult ? copy.strategy : copy.resultUnavailable}
        </Text>
        <Text style={styles.resultStatus}>{runStatus}</Text>
      </View>
      <Text style={styles.bodyText}>
        {hasResult ? copy.confirmationBody : copy.resultUnavailableBody}
      </Text>

      {deterministicSummary ? (
        <NutritionDeterministicSummaryView summary={deterministicSummary} />
      ) : null}

      {hasResult ? (
        <NutritionStrategyProposalView
          confirmationSupported={confirmationSupported}
          confirming={confirming}
          copy={copy}
          onConfirm={onConfirm}
          viewModel={viewModel}
        />
      ) : null}

      {viewModel.kind === 'rejected' ? (
        <View style={styles.resultStack}>
          <Text style={styles.warningText}>{copy.typedReason}</Text>
          {viewModel.issues.map((issue) => (
            <Text key={`${issue.code}:${issue.path}`} style={styles.issueText}>
              • {copy.typedIssue}
            </Text>
          ))}
        </View>
      ) : null}
    </AppCard>
  );
}
