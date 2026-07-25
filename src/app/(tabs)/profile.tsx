import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthGateCard } from '@/components/auth';
import { ProfileCoachCard } from '@/components/profile/ProfileCoachCard';
import { ProfileGoalsCard } from '@/components/profile/ProfileGoalsCard';
import { ProfilePreferencesCard } from '@/components/profile/ProfilePreferencesCard';
import { ProfileSettingsCard } from '@/components/profile/ProfileSettingsCard';
import { AppCard } from '@/components/ui/AppCard';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Colors, MaxContentWidth, Spacing, Typography } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import {
  validateCoachProfileForm,
  type CoachActivityLevel,
} from '@/features/profile/coachProfileForm';
import { useLocalization } from '@/localization';
import type {
  ProfileCalculationSex,
  ProfileGoalType,
  ProfileTrainingExperience,
} from '@/types';
import {
  displayLengthInputToCm,
  formatLengthValue,
  formatWeightValue,
  parseDisplayNumber,
  useUnitPreferences,
  weightToKg,
} from '@/units';

const goalTypeLabel = (value: ProfileGoalType, locale: 'en' | 'ru') => {
  if (locale === 'ru') {
    if (value === 'lose_fat') return 'Сушка';
    if (value === 'maintain') return 'Поддержание';
    return 'Набор массы';
  }
  if (value === 'lose_fat') return 'Lose fat';
  if (value === 'maintain') return 'Maintain';
  return 'Gain muscle';
};

const normalizeCoachActivity = (value: string): CoachActivityLevel | null => {
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, '_');
  const aliases: Record<string, CoachActivityLevel> = {
    sedentary: 'sedentary',
    light: 'light',
    lightly_active: 'light',
    moderate: 'moderate',
    moderately_active: 'moderate',
    high: 'high',
    very_active: 'high',
    very_high: 'very_high',
    athlete: 'very_high',
  };
  return aliases[normalized] ?? null;
};

