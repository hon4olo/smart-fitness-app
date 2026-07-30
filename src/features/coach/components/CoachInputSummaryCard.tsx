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
import type { SupportedLocale } from '@/localization';

import { getCoachHistoryCopy } from '../coachHistoryCopy';

type CoachInputSummaryCardProps = {
  summary?: CoachRunInputSummary;
  invalid?: boolean;
  locale: SupportedLocale;
};

const yesNo = (value: boolean, locale: SupportedLocale): string =>
  locale === 'ru' ? (value ? 'Да' : 'Нет') : value ? 'Yes' : 'No';

const count = (value: number, locale: SupportedLocale): string =>
  new Intl.NumberFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    maximumFractionDigits: 0,
  }).format(value);

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
  locale,
}: {
  source: NutritionInputCoverage;
  locale: SupportedLocale;
}) {
  const copy = getCoachHistoryCopy(locale);
  return (
    <>
      <Row
        label={copy.inputLookback}
        value={source.lookbackDays === null ? copy.notRecorded : copy.days(source.lookbackDays)}
      />
      <Row label={copy.inputFoodEntries} value={count(source.foodEntryCount, locale)} />
      <Row label={copy.inputLoggedDays} value={count(source.loggedDayCount, locale)} />
      <Row label={copy.inputWeightEntries} value={count(source.weightEntryCount, locale)} />
      <Row label={copy.inputLatestWeight} value={yesNo(source.hasLatestWeight, locale)} />
      <Row label={copy.inputActiveTarget} value={yesNo(source.hasActiveTarget, locale)} />
      <Row label={copy.inputFitnessProfile} value={yesNo(source.hasFitnessProfile, locale)} />
    </>
  );
}

function StrengthRows({
  source,
  locale,
}: {
  source: StrengthInputCoverage;
  locale: SupportedLocale;
}) {
  const copy = getCoachHistoryCopy(locale);
  return (
    <>
      <Row
        label={copy.inputSpecificSession}
        value={yesNo(source.requestedSpecificSession, locale)}
      />
      <Row
        label={copy.inputHistoryLimit}
        value={
          source.requestedHistoryLimit === null
            ? copy.notRecorded
            : count(source.requestedHistoryLimit, locale)
        }
      />
      <Row label={copy.inputSessions} value={count(source.sessionCount, locale)} />
      <Row label={copy.inputCompletedSets} value={count(source.completedSetCount, locale)} />
      <Row label={copy.inputExercises} value={count(source.distinctExerciseCount, locale)} />
      <Row label={copy.inputRpeSets} value={count(source.setsWithActualRpeCount, locale)} />
      <Row label={copy.inputLatestWeight} value={yesNo(source.hasLatestWeight, locale)} />
    </>
  );
}

function SafetyRows({
  source,
  locale,
}: {
  source: SafetyRecoveryInputCoverage;
  locale: SupportedLocale;
}) {
  const copy = getCoachHistoryCopy(locale);
  return (
    <>
      <Row
        label={copy.inputLookback}
        value={source.lookbackDays === null ? copy.notRecorded : copy.days(source.lookbackDays)}
      />
      <Row label={copy.inputLimitations} value={count(source.activeLimitationCount, locale)} />
      <Row label={copy.inputPauseTraining} value={count(source.pauseTrainingCount, locale)} />
      <Row label={copy.inputAvoidMovement} value={count(source.avoidMovementCount, locale)} />
      <Row label={copy.inputReduceLoad} value={count(source.reduceLoadCount, locale)} />
      <Row label={copy.inputCheckIns} value={count(source.recoveryCheckInCount, locale)} />
      <Row
        label={copy.inputLimitationNotes}
        value={count(source.limitationNotesPresentCount, locale)}
      />
      <Row
        label={copy.inputCheckInNotes}
        value={count(source.checkInNotesPresentCount, locale)}
      />
    </>
  );
}

function SourceRows({
  source,
  locale,
}: {
  source: CoachInputCoverage;
  locale: SupportedLocale;
}) {
  const copy = getCoachHistoryCopy(locale);
  if (!source.available) {
    return <Text style={styles.notice}>{copy.inputSourceUnavailable}</Text>;
  }
  if (source.domain === 'nutrition') {
    return <NutritionRows source={source} locale={locale} />;
  }
  if (source.domain === 'strength') {
    return <StrengthRows source={source} locale={locale} />;
  }
  return <SafetyRows source={source} locale={locale} />;
}

export function CoachInputSummaryCard({
  summary,
  invalid = false,
  locale,
}: CoachInputSummaryCardProps) {
  const copy = getCoachHistoryCopy(locale);
  if (!invalid && (!summary || summary.sources.length === 0)) return null;

  return (
    <AppCard>
      <Text style={styles.title}>{copy.inputSummary}</Text>
      <Text style={styles.description}>{copy.inputSummaryDescription}</Text>
      {invalid ? (
        <Text style={styles.notice}>{copy.inputSummaryUnavailable}</Text>
      ) : (
        summary?.sources.map((source) => (
          <View key={source.domain} style={styles.sourceBlock}>
            <Text style={styles.sourceTitle}>{copy.inputDomain(source.domain)}</Text>
            <SourceRows source={source} locale={locale} />
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
