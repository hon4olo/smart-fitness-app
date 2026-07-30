import { StyleSheet, Text, View } from 'react-native';

import type {
  CoachInputCoverage,
  CoachRunInputSummary,
  NutritionInputCoverage,
  SafetyRecoveryInputCoverage,
  StrengthInputCoverage,
} from '@/api/coach';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useLocalization } from '@/localization';

import { getCoachInputSummaryCopy } from '../coachInputSummaryCopy';

type CoachInputSummaryCardProps = {
  summary?: CoachRunInputSummary;
  invalid?: boolean;
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function NutritionRows({
  source,
  copy,
  formatCount,
}: {
  source: NutritionInputCoverage;
  copy: ReturnType<typeof getCoachInputSummaryCopy>;
  formatCount: (value: number) => string;
}) {
  return (
    <>
      <Row
        label={copy.lookback}
        value={source.lookbackDays === null ? copy.notRecorded : copy.days(source.lookbackDays)}
      />
      <Row label={copy.foodEntries} value={formatCount(source.foodEntryCount)} />
      <Row label={copy.loggedDays} value={formatCount(source.loggedDayCount)} />
      <Row label={copy.weightEntries} value={formatCount(source.weightEntryCount)} />
      <Row label={copy.latestWeight} value={source.hasLatestWeight ? copy.yes : copy.no} />
      <Row label={copy.activeTarget} value={source.hasActiveTarget ? copy.yes : copy.no} />
      <Row label={copy.fitnessProfile} value={source.hasFitnessProfile ? copy.yes : copy.no} />
    </>
  );
}

function StrengthRows({
  source,
  copy,
  formatCount,
}: {
  source: StrengthInputCoverage;
  copy: ReturnType<typeof getCoachInputSummaryCopy>;
  formatCount: (value: number) => string;
}) {
  return (
    <>
      <Row
        label={copy.specificSession}
        value={source.requestedSpecificSession ? copy.yes : copy.no}
      />
      <Row
        label={copy.historyLimit}
        value={
          source.requestedHistoryLimit === null
            ? copy.notRecorded
            : formatCount(source.requestedHistoryLimit)
        }
      />
      <Row label={copy.sessions} value={formatCount(source.sessionCount)} />
      <Row label={copy.completedSets} value={formatCount(source.completedSetCount)} />
      <Row label={copy.exercises} value={formatCount(source.distinctExerciseCount)} />
      <Row label={copy.rpeSets} value={formatCount(source.setsWithActualRpeCount)} />
      <Row label={copy.latestWeight} value={source.hasLatestWeight ? copy.yes : copy.no} />
    </>
  );
}

function SafetyRows({
  source,
  copy,
  formatCount,
}: {
  source: SafetyRecoveryInputCoverage;
  copy: ReturnType<typeof getCoachInputSummaryCopy>;
  formatCount: (value: number) => string;
}) {
  return (
    <>
      <Row
        label={copy.lookback}
        value={source.lookbackDays === null ? copy.notRecorded : copy.days(source.lookbackDays)}
      />
      <Row label={copy.limitations} value={formatCount(source.activeLimitationCount)} />
      <Row label={copy.pauseTraining} value={formatCount(source.pauseTrainingCount)} />
      <Row label={copy.avoidMovement} value={formatCount(source.avoidMovementCount)} />
      <Row label={copy.reduceLoad} value={formatCount(source.reduceLoadCount)} />
      <Row label={copy.checkIns} value={formatCount(source.recoveryCheckInCount)} />
      <Row
        label={copy.limitationNotes}
        value={formatCount(source.limitationNotesPresentCount)}
      />
      <Row
        label={copy.checkInNotes}
        value={formatCount(source.checkInNotesPresentCount)}
      />
    </>
  );
}

function SourceRows({
  source,
  copy,
  formatCount,
}: {
  source: CoachInputCoverage;
  copy: ReturnType<typeof getCoachInputSummaryCopy>;
  formatCount: (value: number) => string;
}) {
  if (!source.available) {
    return <Text style={styles.notice}>{copy.sourceUnavailable}</Text>;
  }
  if (source.domain === 'nutrition') {
    return <NutritionRows source={source} copy={copy} formatCount={formatCount} />;
  }
  if (source.domain === 'strength') {
    return <StrengthRows source={source} copy={copy} formatCount={formatCount} />;
  }
  return <SafetyRows source={source} copy={copy} formatCount={formatCount} />;
}

export function CoachInputSummaryCard({
  summary,
  invalid = false,
}: CoachInputSummaryCardProps) {
  const { locale, formatNumber } = useLocalization();
  const copy = getCoachInputSummaryCopy(locale);
  if (!invalid && (!summary || summary.sources.length === 0)) return null;

  const formatCount = (value: number) =>
    formatNumber(value, { maximumFractionDigits: 0 });

  return (
    <AppCard>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.description}>{copy.description}</Text>
      {invalid ? (
        <Text style={styles.notice}>{copy.unavailable}</Text>
      ) : (
        summary?.sources.map((source) => (
          <View key={source.domain} style={styles.sourceBlock}>
            <Text style={styles.sourceTitle}>{copy.domain(source.domain)}</Text>
            <SourceRows source={source} copy={copy} formatCount={formatCount} />
          </View>
        ))
      )}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  description: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
  },
  label: {
    color: Colors.dark.textSecondary,
    flex: 1,
    fontSize: Typography.caption.fontSize,
  },
  notice: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
  },
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  sourceBlock: {
    borderTopColor: Colors.dark.borderSubtle,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.one,
    paddingTop: Spacing.two,
  },
  sourceTitle: {
    color: Colors.dark.textPrimary,
    fontSize: Typography.body.fontSize,
    fontWeight: '700',
  },
  title: {
    color: Colors.dark.textPrimary,
    fontSize: Typography.cardTitle.fontSize,
    fontWeight: Typography.cardTitle.fontWeight,
  },
  value: {
    color: Colors.dark.textPrimary,
    flex: 1,
    fontSize: Typography.caption.fontSize,
    textAlign: 'right',
  },
});
