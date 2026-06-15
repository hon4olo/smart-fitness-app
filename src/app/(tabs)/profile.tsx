import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';

type ProfileScreenGoalType = 'lose_fat' | 'maintain' | 'gain_muscle';

export default function ProfileScreen() {
  const { profile, resetOnboarding, updateProfileGoals, weightHistory } = useAppContext();
  const safeAreaInsets = useSafeAreaInsets();
  const latestWeight = weightHistory[0];
  const [targetWeight, setTargetWeight] = useState(`${profile.targetWeight}`);
  const [goalType, setGoalType] = useState(profile.goalType);
  const [weeklyWeightChangeGoal, setWeeklyWeightChangeGoal] = useState(
    `${profile.weeklyWeightChangeGoal}`
  );
  const [trainingDaysPerWeek, setTrainingDaysPerWeek] = useState(`${profile.trainingDaysPerWeek}`);

  useEffect(() => {
    setTargetWeight(`${profile.targetWeight}`);
    setGoalType(profile.goalType);
    setWeeklyWeightChangeGoal(`${profile.weeklyWeightChangeGoal}`);
    setTrainingDaysPerWeek(`${profile.trainingDaysPerWeek}`);
  }, [profile]);

  const parsedTargetWeight = Number(targetWeight);
  const parsedWeeklyWeightChangeGoal = Number(weeklyWeightChangeGoal);
  const parsedTrainingDaysPerWeek = Number(trainingDaysPerWeek);
  const isSaveDisabled =
    !Number.isFinite(parsedTargetWeight) ||
    parsedTargetWeight <= 0 ||
    !Number.isFinite(parsedWeeklyWeightChangeGoal) ||
    parsedWeeklyWeightChangeGoal < 0 ||
    !Number.isFinite(parsedTrainingDaysPerWeek) ||
    parsedTrainingDaysPerWeek <= 0;

  const handleSaveGoals = () => {
    if (isSaveDisabled) {
      return;
    }

    updateProfileGoals({
      targetWeight: parsedTargetWeight,
      goalType,
      weeklyWeightChangeGoal: parsedWeeklyWeightChangeGoal,
      trainingDaysPerWeek: parsedTrainingDaysPerWeek,
    });
    Alert.alert('Goals saved', 'Your fitness goals have been updated.');
  };

  const handleResetOnboarding = () => {
    Alert.alert('Reset onboarding?', 'Home will show Quick Setup again.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => resetOnboarding(),
      },
    ]);
  };

  const goalTypeLabel = (value: ProfileScreenGoalType) => {
    if (value === 'lose_fat') {
      return 'Lose fat';
    }

    if (value === 'maintain') {
      return 'Maintain';
    }

    return 'Gain muscle';
  };

  const rows = [
    ['Height', profile.height],
    ['Weight', latestWeight ? `${latestWeight.weight.toFixed(1)} kg` : profile.weight],
    ['Goal type', goalTypeLabel(profile.goalType)],
    ['Activity level', profile.activityLevel],
  ];

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: safeAreaInsets.bottom + 140 }]}>
      <View style={styles.container}>
        <SectionHeader title="Profile" subtitle="Basic profile details for the MVP" />

        <AppCard>
          {rows.map(([label, value]) => (
            <View key={label} style={styles.row}>
              <Text selectable style={styles.label}>
                {label}
              </Text>
              <Text selectable style={styles.value}>
                {value}
              </Text>
            </View>
          ))}
        </AppCard>

        <AppCard>
          <Text style={styles.sectionTitle}>Goals</Text>

          <View style={styles.goalSummaryRow}>
            <Text style={styles.label}>Latest weight</Text>
            <Text style={styles.value}>
              {latestWeight ? `${latestWeight.weight.toFixed(1)} kg` : 'No weight logged yet'}
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Target weight</Text>
            <TextInput
              keyboardType="decimal-pad"
              onChangeText={setTargetWeight}
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
              onChangeText={setWeeklyWeightChangeGoal}
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
              onChangeText={setTrainingDaysPerWeek}
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
              onPress={() => setGoalType('lose_fat')}
              variant={goalType === 'lose_fat' ? 'primary' : 'secondary'}
            />
            <AppButton
              label="Maintain"
              onPress={() => setGoalType('maintain')}
              variant={goalType === 'maintain' ? 'primary' : 'secondary'}
            />
            <AppButton
              label="Gain muscle"
              onPress={() => setGoalType('gain_muscle')}
              variant={goalType === 'gain_muscle' ? 'primary' : 'secondary'}
            />
          </View>

          <AppButton disabled={isSaveDisabled} label="Save Goals" onPress={handleSaveGoals} />
        </AppCard>

        <AppCard>
          <Text style={styles.sectionTitle}>Saved Goals</Text>
          <View style={styles.savedGoalRow}>
            <Text style={styles.label}>Target weight</Text>
            <Text style={styles.value}>{profile.targetWeight.toFixed(1)} kg</Text>
          </View>
          <View style={styles.savedGoalRow}>
            <Text style={styles.label}>Goal type</Text>
            <Text style={styles.value}>{goalTypeLabel(profile.goalType)}</Text>
          </View>
          <View style={styles.savedGoalRow}>
            <Text style={styles.label}>Weekly weight change goal</Text>
            <Text style={styles.value}>{profile.weeklyWeightChangeGoal.toFixed(2)} kg</Text>
          </View>
          <View style={styles.savedGoalRow}>
            <Text style={styles.label}>Training days per week</Text>
            <Text style={styles.value}>{profile.trainingDaysPerWeek}</Text>
          </View>
        </AppCard>

        <AppButton label="Reset Onboarding" onPress={handleResetOnboarding} variant="secondary" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    width: '100%',
  },
  content: {
    alignItems: 'center',
    padding: Spacing.three,
  },
  goalSummaryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.three,
    justifyContent: 'space-between',
    paddingBottom: Spacing.two,
  },
  goalTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.two,
    marginTop: Spacing.one,
  },
  input: {
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: 1,
    color: Colors.dark.text,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: Spacing.two,
  },
  inputGroup: {
    gap: Spacing.one,
    marginBottom: Spacing.two,
  },
  inputLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  label: {
    color: Colors.dark.textSecondary,
    fontSize: 15,
  },
  sectionTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '800',
  },
  row: {
    alignItems: 'center',
    borderColor: Colors.dark.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: Spacing.three,
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
  },
  screen: {
    backgroundColor: Colors.dark.background,
    flex: 1,
  },
  savedGoalRow: {
    alignItems: 'center',
    borderColor: Colors.dark.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: Spacing.three,
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
  },
  value: {
    color: Colors.dark.text,
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'right',
  },
});