export default function ProfileScreen() {
  const router = useRouter();
  const app = useAppContext();
  const { locale, t } = useLocalization();
  const { weight: weightUnit, length: lengthUnit } = useUnitPreferences();
  const { profile, updateProfileGoals, replaceState } = app;
  const safeAreaInsets = useSafeAreaInsets();
  const [goalsExpanded, setGoalsExpanded] = useState(false);
  const [coachExpanded, setCoachExpanded] = useState(false);
  const [targetWeight, setTargetWeight] = useState(() =>
    formatWeightValue(profile.targetWeight, weightUnit),
  );
  const [goalType, setGoalType] = useState(profile.goalType);
  const [weeklyWeightChangeGoal, setWeeklyWeightChangeGoal] = useState(() =>
    formatWeightValue(profile.weeklyWeightChangeGoal, weightUnit),
  );
  const [trainingDaysPerWeek, setTrainingDaysPerWeek] = useState(
    `${profile.trainingDaysPerWeek}`,
  );
  const [coachDateOfBirth, setCoachDateOfBirth] = useState(profile.dateOfBirth ?? '');
  const [coachHeight, setCoachHeight] = useState(() =>
    formatLengthValue(Number(profile.height), lengthUnit),
  );
  const [coachCalculationSex, setCoachCalculationSex] =
    useState<ProfileCalculationSex | null>(profile.calculationSex);
  const [coachActivityLevel, setCoachActivityLevel] = useState<CoachActivityLevel | null>(
    normalizeCoachActivity(profile.activityLevel),
  );
  const [coachTrainingExperience, setCoachTrainingExperience] =
    useState<ProfileTrainingExperience | null>(profile.trainingExperience);

  useEffect(() => {
    setTargetWeight(formatWeightValue(profile.targetWeight, weightUnit));
    setGoalType(profile.goalType);
    setWeeklyWeightChangeGoal(formatWeightValue(profile.weeklyWeightChangeGoal, weightUnit));
    setTrainingDaysPerWeek(`${profile.trainingDaysPerWeek}`);
    setCoachDateOfBirth(profile.dateOfBirth ?? '');
    setCoachHeight(formatLengthValue(Number(profile.height), lengthUnit));
    setCoachCalculationSex(profile.calculationSex);
    setCoachActivityLevel(normalizeCoachActivity(profile.activityLevel));
    setCoachTrainingExperience(profile.trainingExperience);
  }, [lengthUnit, profile, weightUnit]);

  const parsedTargetWeightDisplay = parseDisplayNumber(targetWeight);
  const parsedWeeklyWeightDisplay = parseDisplayNumber(weeklyWeightChangeGoal);
  const parsedTrainingDaysPerWeek = Number(trainingDaysPerWeek);
  const canonicalTargetWeight = weightToKg(parsedTargetWeightDisplay, weightUnit);
  const canonicalWeeklyWeightChangeGoal = weightToKg(
    parsedWeeklyWeightDisplay,
    weightUnit,
  );
  const canonicalHeightCm = displayLengthInputToCm(coachHeight, lengthUnit);
  const isSaveDisabled =
    !Number.isFinite(canonicalTargetWeight) ||
    canonicalTargetWeight <= 0 ||
    !Number.isFinite(canonicalWeeklyWeightChangeGoal) ||
    canonicalWeeklyWeightChangeGoal < 0 ||
    !Number.isFinite(parsedTrainingDaysPerWeek) ||
    parsedTrainingDaysPerWeek <= 0;

  const coachProfileValidation = useMemo(
    () =>
      validateCoachProfileForm({
        dateOfBirth: coachDateOfBirth,
        heightCm: canonicalHeightCm,
        calculationSex: coachCalculationSex,
        activityLevel: coachActivityLevel,
        trainingExperience: coachTrainingExperience,
      }),
    [
      canonicalHeightCm,
      coachActivityLevel,
      coachCalculationSex,
      coachDateOfBirth,
      coachTrainingExperience,
    ],
  );

  const handleSaveGoals = () => {
    if (isSaveDisabled) return;
    updateProfileGoals({
      targetWeight: canonicalTargetWeight,
      goalType,
      weeklyWeightChangeGoal: canonicalWeeklyWeightChangeGoal,
      trainingDaysPerWeek: parsedTrainingDaysPerWeek,
    });
    setGoalsExpanded(false);
    Alert.alert(
      locale === 'ru' ? 'Цель сохранена' : 'Goals saved',
      locale === 'ru'
        ? 'Параметры цели обновлены.'
        : 'Your fitness goals have been updated.',
    );
  };

  const handleSaveCoachProfile = () => {
    if (!coachProfileValidation.valid) return;
    replaceState({
      workouts: app.workouts,
      trainingPrograms: app.trainingPrograms,
      exercises: app.exercises,
      workoutSessions: app.workoutSessions,
      foodEntries: app.foodEntries,
      mealTemplates: app.mealTemplates,
      nutrition: app.nutrition,
      nutritionTargets: app.nutritionTargets,
      weightHistory: app.weightHistory,
      bodyMeasurements: app.bodyMeasurements,
      userLimitations: app.userLimitations,
      recoveryCheckIns: app.recoveryCheckIns,
      profile: { ...app.profile, ...coachProfileValidation.value },
      onboardingCompleted: app.onboardingCompleted,
    });
    setCoachExpanded(false);
    Alert.alert(
      locale === 'ru' ? 'Профиль Coach сохранён' : 'Coach profile saved',
      locale === 'ru'
        ? `Данные сохранены. Расчётный возраст: ${coachProfileValidation.ageYears}.`
        : `Deterministic profile inputs are ready. Calculated age: ${coachProfileValidation.ageYears}.`,
    );
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[
        styles.content,
        { paddingBottom: safeAreaInsets.bottom + 120 },
      ]}
      style={styles.screen}>
      <View style={styles.container}>
        <ScreenHeader title={t('profile.title')} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.accountSection')}</Text>
          <AuthGateCard />
        </View>

        <View style={styles.section}>
          <DisclosureHeader
            actionLabel={
              goalsExpanded
                ? locale === 'ru'
                  ? 'Скрыть'
                  : 'Hide'
                : locale === 'ru'
                  ? 'Изменить'
                  : 'Edit'
            }
            onPress={() => setGoalsExpanded((current) => !current)}
            title={locale === 'ru' ? 'Моя цель' : 'My goal'}
          />
          {goalsExpanded ? (
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
              weightUnit={weightUnit}
            />
          ) : (
            <DisclosureSummary
              primary={goalTypeLabel(profile.goalType, locale)}
              secondary={
                locale === 'ru'
                  ? `Цель: ${formatWeightValue(profile.targetWeight, weightUnit)} ${weightUnit} · ${profile.trainingDaysPerWeek} трен./нед.`
                  : `Target: ${formatWeightValue(profile.targetWeight, weightUnit)} ${weightUnit} · ${profile.trainingDaysPerWeek} days/week`
              }
            />
          )}
        </View>

        <View style={styles.section}>
          <DisclosureHeader
            actionLabel={
              coachExpanded
                ? locale === 'ru'
                  ? 'Скрыть'
                  : 'Hide'
                : locale === 'ru'
                  ? 'Изменить'
                  : 'Edit'
            }
            onPress={() => setCoachExpanded((current) => !current)}
            title={locale === 'ru' ? 'Профиль Coach' : 'Coach profile'}
          />
          {coachExpanded ? (
            <ProfileCoachCard
              activityLevel={coachActivityLevel}
              calculationSex={coachCalculationSex}
              dateOfBirth={coachDateOfBirth}
              errors={coachProfileValidation.valid ? {} : coachProfileValidation.errors}
              heightCm={coachHeight}
              isSaveDisabled={!coachProfileValidation.valid}
              lengthUnit={lengthUnit}
              onActivityLevelChange={setCoachActivityLevel}
              onCalculationSexChange={setCoachCalculationSex}
              onDateOfBirthChange={setCoachDateOfBirth}
              onHeightCmChange={setCoachHeight}
              onSave={handleSaveCoachProfile}
              onTrainingExperienceChange={setCoachTrainingExperience}
              trainingExperience={coachTrainingExperience}
            />
          ) : (
            <DisclosureSummary
              primary={
                profile.dateOfBirth && profile.calculationSex
                  ? locale === 'ru'
                    ? 'Основные данные заполнены'
                    : 'Core details complete'
                  : locale === 'ru'
                    ? 'Нужно заполнить данные'
                    : 'Details need attention'
              }
              secondary={
                locale === 'ru'
                  ? 'Рост, дата рождения, активность и тренировочный опыт.'
                  : 'Height, date of birth, activity, and training experience.'
              }
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{locale === 'ru' ? 'Кратко' : 'Summary'}</Text>
          <ProfilePreferencesCard
            activityLevel={profile.activityLevel}
            goalType={goalTypeLabel(profile.goalType, locale)}
            trainingDaysPerWeek={`${profile.trainingDaysPerWeek}`}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.settingsSection')}</Text>
          <ProfileSettingsCard
            actionLabel={t('profile.settingsAction')}
            description={
              locale === 'ru'
                ? 'Язык, оформление, единицы, синхронизация, приватность и техническая информация.'
                : 'Language, appearance, units, sync, privacy, and technical information.'
            }
            onOpen={() => router.push('/settings')}
          />
        </View>
      </View>
    </ScrollView>
  );
}

function DisclosureHeader({
  actionLabel,
  onPress,
  title,
}: {
  actionLabel: string;
  onPress(): void;
  title: string;
}) {
  return (
    <View style={styles.disclosureHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <SecondaryButton label={actionLabel} onPress={onPress} />
    </View>
  );
}

function DisclosureSummary({ primary, secondary }: { primary: string; secondary: string }) {
  return (
    <AppCard>
      <Text style={styles.summaryPrimary}>{primary}</Text>
      <Text style={styles.summarySecondary}>{secondary}</Text>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.four, maxWidth: MaxContentWidth, width: '100%' },
  content: { alignItems: 'center', padding: Spacing.three },
  disclosureHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  screen: { backgroundColor: Colors.dark.background, flex: 1 },
  section: { gap: Spacing.two },
  sectionTitle: { color: Colors.dark.textPrimary, fontSize: 18, fontWeight: '800' },
  summaryPrimary: {
    color: Colors.dark.textPrimary,
    fontSize: Typography.bodyEmphasized.fontSize,
    fontWeight: Typography.bodyEmphasized.fontWeight,
  },
  summarySecondary: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
  },
});
