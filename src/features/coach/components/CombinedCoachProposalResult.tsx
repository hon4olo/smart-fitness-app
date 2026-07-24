import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Radii, Spacing, Typography } from '@/constants/theme';
import { useAppTheme } from '@/theme/AppThemeProvider';
import type {
  CombinedCoachProposalViewModel,
  CombinedProposalTargets,
  CombinedSafetyRestriction,
} from '../combinedCoachProposalViewModel';

const formatTargets = (targets: CombinedProposalTargets | null): string =>
  targets
    ? `${targets.calories} kcal · P ${targets.protein} · C ${targets.carbs} · F ${targets.fats}`
    : '—';

const formatRestriction = (restriction: CombinedSafetyRestriction): string => {
  const movementCopy =
    restriction.movementPatterns.length > 0
      ? ` · ${restriction.movementPatterns.join(', ')}`
      : '';
  return `${restriction.action.replaceAll('_', ' ')} · max ${Math.round(
    restriction.maximumLoadMultiplier * 100,
  )}%${movementCopy}`;
};

const actionCopy: Record<string, string> = {
  review_strength_proposal: 'Review the Strength proposal separately',
  apply_safety_load_ceiling: 'Create a workout template with the Safety load ceiling',
  resolve_movement_restrictions: 'Resolve restricted movement patterns before using Strength',
  confirm_nutrition_target: 'Apply the Nutrition target as a separate revisioned action',
};

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
  if (viewModel.kind !== 'review') {
    return (
      <AppCard>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
          {viewModel.title}
        </Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}> 
          {viewModel.message}
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
            {viewModel.title}
          </Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}> 
            {viewModel.message}
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
          {viewModel.status.toUpperCase()}
        </Text>
      </View>

      <View style={styles.stack}>
        <View style={[styles.domainCard, { borderColor: colors.borderSubtle }]}> 
          <Text style={[styles.domainTitle, { color: colors.textPrimary }]}>Strength proposal</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}> 
            {viewModel.strength.sets.length} sets · proposed tonnage{' '}
            {viewModel.strength.proposedTonnage ?? '—'} kg
          </Text>
          {viewModel.strength.sets.slice(0, 4).map((set) => (
            <Text key={set.sourceSetId} style={[styles.meta, { color: colors.textMuted }]}> 
              {set.exerciseName}: {set.weight} kg × {set.reps} · RPE {set.targetRpe}
            </Text>
          ))}

          {effective ? (
            <View style={styles.stack}>
              <Text style={[styles.domainTitle, { color: colors.textPrimary }]}>Effective plan</Text>
              <Text style={[styles.body, { color: colors.textSecondary }]}> 
                Effective tonnage: {effective.effectiveTonnage ?? 'blocked'} kg · load ceiling{' '}
                {Math.round(effective.loadMultiplier * 100)}%
              </Text>
              {effective.sets.slice(0, 4).map((set) => (
                <Text key={set.sourceSetId} style={[styles.meta, { color: colors.textMuted }]}> 
                  {set.exerciseName}: proposed {set.proposedWeight} kg → effective{' '}
                  {set.effectiveWeight} kg · ceiling {set.maximumAllowedWeight} kg
                </Text>
              ))}
              {effective.unresolvedMovementPatterns.length > 0 ? (
                <Text style={[styles.body, { color: colors.warning }]}> 
                  Restricted movements unresolved:{' '}
                  {effective.unresolvedMovementPatterns.join(', ')}
                </Text>
              ) : null}
            </View>
          ) : null}

          {strengthApplication ? (
            <View style={[styles.application, { borderColor: colors.success }]}> 
              <Text style={[styles.domainTitle, { color: colors.success }]}> 
                Workout template created
              </Text>
              <Text style={[styles.meta, { color: colors.textMuted }]}> 
                Revision {strengthApplication.appliedRevision} · {strengthApplication.templateId}
              </Text>
            </View>
          ) : canConfirmEffectiveStrength ? (
            <PrimaryButton
              label="Create effective Strength template"
              loading={effectiveStrengthBusy}
              onPress={onConfirmEffectiveStrength}
            />
          ) : null}
        </View>

        <View style={[styles.domainCard, { borderColor: colors.borderSubtle }]}> 
          <Text style={[styles.domainTitle, { color: colors.textPrimary }]}>Nutrition target</Text>
          <Text style={[styles.meta, { color: colors.textMuted }]}>Current</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}> 
            {formatTargets(viewModel.nutrition.currentTargets)}
          </Text>
          <Text style={[styles.meta, { color: colors.textMuted }]}>Proposed</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}> 
            {formatTargets(viewModel.nutrition.proposedTargets)}
          </Text>

          {nutritionApplication ? (
            <View style={[styles.application, { borderColor: colors.success }]}> 
              <Text style={[styles.domainTitle, { color: colors.success }]}> 
                Nutrition target applied
              </Text>
              <Text style={[styles.meta, { color: colors.textMuted }]}> 
                Revision {nutritionApplication.appliedRevision} · {nutritionApplication.targetId}
              </Text>
            </View>
          ) : canConfirmNutrition ? (
            <PrimaryButton
              label="Apply Nutrition target"
              loading={nutritionBusy}
              onPress={onConfirmNutrition}
            />
          ) : null}
        </View>

        <View style={[styles.domainCard, { borderColor: colors.borderSubtle }]}> 
          <Text style={[styles.domainTitle, { color: colors.textPrimary }]}>Safety ceiling</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}> 
            Maximum Strength load: {Math.round(viewModel.maximumStrengthLoadMultiplier * 100)}%
          </Text>
          <Text style={[styles.meta, { color: colors.textMuted }]}> 
            {viewModel.safety.restrictionCount} restrictions · {viewModel.safety.issueCount}{' '}
            findings
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
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Pending actions</Text>
          {viewModel.pendingActions.map((action) => (
            <Text key={action} style={[styles.body, { color: colors.textSecondary }]}> 
              • {actionCopy[action] ?? action}
            </Text>
          ))}
        </View>
      ) : null}

      {viewModel.issues.length > 0 ? (
        <View style={styles.stack}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Guardrail findings</Text>
          {viewModel.issues.map((issue, index) => (
            <Text key={`${issue.code}:${index}`} style={[styles.body, { color: colors.warning }]}> 
              • {issue.message}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={[styles.boundary, { borderColor: colors.borderSubtle }]}> 
        <Text style={[styles.meta, { color: colors.textMuted }]}> 
          Strength and Nutrition are separate explicit actions. Creating a workout template never
          edits completed history; applying Nutrition never creates or changes a workout template.
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
