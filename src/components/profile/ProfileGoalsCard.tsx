import { Text } from 'react-native';

import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { FormField } from '@/components/ui/FormField';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing, Typography } from '@/constants/theme';

type ProfileGoalsCardProps = {
  goalType: 'lose_fat' | 'maintain' | 'gain_muscle';
  isSaveDisabled: boolean;
  onGoalTypeChange: (goalType: 'lose_fat' | 'maintain' | 'gain_muscle') => void;
  onSaveGoals: () => void;
  onTargetWeightChange: (value: string) => void;
  onTrainingDaysPerWeekChange: (value: string) => void;
  onWeeklyWeightChangeGoalChange: (value: string) => void;
  targetWeight: string;
  trainingDaysPerWeek: string;
  weeklyWeightChangeGoal: string;
};

const goalOptions = [
  { label: 'Lose fat', value: 'lose_fat' as const },
  { label: 'Maintain', value: 'maintain' as const },
  { label: 'Gain muscle', value: 'gain_muscle' as const },
];

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
  weeklyWeightChangeGoal,
}: ProfileGoalsCardProps) {
  return (
    <AppCard>
      <Text style={styles.sectionTitle}>Goals</Text>

      <FormField keyboardType="decimal-pad" label="Target weight (kg)" onChangeText={onTargetWeightChange} placeholder="75" textContentType="none" value={targetWeight} />
      <FormField keyboardType="decimal-pad" label="Weekly weight change goal (kg/week)" onChangeText={onWeeklyWeightChangeGoalChange} placeholder="0.25" textContentType="none" value={weeklyWeightChangeGoal} />
      <FormField keyboardType="number-pad" label="Training days per week" onChangeText={onTrainingDaysPerWeekChange} placeholder="3" textContentType="none" value={trainingDaysPerWeek} />

      <Text style={styles.goalLabel}>Primary goal</Text>
      <SegmentedControl accessibilityLabel="Primary goal" onChange={onGoalTypeChange} options={goalOptions} value={goalType} />

      <PrimaryButton disabled={isSaveDisabled} label="Save goals" onPress={onSaveGoals} />
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
