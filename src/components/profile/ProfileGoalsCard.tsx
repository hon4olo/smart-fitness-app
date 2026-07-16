import { Text } from 'react-native';

import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { FormField } from '@/components/ui/FormField';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing, Typography } from '@/constants/theme';

type ProfileGoalsCardProps = {
  goalType: 'lose_fat' | 'maintain' | 'gain_muscle';
  isSaveDisabled: boolean;
  latestWeightLabel: string;
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
  latestWeightLabel,
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
      <Text style={styles.helpText}>These numbers shape the app’s training and nutrition targets.</Text>

      <Text style={styles.summaryLabel}>Current logged weight</Text>
      <Text style={styles.summaryValue}>{latestWeightLabel}</Text>

      <FormField
        keyboardType="decimal-pad"
        label="Target weight (kg)"
        onChangeText={onTargetWeightChange}
        placeholder="75"
        textContentType="none"
        value={targetWeight}
      />

      <FormField
        keyboardType="decimal-pad"
        label="Weekly weight change goal (kg/week)"
        onChangeText={onWeeklyWeightChangeGoalChange}
        placeholder="0.25"
        textContentType="none"
        value={weeklyWeightChangeGoal}
      />

      <FormField
        keyboardType="number-pad"
        label="Training days per week"
        onChangeText={onTrainingDaysPerWeekChange}
        placeholder="3"
        textContentType="none"
        value={trainingDaysPerWeek}
      />

      <Text style={styles.goalLabel}>Primary goal</Text>
      <Text style={styles.helpTextCompact}>Pick the closest match to your current phase.</Text>
      <SegmentedControl
        accessibilityLabel="Primary goal"
        onChange={onGoalTypeChange}
        options={goalOptions}
        value={goalType}
      />

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
  helpText: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
    marginBottom: Spacing.two,
  },
  helpTextCompact: {
    color: Colors.dark.textMuted,
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
  },
  sectionTitle: {
    color: Colors.dark.text,
    fontSize: Typography.sectionTitle.fontSize,
    fontWeight: Typography.sectionTitle.fontWeight,
    letterSpacing: Typography.sectionTitle.letterSpacing,
    lineHeight: Typography.sectionTitle.lineHeight,
    textTransform: Typography.sectionTitle.textTransform,
  },
  summaryLabel: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.caption.fontWeight,
    lineHeight: Typography.caption.lineHeight,
  },
  summaryValue: {
    color: Colors.dark.text,
    fontSize: Typography.bodyStrong.fontSize,
    fontWeight: Typography.bodyStrong.fontWeight,
    lineHeight: Typography.bodyStrong.lineHeight,
    marginBottom: Spacing.two,
  },
};
