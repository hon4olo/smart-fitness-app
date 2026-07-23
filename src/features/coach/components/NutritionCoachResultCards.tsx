import { Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';

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
  deterministicSummary,
  rejectionCopy,
  runStatus,
  styles,
  viewModel,
}: {
  deterministicSummary: NutritionDeterministicSummary | null;
  rejectionCopy: NutritionRejectionCopy | null;
  runStatus: string;
  styles: NutritionCoachScreenStyles;
  viewModel: NutritionCoachViewModel;
}) {
  return (
    <AppCard>
      <View style={styles.resultHeader}>
        <Text style={styles.cardTitle}>{rejectionCopy?.title ?? viewModel.title}</Text>
        <Text style={styles.resultStatus}>{runStatus}</Text>
      </View>
      <Text style={styles.bodyText}>{rejectionCopy?.message ?? viewModel.message}</Text>

      {viewModel.kind === 'review' ? (
        <NutritionCoachReviewMetrics metrics={viewModel.metrics} styles={styles} />
      ) : null}

      {deterministicSummary ? (
        <NutritionDeterministicSummaryView summary={deterministicSummary} />
      ) : null}

      {viewModel.kind === 'rejected' ? (
        <View style={styles.resultStack}>
          <Text style={styles.warningText}>Reason: {viewModel.reason}</Text>
          {viewModel.metrics ? (
            <View style={styles.infoRow}>
              <Text style={styles.metaText}>Tracked days</Text>
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
  deterministicSummary,
  onConfirm,
  runStatus,
  styles,
  viewModel,
}: {
  confirmationSupported: boolean;
  confirming: boolean;
  deterministicSummary: NutritionDeterministicSummary | null;
  onConfirm(): void;
  runStatus: string;
  styles: NutritionCoachScreenStyles;
  viewModel: NutritionStrategyViewModel;
}) {
  return (
    <AppCard>
      <View style={styles.resultHeader}>
        <Text style={styles.cardTitle}>{viewModel.title}</Text>
        <Text style={styles.resultStatus}>{runStatus}</Text>
      </View>
      <Text style={styles.bodyText}>{viewModel.message}</Text>

      {deterministicSummary ? (
        <NutritionDeterministicSummaryView summary={deterministicSummary} />
      ) : null}

      {viewModel.kind === 'proposal' || viewModel.kind === 'applied' ? (
        <NutritionStrategyProposalView
          confirmationSupported={confirmationSupported}
          confirming={confirming}
          onConfirm={onConfirm}
          viewModel={viewModel}
        />
      ) : null}

      {viewModel.kind === 'rejected' ? (
        <View style={styles.resultStack}>
          <Text style={styles.warningText}>Reason: {viewModel.reason}</Text>
          {viewModel.issues.map((issue) => (
            <Text key={`${issue.code}:${issue.path}`} style={styles.issueText}>
              • {issue.message}
            </Text>
          ))}
        </View>
      ) : null}
    </AppCard>
  );
}
