import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-ignore - expo-updates types are not available in this workspace, but the runtime module exists on device.
import * as Updates from 'expo-updates';

import { AuthGateCard } from '@/components/auth';
import { ProfileActionsCard } from '@/components/profile/ProfileActionsCard';
import { ProfileGoalsCard } from '@/components/profile/ProfileGoalsCard';
import { ProfileHeaderCard } from '@/components/profile/ProfileHeaderCard';
import { ProfilePreferencesCard } from '@/components/profile/ProfilePreferencesCard';
import { ProfileRuntimeInfoCard } from '@/components/profile/ProfileRuntimeInfoCard';
import { ProfileSyncStatusCard } from '@/components/profile/ProfileSyncStatusCard';
import { getProfileSectionDescriptors } from '@/components/profile/profile-sections';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Colors, MaxContentWidth, Spacing, Typography } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import type { ProfileGoalType } from '@/types';

type OtaValueSource = Record<string, unknown>;

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

export default function ProfileScreen() {
  const { profile, resetOnboarding, updateProfileGoals, weightHistory } = useAppContext();
  const safeAreaInsets = useSafeAreaInsets();
  const latestWeight = weightHistory[0];
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
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => resetOnboarding(),
      },
    ]);
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

  const sectionDescriptors = getProfileSectionDescriptors(
    {
      account: {
        title: 'Account',
        subtitle: 'Your sign-in and account snapshot.',
        content: (
          <View style={styles.sectionStack}>
            <AuthGateCard />
            <ProfileHeaderCard rows={rows} />
          </View>
        ),
      },
      goals: {
        title: 'Goals',
        subtitle: 'Update the targets that drive your plan.',
        content: (
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
        ),
      },
      sync: {
        title: 'Sync & Backup',
        subtitle: 'Keep weight history backed up.',
        content: <ProfileSyncStatusCard />,
      },
      preferences: {
        title: 'Preferences',
        subtitle: 'How your settings are interpreted.',
        content: (
          <ProfilePreferencesCard
            activityLevel={profile.activityLevel}
            goalType={goalTypeLabel(profile.goalType)}
            trainingDaysPerWeek={trainingDaysPerWeek}
          />
        ),
      },
      developer: {
        title: 'Developer Settings',
        subtitle: 'Owner-only tools stay collapsed by default.',
        content: (
          <View style={styles.sectionStack}>
            <ProfileActionsCard onResetOnboarding={handleResetOnboarding} />
            <ProfileRuntimeInfoCard
              channel={otaChannel}
              createdAt={otaCreatedAt}
              onCheckForOtaUpdate={handleCheckForOtaUpdate}
              runtimeVersion={otaRuntimeVersion}
              updateId={otaUpdateId}
            />
          </View>
        ),
      },
    },
    { developerExpanded }
  );

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: safeAreaInsets.bottom + 120 }]}>
      <View style={styles.container}>
        <ScreenHeader subtitle="Review your account, goals, and backup settings." title="Profile" />

        {sectionDescriptors.map((section) => (
          <View key={section.key} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionCopy}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                {section.subtitle ? <Text style={styles.sectionSubtitle}>{section.subtitle}</Text> : null}
              </View>

              {section.key === 'developer' ? (
                <SecondaryButton
                  label={section.collapsed ? 'Show tools' : 'Hide tools'}
                  onPress={() => setDeveloperExpanded((current) => !current)}
                />
              ) : null}
            </View>

            {section.key === 'developer' && section.collapsed ? null : section.content}
          </View>
        ))}
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
  sectionCopy: {
    flex: 1,
    gap: 2,
  },
  sectionHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  sectionStack: {
    gap: Spacing.three,
  },
  sectionSubtitle: {
    color: Colors.dark.textSecondary,
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
});
