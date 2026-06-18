import { Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing } from '@/constants/theme';

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
      <Text style={styles.helpText}>Update targets used by nutrition and coaching.</Text>

      <View style={styles.goalSummaryRow}>
        <Text style={styles.label}>Latest logged weight</Text>
        <Text style={styles.value}>{latestWeightLabel}</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Target weight</Text>
        <TextInput
          keyboardType="decimal-pad"
          onChangeText={onTargetWeightChange}
          placeholder="75"
          placeholderTextColor={Colors.dark.textSecondary}
          style={styles.input}
          value={targetWeight}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Weekly weight change goal</Text>
        <TextInput
          keyboardType="decimal-pad"
          onChangeText={onWeeklyWeightChangeGoalChange}
          placeholder="0.25"
          placeholderTextColor={Colors.dark.textSecondary}
          style={styles.input}
          value={weeklyWeightChangeGoal}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Training days per week</Text>
        <TextInput
          keyboardType="number-pad"
          onChangeText={onTrainingDaysPerWeekChange}
          placeholder="3"
          placeholderTextColor={Colors.dark.textSecondary}
          style={styles.input}
          value={trainingDaysPerWeek}
        />
      </View>

      <Text style={styles.inputLabel}>Goal type</Text>
      <View style={styles.goalTypeRow}>
        <AppButton
          label="Lose fat"
          onPress={() => onGoalTypeChange('lose_fat')}
          variant={goalType === 'lose_fat' ? 'primary' : 'secondary'}
        />
        <AppButton
          label="Maintain"
          onPress={() => onGoalTypeChange('maintain')}
          variant={goalType === 'maintain' ? 'primary' : 'secondary'}
        />
        <AppButton
          label="Gain muscle"
          onPress={() => onGoalTypeChange('gain_muscle')}
          variant={goalType === 'gain_muscle' ? 'primary' : 'secondary'}
        />
      </View>

      <AppButton disabled={isSaveDisabled} label="Save Goals" onPress={onSaveGoals} />
    </AppCard>
  );
}

const styles = {
  sectionTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '800' as const,
  },
  helpText: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: Spacing.two,
    marginTop: Spacing.one,
  },
  goalSummaryRow: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    gap: Spacing.three,
    justifyContent: 'space-between' as const,
    paddingBottom: Spacing.two,
  },
  label: {
    color: Colors.dark.textSecondary,
    fontSize: 15,
  },
  value: {
    color: Colors.dark.text,
    flex: 1,
    fontSize: 16,
    fontWeight: '800' as const,
    textAlign: 'right' as const,
  },
  inputGroup: {
    gap: Spacing.one,
    marginBottom: Spacing.two,
  },
  inputLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '700' as const,
  },
  input: {
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous' as const,
    borderRadius: 8,
    borderWidth: 1,
    color: Colors.dark.text,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: Spacing.two,
  },
  goalTypeRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: Spacing.two,
    marginBottom: Spacing.two,
    marginTop: Spacing.one,
  },
};
