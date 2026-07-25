import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthGateCard } from '@/components/auth';
import { ProfileCoachCard } from '@/components/profile/ProfileCoachCard';
import { ProfileGoalsCard } from '@/components/profile/ProfileGoalsCard';
import { ProfilePreferencesCard } from '@/components/profile/ProfilePreferencesCard';
import { ProfileSettingsCard } from '@/components/profile/ProfileSettingsCard';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Colors, MaxContentWidth, Radii, Spacing } from '@/constants/theme';
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

function CollapsibleSection({
  children,
  expanded,
  onToggle,
  subtitle,
  title,
}: {
  children: React.ReactNode;
  expanded: boolean;
  onToggle(): void;
  subtitle: string;
  title: string;
}) {
  return (
    <View style={styles.section}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={onToggle}
        style={({ pressed }) => [styles.disclosure, pressed && styles.disclosurePressed]}>
        <View style={styles.disclosureCopy}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionSubtitle}>{subtitle}</Text>
        </View>
        <Text style={styles.chevron}>{expanded ? '−' : '+'}</Text>
      </Pressable>
      {expanded ? children : null}
    </View>
  );
}

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
          <Text style={styles.sectionTitle}>{locale === 'ru' ? 'Кратко' : 'Summary'}</Text>
          <ProfilePreferencesCard
            activityLevel={profile.activityLevel}
            goalType={goalTypeLabel(profile.goalType, locale)}
            trainingDaysPerWeek={trainingDaysPerWeek}
          />
        </View>

        <CollapsibleSection
          expanded={goalsExpanded}
          onToggle={() => setGoalsExpanded((current) => !current)}
          subtitle={
            locale === 'ru'
              ? `${goalTypeLabel(profile.goalType, locale)} · цель ${formatWeightValue(profile.targetWeight, weightUnit)} ${weightUnit}`
              : `${goalTypeLabel(profile.goalType, locale)} · target ${formatWeightValue(profile.targetWeight, weightUnit)} ${weightUnit}`
          }
          title={locale === 'ru' ? 'Моя цель' : 'My goal'}>
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
        </CollapsibleSection>

        <CollapsibleSection
          expanded={coachExpanded}
          onToggle={() => setCoachExpanded((current) => !current)}
          subtitle={
            locale === 'ru'
              ? 'Дата рождения, рост, активность и опыт'
              : 'Date of birth, height, activity, and experience'
          }
          title={locale === 'ru' ? 'Профиль Coach' : 'Coach profile'}>
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
        </CollapsibleSection>

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

const styles = StyleSheet.create({
  chevron: {
    color: Colors.dark.textPrimary,
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 26,
  },
  container: { gap: Spacing.four, maxWidth: MaxContentWidth, width: '100%' },
  content: { alignItems: 'center', padding: Spacing.three },
  disclosure: {
    alignItems: 'center',
    backgroundColor: Colors.dark.surfacePrimary,
    borderColor: Colors.dark.borderSubtle,
    borderRadius: Radii.large,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
    minHeight: 68,
    padding: Spacing.three,
  },
  disclosureCopy: { flex: 1, gap: 4 },
  disclosurePressed: { opacity: 0.78 },
  screen: { backgroundColor: Colors.dark.background, flex: 1 },
  section: { gap: Spacing.two },
  sectionSubtitle: { color: Colors.dark.textSecondary, fontSize: 13, lineHeight: 18 },
  sectionTitle: { color: Colors.dark.textPrimary, fontSize: 18, fontWeight: '800' },
});
