import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Colors, Radii, Spacing, Typography } from '@/constants/theme';
import { useLocalization } from '@/localization';
import type { StrengthCoachCopy } from '@/localization/strengthCoachCopy';
import { useUnitPreferences, weightFromKg } from '@/units';

import type { StrengthStrategyDisplayViewModel } from '../strengthStrategyViewModel';

export function StrengthStrategyProposalView({
  confirmationEnabled,
  confirming,
  copy,
  onConfirm,
  viewModel,
}: {
  confirmationEnabled: boolean;
  confirming: boolean;
  copy: StrengthCoachCopy;
  onConfirm(): void;
  viewModel: StrengthStrategyDisplayViewModel;
}) {
  const { formatDate, formatNumber } = useLocalization();
  const { weight } = useUnitPreferences();
  const applied = viewModel.kind === 'applied';

  return (
    <View style={styles.stack}>
      <View style={applied ? styles.appliedBanner : styles.previewBanner}>
        <Text style={applied ? styles.appliedTitle : styles.previewTitle}>
          {applied ? copy.templateCreated : copy.previewNotApplied}
        </Text>
        <Text style={styles.bodyText}>
          {applied
            ? copy.templateCreatedBody
            : confirmationEnabled
              ? copy.confirmationPreviewBody
              : copy.confirmationUnavailableBody}
        </Text>
        {applied ? (
          <View style={styles.appliedMetadata}>
            <Text style={styles.metaText}>
              {copy.revision} {formatNumber(viewModel.appliedRevision, { maximumFractionDigits: 0 })}
            </Text>
            <Text style={styles.metaText}>
              {formatDate(viewModel.appliedAt, { dateStyle: 'medium', timeStyle: 'short' })}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{copy.strategyLabel(viewModel.strategy)}</Text>
          <Text style={styles.metaText}>
            {copy.dataQuality}: {copy.dataQualityLabel(viewModel.dataQuality)} · {copy.confidence}:{' '}
            {formatNumber(viewModel.confidence * 100, { maximumFractionDigits: 0 })}%
          </Text>
        </View>
        <Text style={styles.statusBadge}>{copy.guardrailLabel(viewModel.guardrailStatus)}</Text>
      </View>

      <View style={styles.metricRow}>
        <View style={styles.metricCell}>
          <Text style={styles.metricValue}>
            {formatNumber(weightFromKg(viewModel.proposedTonnage, weight), {
              maximumFractionDigits: 1,
            })}
          </Text>
          <Text style={styles.metaText}>{copy.proposedVolume} ({weight})</Text>
        </View>
        <View style={styles.metricCell}>
          <Text style={styles.metricValue}>
            {viewModel.volumeChangePercent === null
              ? '—'
              : `${viewModel.volumeChangePercent > 0 ? '+' : ''}${formatNumber(
                  viewModel.volumeChangePercent,
                  { maximumFractionDigits: 1 },
                )}%`}
          </Text>
          <Text style={styles.metaText}>{copy.volumeChange}</Text>
        </View>
        <View style={styles.metricCell}>
          <Text style={styles.metricValue}>
            {formatNumber(viewModel.sets.length, { maximumFractionDigits: 0 })}
          </Text>
          <Text style={styles.metaText}>{copy.mappedSets}</Text>
        </View>
      </View>

      <View style={styles.setList}>
        {viewModel.sets.map((set, index) => (
          <View key={set.sourceSetId} style={styles.setRow}>
            <View style={styles.setCopy}>
              <Text numberOfLines={1} style={styles.setTitle}>
                {formatNumber(index + 1, { maximumFractionDigits: 0 })}. {set.exerciseName}
              </Text>
              <Text style={styles.bodyText}>
                {formatNumber(weightFromKg(set.weight, weight), { maximumFractionDigits: 1 })}{' '}
                {weight} × {copy.reps(
                  set.reps,
                  formatNumber(set.reps, { maximumFractionDigits: 0 }),
                )}{' '}
                · {copy.targetRpe} {formatNumber(set.targetRpe, { maximumFractionDigits: 1 })}
              </Text>
              <Text style={styles.metaText}>{copy.rationaleLabel(set.rationaleCode)}</Text>
            </View>
            <Text style={styles.adjustment}>{copy.adjustmentLabel(set.adjustment)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.codeSection}>
        <Text style={styles.sectionTitle}>{copy.rationale}</Text>
        {viewModel.rationaleCodes.map((code, index) => (
          <Text key={`${code}-${index}`} style={styles.bodyText}>
            • {copy.rationaleLabel(code)}
          </Text>
        ))}
      </View>

      <View style={styles.codeSection}>
        <Text style={styles.sectionTitle}>{copy.caveats}</Text>
        {viewModel.caveatCodes.map((code, index) => (
          <Text key={`${code}-${index}`} style={styles.caveatText}>
            • {copy.caveatLabel(code)}
          </Text>
        ))}
      </View>

      {viewModel.issues.length > 0 ? (
        <View style={styles.issueBox}>
          <Text style={styles.issueTitle}>{copy.guardrailIssues}</Text>
          {viewModel.issues.map((issue, index) => (
            <Text key={`${issue.code}:${issue.path}:${index}`} style={styles.caveatText}>
              • {copy.issueLabel(issue.code, issue.severity)}
            </Text>
          ))}
        </View>
      ) : null}

      {!applied && confirmationEnabled ? (
        <View style={styles.confirmSection}>
          <PrimaryButton label={copy.createTemplate} loading={confirming} onPress={onConfirm} />
          <Text style={styles.metaText}>{copy.confirmationExplanation}</Text>
        </View>
      ) : null}

      <Text style={styles.auditText}>
        {copy.validationAttempts(
          viewModel.attempts,
          formatNumber(viewModel.attempts, { maximumFractionDigits: 0 }),
        )}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  adjustment: {
    color: Colors.dark.accent,
    fontSize: Typography.caption.fontSize,
    fontWeight: '800',
  },
  appliedBanner: {
    backgroundColor: Colors.dark.successSoft,
    borderColor: Colors.dark.success,
    borderRadius: Radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.one,
    padding: Spacing.three,
  },
  appliedMetadata: {
    gap: 2,
    paddingTop: Spacing.one,
  },
  appliedTitle: {
    color: Colors.dark.success,
    fontSize: Typography.label.fontSize,
    fontWeight: '800',
  },
  auditText: {
    color: Colors.dark.textMuted,
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
  },
  bodyText: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
  },
  caveatText: {
    color: Colors.dark.warning,
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
  },
  codeSection: {
    gap: Spacing.one,
  },
  confirmSection: {
    gap: Spacing.two,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.three,
    justifyContent: 'space-between',
  },
  issueBox: {
    backgroundColor: Colors.dark.warningSoft,
    borderColor: Colors.dark.warning,
    borderRadius: Radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.one,
    padding: Spacing.three,
  },
  issueTitle: {
    color: Colors.dark.warning,
    fontSize: Typography.label.fontSize,
    fontWeight: '800',
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
  metricRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  metricValue: {
    color: Colors.dark.textPrimary,
    fontSize: 21,
    fontWeight: '800',
    lineHeight: 27,
  },
  previewBanner: {
    backgroundColor: Colors.dark.accentSoft,
    borderColor: Colors.dark.accent,
    borderRadius: Radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.one,
    padding: Spacing.three,
  },
  previewTitle: {
    color: Colors.dark.accent,
    fontSize: Typography.label.fontSize,
    fontWeight: '800',
  },
  sectionTitle: {
    color: Colors.dark.textPrimary,
    fontSize: Typography.label.fontSize,
    fontWeight: Typography.label.fontWeight,
  },
  setCopy: {
    flex: 1,
    minWidth: 0,
  },
  setList: {
    gap: Spacing.two,
  },
  setRow: {
    alignItems: 'center',
    borderTopColor: Colors.dark.borderSubtle,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: Spacing.three,
    paddingTop: Spacing.two,
  },
  setTitle: {
    color: Colors.dark.textPrimary,
    fontSize: Typography.bodyStrong.fontSize,
    fontWeight: Typography.bodyStrong.fontWeight,
    lineHeight: Typography.bodyStrong.lineHeight,
  },
  stack: {
    gap: Spacing.four,
  },
  statusBadge: {
    backgroundColor: Colors.dark.successSoft,
    borderRadius: Radii.pill,
    color: Colors.dark.success,
    fontSize: Typography.caption.fontSize,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  title: {
    color: Colors.dark.textPrimary,
    fontSize: Typography.cardTitle.fontSize,
    fontWeight: Typography.cardTitle.fontWeight,
    lineHeight: Typography.cardTitle.lineHeight,
  },
});
