import { Text } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { FormField } from '@/components/ui/FormField';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { getGoalTypeLabel } from '@/features/progress/progressLocalization';
import { useLocalization } from '@/localization';
import type { WeightUnit } from '@/units';

type GoalType = 'lose_fat' | 'maintain' | 'gain_muscle';

type ProfileGoalsValidationErrors = {
  targetWeight?: string;
  trainingDays?: string;
  weeklyWeightChange?: string;
};

type ProfileGoalsCardProps = {
  goalType: GoalType;
  isSaveDisabled: boolean;
  onGoalTypeChange: (goalType: GoalType) => void;
  onSaveGoals: () => void;
  onTargetWeightChange: (value: string) => void;
  onTrainingDaysPerWeekChange: (value: string) => void;
  onWeeklyWeightChangeGoalChange: (value: string) => void;
  targetWeight: string;
  trainingDaysPerWeek: string;
  validationErrors: ProfileGoalsValidationErrors;
  weeklyWeightChangeGoal: string;
  weightUnit: WeightUnit;
};

export function ProfileGoalsCard({
  goalType,
  isSaveDisabled,
  onGoalTypeChange,
  onSaveGoals,
  onTargetWeightChange,
  onTrainingDaysPerWeekChange,
  onWeeklyWeightChangeGoalChange,
  targetWeight,
  trainingDaysPerWeek,
  validationErrors,
  weeklyWeightChangeGoal,
  weightUnit,
}: ProfileGoalsCardProps) {
  const { t } = useLocalization();
  const goalOptions = [
    { label: getGoalTypeLabel(t, 'lose_fat'), value: 'lose_fat' as const },
    { label: getGoalTypeLabel(t, 'maintain'), value: 'maintain' as const },
    { label: getGoalTypeLabel(t, 'gain_muscle'), value: 'gain_muscle' as const },
  ];
  const saveAccessibilityHint =
    validationErrors.targetWeight ??
    validationErrors.weeklyWeightChange ??
    validationErrors.trainingDays;

  return (
    <AppCard>
      <Text style={styles.sectionTitle}>{t('goals.cardTitle')}</Text>
      <FormField
        errorMessage={validationErrors.targetWeight}
        keyboardType="decimal-pad"
        label={t('goals.targetWeight', { unit: weightUnit })}
        onChangeText={onTargetWeightChange}
        placeholder={weightUnit === 'lb' ? '165' : '75'}
        textContentType="none"
        value={targetWeight}
      />
      <FormField
        errorMessage={validationErrors.weeklyWeightChange}
        keyboardType="decimal-pad"
        label={t('goals.weeklyWeightChange', { unit: weightUnit })}
        onChangeText={onWeeklyWeightChangeGoalChange}
        placeholder={weightUnit === 'lb' ? '0.5' : '0.25'}
        textContentType="none"
        value={weeklyWeightChangeGoal}
      />
      <FormField
        errorMessage={validationErrors.trainingDays}
        keyboardType="number-pad"
        label={t('goals.trainingDays')}
        onChangeText={onTrainingDaysPerWeekChange}
        placeholder="3"
        textContentType="none"
        value={trainingDaysPerWeek}
      />
      <Text style={styles.goalLabel}>{t('goals.primaryGoal')}</Text>
      <SegmentedControl
        accessibilityLabel={t('goals.primaryGoal')}
        onChange={onGoalTypeChange}
        options={goalOptions}
        value={goalType}
      />
      <PrimaryButton
        accessibilityHint={isSaveDisabled ? saveAccessibilityHint : undefined}
        disabled={isSaveDisabled}
        label={t('goals.save')}
        onPress={onSaveGoals}
      />
    </AppCard>
  );
}

const styles = {
  goalLabel: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.caption.fontWeight,
    lineHeight: Typography.caption.lineHeight,
  },
  sectionTitle: {
    color: Colors.dark.textPrimary,
    fontSize: Typography.cardTitle.fontSize,
    fontWeight: Typography.cardTitle.fontWeight,
    lineHeight: Typography.cardTitle.lineHeight,
    marginBottom: Spacing.two,
  },
};