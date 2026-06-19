import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-ignore - expo-updates types are not available in this workspace, but the runtime module exists on device.
import * as Updates from 'expo-updates';

import { SectionHeader } from '@/components/ui/SectionHeader';
import { ProfileActionsCard } from '@/components/profile/ProfileActionsCard';
import { ProfileGoalsCard } from '@/components/profile/ProfileGoalsCard';
import { ProfileHeaderCard } from '@/components/profile/ProfileHeaderCard';
import { ProfileRuntimeInfoCard } from '@/components/profile/ProfileRuntimeInfoCard';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import type { ProfileGoalType } from '@/types';

type OtaValueSource = Record<string, unknown>;

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
    Alert.alert('Reset onboarding?', 'AI Coach will show Quick Setup again.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => resetOnboarding(),
      },
    ]);
  };

  const goalTypeLabel = (value: ProfileGoalType) => {
    if (value === 'lose_fat') {
      return 'Lose fat';
    }

    if (value === 'maintain') {
      return 'Maintain';
    }

    return 'Gain muscle';
  };

  const formatOtaValue = (value: unknown) => {
    if (value === null || value === undefined || value === '') {
      return 'Not available';
    }

    if (value instanceof Date) {
      return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(value);
    }

    return String(value);
  };

  const handleCheckForOtaUpdate = async () => {
    try {
      const update = await Updates.checkForUpdateAsync();

      if (!update.isAvailable) {
        Alert.alert('No update available');
        return;
      }

      await Updates.fetchUpdateAsync();
      Alert.alert('Update downloaded. Restarting app.');
      await Updates.reloadAsync();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('OTA update error', message);
    }
  };

  const rows = [
    { label: 'Height', value: profile.height },
    { label: 'Weight', value: latestWeight ? `${latestWeight.weight.toFixed(1)} kg` : profile.weight },
    { label: 'Goal type', value: goalTypeLabel(profile.goalType) },
    { label: 'Activity level', value: profile.activityLevel },
  ];

  const otaRuntimeVersion = formatOtaValue((Updates as OtaValueSource).runtimeVersion);
  const otaUpdateId = formatOtaValue((Updates as OtaValueSource).updateId);
  const otaCreatedAt = formatOtaValue((Updates as OtaValueSource).createdAt);
  const otaChannel = formatOtaValue((Updates as OtaValueSource).channel);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: safeAreaInsets.bottom + 180 }]}>
      <View style={styles.container}>
        <SectionHeader title="Profile" subtitle="Review your stats, adjust goals, and keep tools below" />

        <ProfileHeaderCard rows={rows} />

        <ProfileGoalsCard
          goalType={goalType}
          isSaveDisabled={isSaveDisabled}
          latestWeightLabel={latestWeight ? `${latestWeight.weight.toFixed(1)} kg` : 'No weight logged yet'}
          onGoalTypeChange={setGoalType}
          onSaveGoals={handleSaveGoals}
          onTargetWeightChange={setTargetWeight}
          onTrainingDaysPerWeekChange={setTrainingDaysPerWeek}
          onWeeklyWeightChangeGoalChange={setWeeklyWeightChangeGoal}
          targetWeight={targetWeight}
          trainingDaysPerWeek={trainingDaysPerWeek}
          weeklyWeightChangeGoal={weeklyWeightChangeGoal}
        />

        <ProfileActionsCard onResetOnboarding={handleResetOnboarding} />

        <ProfileRuntimeInfoCard
          channel={otaChannel}
          createdAt={otaCreatedAt}
          onCheckForOtaUpdate={handleCheckForOtaUpdate}
          runtimeVersion={otaRuntimeVersion}
          updateId={otaUpdateId}
        />
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
  screen: {
    backgroundColor: Colors.dark.background,
    flex: 1,
  },
});
