import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { CoachRunEnvelope } from '@/api/coach';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing, Typography } from '@/constants/theme';
import type { SupportedLocale } from '@/localization';
import { useAppTheme } from '@/theme/AppThemeProvider';
import { getCoachHistoryCopy } from '../coachHistoryCopy';

type Props = {
  run: CoachRunEnvelope;
  locale: SupportedLocale;
};

export function CoachRunTrustCard({ run, locale }: Props) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const copy = getCoachHistoryCopy(locale);

  if (run.trustValidationFailed) {
    return (
      <AppCard>
        <Text style={styles.cardTitle}>{copy.trust}</Text>
        <Text style={styles.body}>{copy.trustValidationFailed}</Text>
      </AppCard>
    );
  }

  if (!run.trust || run.trust.overallState === 'not_applicable') return null;

  return (
    <AppCard>
      <Text style={styles.cardTitle}>{copy.trust}</Text>
      <Text style={styles.body}>{copy.trustSummary(run.trust.overallState)}</Text>
      {run.trust.applications.map((application) => (
        <View key={application.key} style={styles.applicationBlock}>
          <Text style={styles.applicationTitle}>
            {copy.application(application.key)} · {copy.trustState(application.state)}
          </Text>
          <RevisionRow
            label={copy.proposalRevision}
            value={
              application.proposalRevision === null
                ? copy.revisionUnavailable
                : copy.revision(application.proposalRevision)
            }
            styles={styles}
          />
          {application.currentRevision === null ? null : (
            <RevisionRow
              label={copy.currentRevision}
              value={copy.revision(application.currentRevision)}
              styles={styles}
            />
          )}
        </View>
      ))}
    </AppCard>
  );
}

function RevisionRow({
  label,
  value,
  styles,
}: {
  label: string;
  value: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    applicationBlock: {
      borderTopColor: colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
      gap: Spacing.one,
      paddingTop: Spacing.two,
    },
    applicationTitle: {
      color: colors.textPrimary,
      fontSize: Typography.body.fontSize,
      fontWeight: '700',
    },
    body: {
      color: colors.textSecondary,
      fontSize: Typography.body.fontSize,
      lineHeight: Typography.body.lineHeight,
    },
    cardTitle: {
      color: colors.textPrimary,
      fontSize: Typography.cardTitle.fontSize,
      fontWeight: Typography.cardTitle.fontWeight,
    },
    label: {
      color: colors.textSecondary,
      flex: 1,
      fontSize: Typography.caption.fontSize,
    },
    row: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: Spacing.two,
      justifyContent: 'space-between',
    },
    value: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: Typography.caption.fontSize,
      textAlign: 'right',
    },
  });
