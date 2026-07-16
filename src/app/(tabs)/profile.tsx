import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-ignore - expo-updates types are not available in this workspace, but the runtime module exists on device.
import * as Updates from 'expo-updates';

import { AuthGateCard } from '@/components/auth';
import { ProfileActionsCard } from '@/components/profile/ProfileActionsCard';
import { ProfileGoalsCard } from '@/components/profile/ProfileGoalsCard';
import { ProfilePreferencesCard } from '@/components/profile/ProfilePreferencesCard';
import { ProfileRuntimeInfoCard } from '@/components/profile/ProfileRuntimeInfoCard';
import { ProfileSyncStatusCard } from '@/components/profile/ProfileSyncStatusCard';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import type { ProfileGoalType } from '@/types';
import { useAppTheme } from '@/theme/AppThemeProvider';

type OtaValueSource = Record<string, unknown>;

const goalTypeLabel = (value: ProfileGoalType) => {
  if (value === 'lose_fat') return 'Lose fat';
  if (value === 'maintain') return 'Maintain';
  return 'Gain muscle';
};

const formatOtaValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return 'Not available';
  }

  if (value instanceof Date) {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(value);
  }

  return String(value);
};

export default function ProfileScreen() {
  const { profile, resetOnboarding, updateProfileGoals } = useAppContext();
  const { mode, setMode } = useAppTheme();
  const safeAreaInsets = useSafeAreaInsets();
  const [targetWeight, setTargetWeight] = useState(`${profile.targetWeight}`);
  const [goalType, setGoalType] = useState(profile.goalType);
  const [weeklyWeightChangeGoal, setWeeklyWeightChangeGoal] = useState(`${profile.weeklyWeightChangeGoal}`);
  const [trainingDaysPerWeek, setTrainingDaysPerWeek] = useState(`${profile.trainingDaysPerWeek}`);
  const [developerExpanded, setDeveloperExpanded] = useState(false);

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
    Alert.alert('Reset onboarding?', 'This will show Quick Setup again on this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => resetOnboarding() },
    ]);
  };

  const otaRuntimeVersion = formatOtaValue((Updates as OtaValueSource).runtimeVersion);
  const otaUpdateId = formatOtaValue((Updates as OtaValueSource).updateId);
  const otaCreatedAt = formatOtaValue((Updates as OtaValueSource).createdAt);
  const otaChannel = formatOtaValue((Updates as OtaValueSource).channel);

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

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.content, { paddingBottom: safeAreaInsets.bottom + 120 }]} style={styles.screen}>
      <View style={styles.container}>
        <ScreenHeader title="Profile" />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <AuthGateCard />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Goals</Text>
          <ProfileGoalsCard
            goalType={goalType}
            isSaveDisabled={isSaveDisabled}
            onGoalTypeChange={setGoalType}
            onSaveGoals={handleSaveGoals}
            onTargetWeightChange={setTargetWeight}
            onTrainingDaysPerWeekChange={setTrainingDaysPerWeek}
            onWeeklyWeightChangeGoalChange={setWeeklyWeightChangeGoal}
            targetWeight={targetWeight}
            trainingDaysPerWeek={trainingDaysPerWeek}
            weeklyWeightChangeGoal={weeklyWeightChangeGoal}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <ProfilePreferencesCard
            activityLevel={profile.activityLevel}
            appearanceMode={mode}
            goalType={goalTypeLabel(profile.goalType)}
            onAppearanceModeChange={setMode}
            trainingDaysPerWeek={trainingDaysPerWeek}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sync & Backup</Text>
          <ProfileSyncStatusCard />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Developer settings</Text>
            <SecondaryButton label={developerExpanded ? 'Hide tools' : 'Show tools'} onPress={() => setDeveloperExpanded((current) => !current)} />
          </View>

          {developerExpanded ? (
            <View style={styles.sectionStack}>
              <ProfileActionsCard onResetOnboarding={handleResetOnboarding} />
              <ProfileRuntimeInfoCard channel={otaChannel} createdAt={otaCreatedAt} onCheckForOtaUpdate={handleCheckForOtaUpdate} runtimeVersion={otaRuntimeVersion} updateId={otaUpdateId} />
            </View>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.four,
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
  section: {
    gap: Spacing.two,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionStack: {
    gap: Spacing.two,
  },
  sectionTitle: {
    color: Colors.dark.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
});
