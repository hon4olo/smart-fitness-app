import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { ProfileCoachCard } from '@/components/profile/ProfileCoachCard';
import { ProfileGoalsCard } from '@/components/profile/ProfileGoalsCard';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { useAppActions, useAppContext } from '@/context/AppContext';
import {
  validateCoachProfileForm,
  type CoachActivityLevel,
} from '@/features/profile/coachProfileForm';
import { getGoalTypeLabel } from '@/features/progress/progressLocalization';
import { useLocalization } from '@/localization';
import type { ProfileTrainingExperience } from '@/types';
import {
  displayLengthInputToCm,
  formatLengthValue,
  formatWeightValue,
  parseDisplayNumber,
  useUnitPreferences,
  weightToKg,
} from '@/units';

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

export function ProgressPlanningSections() {
  const { profile } = useAppContext();
  const { updateCoachProfile, updateProfileGoals } = useAppActions();
  const { t } = useLocalization();
  const { weight: weightUnit, length: lengthUnit } = useUnitPreferences();
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
  const [coachHeight, setCoachHeight] = useState(() =>
    formatLengthValue(Number(profile.height), lengthUnit),
  );
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
    setCoachHeight(formatLengthValue(Number(profile.height), lengthUnit));
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
  const isGoalSaveDisabled =
    !Number.isFinite(canonicalTargetWeight) ||
    canonicalTargetWeight <= 0 ||
    !Number.isFinite(canonicalWeeklyWeightChangeGoal) ||
    canonicalWeeklyWeightChangeGoal < 0 ||
    !Number.isFinite(parsedTrainingDaysPerWeek) ||
    parsedTrainingDaysPerWeek <= 0;

  const coachProfileValidation = useMemo(
    () =>
      validateCoachProfileForm({
        dateOfBirth: profile.dateOfBirth ?? '',
        heightCm: canonicalHeightCm,
        calculationSex: profile.calculationSex,
        activityLevel: coachActivityLevel,
        trainingExperience: coachTrainingExperience,
      }),
    [
      canonicalHeightCm,
      coachActivityLevel,
      coachTrainingExperience,
      profile.calculationSex,
      profile.dateOfBirth,
    ],
  );
  const personalDetailsReady = Boolean(profile.dateOfBirth && profile.calculationSex);

  const handleSaveGoals = () => {
    if (isGoalSaveDisabled) return;
    updateProfileGoals({
      targetWeight: canonicalTargetWeight,
      goalType,
      weeklyWeightChangeGoal: canonicalWeeklyWeightChangeGoal,
      trainingDaysPerWeek: parsedTrainingDaysPerWeek,
    });
    setGoalsExpanded(false);
    Alert.alert(t('goals.savedTitle'), t('goals.savedBody'));
  };

  const handleSaveCoachProfile = () => {
    if (!coachProfileValidation.valid) return;
    updateCoachProfile(coachProfileValidation.value);
    setCoachExpanded(false);
    Alert.alert(t('coach.savedTitle'), t('coach.savedBody'));
  };

  return (
    <View style={styles.stack}>
      <CollapsibleSection
        expanded={goalsExpanded}
        onToggle={() => setGoalsExpanded((current) => !current)}
        subtitle={t('goals.sectionSubtitle', {
          goal: getGoalTypeLabel(t, profile.goalType),
          weight: formatWeightValue(profile.targetWeight, weightUnit),
          unit: weightUnit,
        })}
        title={t('goals.sectionTitle')}>
        <ProfileGoalsCard
          goalType={goalType}
          isSaveDisabled={isGoalSaveDisabled}
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
        subtitle={t('coach.sectionSubtitle')}
        title={t('coach.sectionTitle')}>
        <ProfileCoachCard
          activityLevel={coachActivityLevel}
          errors={coachProfileValidation.valid ? {} : coachProfileValidation.errors}
          heightCm={coachHeight}
          isSaveDisabled={!coachProfileValidation.valid}
          lengthUnit={lengthUnit}
          onActivityLevelChange={setCoachActivityLevel}
          onHeightCmChange={setCoachHeight}
          onOpenPersonalDetails={() => router.push('/settings')}
          onSave={handleSaveCoachProfile}
          onTrainingExperienceChange={setCoachTrainingExperience}
          personalDetailsReady={personalDetailsReady}
          trainingExperience={coachTrainingExperience}
        />
      </CollapsibleSection>
    </View>
  );
}

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
        <View style={styles.copy}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <Text style={styles.chevron}>{expanded ? '−' : '+'}</Text>
      </Pressable>
      {expanded ? children : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chevron: { color: Colors.dark.textPrimary, fontSize: 24, fontWeight: '600', lineHeight: 26 },
  copy: { flex: 1, gap: 4 },
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
  disclosurePressed: { opacity: 0.78 },
  section: { gap: Spacing.two },
  stack: { gap: Spacing.three },
  subtitle: { color: Colors.dark.textSecondary, fontSize: 13, lineHeight: 18 },
  title: { color: Colors.dark.textPrimary, fontSize: 18, fontWeight: '800' },
});
