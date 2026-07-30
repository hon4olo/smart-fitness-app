import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Radii, Spacing, Typography } from '@/constants/theme';
import { useLocalization } from '@/localization';
import { getCombinedProposalCopy } from '@/localization/combinedProposalCopy';
import { getUserLimitationsCopy } from '@/localization/userLimitationsCopy';
import { useAppTheme } from '@/theme/AppThemeProvider';
import { formatEnergyValue, useUnitPreferences } from '@/units';
import type {
  CombinedCoachProposalViewModel,
  CombinedProposalTargets,
  CombinedSafetyRestriction,
} from '../combinedCoachProposalViewModel';

const lookupLabel = (labels: Record<string, string>, value: string): string =>
  labels[value] ?? value.toLowerCase().replaceAll('_', ' ');

export function CombinedCoachProposalResult({
  viewModel,
  canConfirmEffectiveStrength,
  effectiveStrengthBusy,
  onConfirmEffectiveStrength,
  canConfirmNutrition,
  nutritionBusy,
  onConfirmNutrition,
}: {
  viewModel: CombinedCoachProposalViewModel;
  canConfirmEffectiveStrength: boolean;
  effectiveStrengthBusy: boolean;
  onConfirmEffectiveStrength(): void;
  canConfirmNutrition: boolean;
  nutritionBusy: boolean;
  onConfirmNutrition(): void;
}) {
  const { colors } = useAppTheme();
  const { formatNumber, locale } = useLocalization();
  const { energy, formatWeightValue, weight } = useUnitPreferences();
  const copy = getCombinedProposalCopy(locale);
  const limitationCopy = getUserLimitationsCopy(locale);
  const presentation = copy.viewModelCopy(viewModel);

  const formatTargets = (targets: CombinedProposalTargets | null): string =>
    targets
      ? copy.targetSummary(
          formatEnergyValue(targets.calories, energy),
          energy,
          formatNumber(targets.protein, { maximumFractionDigits: 0 }),
          formatNumber(targets.carbs, { maximumFractionDigits: 0 }),
          formatNumber(targets.fats, { maximumFractionDigits: 0 }),
        )
      : '—';

  const formatRestriction = (restriction: CombinedSafetyRestriction): string => {
    const movements = restriction.movementPatterns
      .map((value) =>
        lookupLabel(limitationCopy.movementLabels as Record<string, string>, value),
      )
      .join(', ');
    return copy.restrictionSummary(
      copy.restrictionActionLabels[restriction.action],
      formatNumber(Math.round(restriction.maximumLoadMultiplier * 100), {
        maximumFractionDigits: 0,
      }),
      movements,
    );
  };

  if (viewModel.kind !== 'review') {
    return (
      <AppCard>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}> 
          {presentation.title}
        </Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}> 
          {presentation.message}
        </Text>
      </AppCard>
    );
  }

  const effective = viewModel.effectiveStrength;
  const strengthApplication = viewModel.effectiveStrengthApplication;
  const nutritionApplication = viewModel.nutritionApplication;

  return (
    <AppCard>
      <View style={styles.resultHeader}>
        <View style={styles.flexCopy}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}> 
            {presentation.title}
          </Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}> 
            {presentation.message}
          </Text>
        </View>
        <Text
          style={[
            styles.badge,
            {
              backgroundColor:
                viewModel.status === 'ready' ? colors.successSoft : colors.warningSoft,
              color: viewModel.status === 'ready' ? colors.success : colors.warning,
            },
          ]}> 
          {copy.statusLabels[viewModel.status]}
        </Text>
      </View>

      <View style={styles.stack}>
        <View style={[styles.domainCard, { borderColor: colors.borderSubtle }]}> 
          <Text style={[styles.domainTitle, { color: colors.textPrimary }]}>
            {copy.strengthProposal}
          </Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}> 
            {copy.setsAndTonnage(
              viewModel.strength.sets.length,
              formatNumber(viewModel.strength.sets.length, { maximumFractionDigits: 0 }),
              viewModel.strength.proposedTonnage === null
                ? '—'
                : formatWeightValue(viewModel.strength.proposedTonnage),
              weight,
            )}
          </Text>
          {viewModel.strength.sets.slice(0, 4).map((set) => (
            <Text key={set.sourceSetId} style={[styles.meta, { color: colors.textMuted }]}> 
              {set.exerciseName}: {formatWeightValue(set.weight)} {weight} ×{' '}
              {formatNumber(set.reps, { maximumFractionDigits: 0 })} · RPE{' '}
              {formatNumber(set.targetRpe, { maximumFractionDigits: 1 })}
            </Text>
          ))}

          {effective ? (
            <View style={styles.stack}>
              <Text style={[styles.domainTitle, { color: colors.textPrimary }]}> 
                {copy.effectivePlan}
              </Text>
              <Text style={[styles.body, { color: colors.textSecondary }]}> 
                {effective.effectiveTonnage === null
                  ? copy.blocked
                  : copy.effectiveTonnage(
                      formatWeightValue(effective.effectiveTonnage),
                      weight,
                      formatNumber(Math.round(effective.loadMultiplier * 100), {
                        maximumFractionDigits: 0,
                      }),
                    )}
              </Text>
              {effective.sets.slice(0, 4).map((set) => (
                <Text key={set.sourceSetId} style={[styles.meta, { color: colors.textMuted }]}> 
                  {copy.setProposal(
                    set.exerciseName,
                    formatWeightValue(set.proposedWeight),
                    formatWeightValue(set.effectiveWeight),
                    formatWeightValue(set.maximumAllowedWeight),
                    weight,
                  )}
                </Text>
              ))}
              {effective.unresolvedMovementPatterns.length > 0 ? (
                <Text style={[styles.body, { color: colors.warning }]}> 
                  {copy.restrictedUnresolved}:{' '}
                  {effective.unresolvedMovementPatterns
                    .map((value) =>
                      lookupLabel(
                        limitationCopy.movementLabels as Record<string, string>,
                        value,
                      ),
                    )
                    .join(', ')}
                </Text>
              ) : null}
            </View>
          ) : null}

          {strengthApplication ? (
            <View style={[styles.application, { borderColor: colors.success }]}> 
              <Text style={[styles.domainTitle, { color: colors.success }]}> 
                {copy.templateCreated}
              </Text>
              <Text style={[styles.meta, { color: colors.textMuted }]}> 
                {copy.revision}{' '}
                {formatNumber(strengthApplication.appliedRevision, {
                  maximumFractionDigits: 0,
                })}
              </Text>
            </View>
          ) : canConfirmEffectiveStrength ? (
            <PrimaryButton
              label={copy.createEffectiveTemplate}
              loading={effectiveStrengthBusy}
              onPress={onConfirmEffectiveStrength}
            />
          ) : null}
        </View>

        <View style={[styles.domainCard, { borderColor: colors.borderSubtle }]}> 
          <Text style={[styles.domainTitle, { color: colors.textPrimary }]}> 
            {copy.nutritionTarget}
          </Text>
          <Text style={[styles.meta, { color: colors.textMuted }]}>{copy.current}</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}> 
            {formatTargets(viewModel.nutrition.currentTargets)}
          </Text>
          <Text style={[styles.meta, { color: colors.textMuted }]}>{copy.proposed}</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}> 
            {formatTargets(viewModel.nutrition.proposedTargets)}
          </Text>

          {nutritionApplication ? (
            <View style={[styles.application, { borderColor: colors.success }]}> 
              <Text style={[styles.domainTitle, { color: colors.success }]}> 
                {copy.targetApplied}
              </Text>
              <Text style={[styles.meta, { color: colors.textMuted }]}> 
                {copy.revision}{' '}
                {formatNumber(nutritionApplication.appliedRevision, {
                  maximumFractionDigits: 0,
                })}
              </Text>
            </View>
          ) : canConfirmNutrition ? (
            <PrimaryButton
              label={copy.applyNutritionTarget}
              loading={nutritionBusy}
              onPress={onConfirmNutrition}
            />
          ) : null}
        </View>

        <View style={[styles.domainCard, { borderColor: colors.borderSubtle }]}> 
          <Text style={[styles.domainTitle, { color: colors.textPrimary }]}> 
            {copy.safetyCeiling}
          </Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}> 
            {copy.maximumStrengthLoad(
              formatNumber(Math.round(viewModel.maximumStrengthLoadMultiplier * 100), {
                maximumFractionDigits: 0,
              }),
            )}
          </Text>
          <Text style={[styles.meta, { color: colors.textMuted }]}> 
            {copy.restrictionsAndFindings(
              viewModel.safety.restrictionCount,
              formatNumber(viewModel.safety.restrictionCount, { maximumFractionDigits: 0 }),
              viewModel.safety.issueCount,
              formatNumber(viewModel.safety.issueCount, { maximumFractionDigits: 0 }),
            )}
          </Text>
          {viewModel.safety.restrictions.slice(0, 4).map((restriction) => (
            <Text
              key={restriction.limitationId}
              style={[styles.meta, { color: colors.textMuted }]}> 
              • {formatRestriction(restriction)}
            </Text>
          ))}
        </View>
      </View>

      {viewModel.pendingActions.length > 0 ? (
        <View style={styles.stack}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}> 
            {copy.pendingActions}
          </Text>
          {viewModel.pendingActions.map((action) => (
            <Text key={action} style={[styles.body, { color: colors.textSecondary }]}> 
              • {copy.actionLabels[action]}
            </Text>
          ))}
        </View>
      ) : null}

      {viewModel.issues.length > 0 ? (
        <View style={styles.stack}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}> 
            {copy.guardrailFindings}
          </Text>
          {viewModel.issues.map((issue, index) => (
            <View key={`${issue.code}:${index}`}>
              <Text style={[styles.meta, { color: colors.warning }]}> 
                {copy.issueSummary(issue)}
              </Text>
              <Text style={[styles.body, { color: colors.textSecondary }]}> 
                {copy.issueMessage}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={[styles.boundary, { borderColor: colors.borderSubtle }]}> 
        <Text style={[styles.meta, { color: colors.textMuted }]}> 
          {copy.boundary}
        </Text>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  application: {
    borderRadius: Radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
    padding: Spacing.two,
  },
  badge: {
    borderRadius: 999,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
  },
  body: {
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
  },
  boundary: {
    borderRadius: Radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.two,
  },
  cardTitle: {
    fontSize: Typography.cardTitle.fontSize,
    fontWeight: Typography.cardTitle.fontWeight,
    lineHeight: Typography.cardTitle.lineHeight,
  },
  domainCard: {
    borderRadius: Radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
    padding: Spacing.two,
  },
  domainTitle: {
    fontSize: Typography.label.fontSize,
    fontWeight: '900',
  },
  flexCopy: { flex: 1, minWidth: 0 },
  meta: {
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
  },
  resultHeader: { alignItems: 'flex-start', flexDirection: 'row', gap: Spacing.two },
  sectionTitle: { fontSize: Typography.label.fontSize, fontWeight: '900' },
  stack: { gap: Spacing.one },
});
