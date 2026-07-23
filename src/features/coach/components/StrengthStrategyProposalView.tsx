import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Colors, Radii, Spacing, Typography } from '@/constants/theme';
import type { StrengthStrategyDisplayViewModel } from '../strengthStrategyViewModel';

const formatNumber = (value: number, maximumFractionDigits = 1): string =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits }).format(value);

const formatCode = (value: string): string =>
  value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const formatDateTime = (value: string): string => {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

export function StrengthStrategyProposalView({
  confirmationEnabled,
  confirming,
  onConfirm,
  viewModel,
}: {
  confirmationEnabled: boolean;
  confirming: boolean;
  onConfirm(): void;
  viewModel: StrengthStrategyDisplayViewModel;
}) {
  const applied = viewModel.kind === 'applied';

  return (
    <View style={styles.stack}>
      <View style={applied ? styles.appliedBanner : styles.previewBanner}>
        <Text style={applied ? styles.appliedTitle : styles.previewTitle}>
          {applied ? 'Template created' : 'AI preview · not applied'}
        </Text>
        <Text style={styles.bodyText}>
          {applied
            ? 'The backend revalidated this proposal and created a new synchronized workout template. The completed source workout was not modified.'
            : confirmationEnabled
              ? 'This proposal passed deterministic source-set, load, repetition, RPE and total-volume validation. Confirmation creates a new workout template and does not edit workout history.'
              : 'This proposal passed deterministic validation. Strength confirmation is not available on this backend version.'}
        </Text>
        {applied ? (
          <View style={styles.appliedMetadata}>
            <Text style={styles.metaText}>Revision {viewModel.appliedRevision}</Text>
            <Text style={styles.metaText}>{formatDateTime(viewModel.appliedAt)}</Text>
            <Text numberOfLines={1} style={styles.auditText}>
              Template {viewModel.templateId}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{formatCode(viewModel.strategy)}</Text>
          <Text style={styles.metaText}>
            {viewModel.dataQuality} data · {formatNumber(viewModel.confidence * 100, 0)}% confidence
          </Text>
        </View>
        <Text style={styles.statusBadge}>{viewModel.guardrailStatus.toUpperCase()}</Text>
      </View>

      <View style={styles.metricRow}>
        <View style={styles.metricCell}>
          <Text style={styles.metricValue}>{formatNumber(viewModel.proposedTonnage, 0)}</Text>
          <Text style={styles.metaText}>Proposed kg</Text>
        </View>
        <View style={styles.metricCell}>
          <Text style={styles.metricValue}>
            {viewModel.volumeChangePercent === null
              ? '—'
              : `${viewModel.volumeChangePercent > 0 ? '+' : ''}${formatNumber(viewModel.volumeChangePercent)}%`}
          </Text>
          <Text style={styles.metaText}>Volume change</Text>
        </View>
        <View style={styles.metricCell}>
          <Text style={styles.metricValue}>{viewModel.sets.length}</Text>
          <Text style={styles.metaText}>Mapped sets</Text>
        </View>
      </View>

      <View style={styles.setList}>
        {viewModel.sets.map((set, index) => (
          <View key={set.sourceSetId} style={styles.setRow}>
            <View style={styles.setCopy}>
              <Text numberOfLines={1} style={styles.setTitle}>
                {index + 1}. {set.exerciseName}
              </Text>
              <Text style={styles.bodyText}>
                {formatNumber(set.weight)} kg × {set.reps} · target RPE {set.targetRpe}
              </Text>
              <Text style={styles.metaText}>{formatCode(set.rationaleCode)}</Text>
            </View>
            <Text style={styles.adjustment}>{set.adjustment.toUpperCase()}</Text>
          </View>
        ))}
      </View>

      <View style={styles.codeSection}>
        <Text style={styles.sectionTitle}>Rationale</Text>
        {viewModel.rationaleCodes.map((code) => (
          <Text key={code} style={styles.bodyText}>• {formatCode(code)}</Text>
        ))}
      </View>

      <View style={styles.codeSection}>
        <Text style={styles.sectionTitle}>Caveats</Text>
        {viewModel.caveatCodes.map((code) => (
          <Text key={code} style={styles.caveatText}>• {formatCode(code)}</Text>
        ))}
      </View>

      {viewModel.issues.length > 0 ? (
        <View style={styles.issueBox}>
          <Text style={styles.issueTitle}>Guardrail issues</Text>
          {viewModel.issues.map((issue) => (
            <Text key={`${issue.code}:${issue.path}`} style={styles.caveatText}>
              • {issue.message}
            </Text>
          ))}
        </View>
      ) : null}

      {!applied && confirmationEnabled ? (
        <View style={styles.confirmSection}>
          <PrimaryButton
            label="Create workout template"
            loading={confirming}
            onPress={onConfirm}
          />
          <Text style={styles.metaText}>
            Only the run ID and a new idempotency key are sent. The backend reloads and revalidates the saved proposal before creating the template.
          </Text>
        </View>
      ) : null}

      <Text style={styles.auditText}>
        {viewModel.provider} · {viewModel.model} · {viewModel.attempts} attempt{viewModel.attempts === 1 ? '' : 's'} · {viewModel.latencyMs} ms
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
