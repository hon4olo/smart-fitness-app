import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { ProfileGoalsCard } from '@/components/profile/ProfileGoalsCard';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { useAppActions } from '@/context/AppContext';
import { useProfileState } from '@/context/ProfileStateContext';
import { useProgressState } from '@/context/ProgressStateContext';
import { getGoalTypeLabel } from '@/features/progress/progressLocalization';
import { useLocalization } from '@/localization';
import { getProfileGoalsValidationCopy } from '@/localization/profileGoalsValidationCopy';
import {
  formatWeightValue,
  parseDisplayNumber,
  useUnitPreferences,
  weightToKg,
} from '@/units';

import {
  calculateNutritionTargets,
  getProfileWeightKg,
  normalizeProfileActivityLevel,
} from './profilePlan';

export function ProfileGoalsSection() {
  const { profile } = useProfileState();
  const { weightHistory } = useProgressState();
  const { updateNutritionTargets, updateProfileGoals } = useAppActions();
  const { locale, t } = useLocalization();
  const validationCopy = getProfileGoalsValidationCopy(locale);
  const { weight: weightUnit } = useUnitPreferences();
  const [expanded, setExpanded] = useState(false);
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

  useEffect(() => {
    setTargetWeight(formatWeightValue(profile.targetWeight, weightUnit));
    setGoalType(profile.goalType);
    setWeeklyWeightChangeGoal(
      formatWeightValue(profile.weeklyWeightChangeGoal, weightUnit),
    );
    setTrainingDaysPerWeek(`${profile.trainingDaysPerWeek}`);
  }, [profile, weightUnit]);

  const canonicalTargetWeight = weightToKg(parseDisplayNumber(targetWeight), weightUnit);
  const canonicalWeeklyWeightChangeGoal = weightToKg(
    parseDisplayNumber(weeklyWeightChangeGoal),
    weightUnit,
  );
  const parsedTrainingDaysPerWeek = Number(trainingDaysPerWeek);
  const validationErrors = {
    targetWeight:
      !Number.isFinite(canonicalTargetWeight) || canonicalTargetWeight <= 0
        ? validationCopy.targetWeight
        : undefined,
    weeklyWeightChange:
      !Number.isFinite(canonicalWeeklyWeightChangeGoal) || canonicalWeeklyWeightChangeGoal < 0
        ? validationCopy.weeklyWeightChange
        : undefined,
    trainingDays:
      !Number.isInteger(parsedTrainingDaysPerWeek) ||
      parsedTrainingDaysPerWeek < 1 ||
      parsedTrainingDaysPerWeek > 7
        ? validationCopy.trainingDays
        : undefined,
  };
  const isSaveDisabled = Boolean(
    validationErrors.targetWeight ||
      validationErrors.weeklyWeightChange ||
      validationErrors.trainingDays,
  );

  const saveGoals = () => {
    if (isSaveDisabled) return;

    const latestWeight = weightHistory[0]?.weight;
    const currentWeight = latestWeight ?? getProfileWeightKg({
      fallbackWeight: canonicalTargetWeight,
      profileWeight: profile.weight,
    });
    const activityLevel = normalizeProfileActivityLevel(profile.activityLevel) ?? 'moderate';

    updateProfileGoals({
      targetWeight: canonicalTargetWeight,
      goalType,
      weeklyWeightChangeGoal: canonicalWeeklyWeightChangeGoal,
      trainingDaysPerWeek: parsedTrainingDaysPerWeek,
    });
    updateNutritionTargets(
      calculateNutritionTargets({ activityLevel, goalType, weightKg: currentWeight }),
    );
    setExpanded(false);
    Alert.alert(t('goals.savedTitle'), t('goals.savedBody'));
  };

  const confirmSave = () => {
    if (isSaveDisabled) return;
    Alert.alert(t('goals.recalculateTitle'), t('goals.recalculateBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('goals.confirmSave'), onPress: saveGoals },
    ]);
  };

  return (
    <View style={styles.section}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((current) => !current)}
        style={({ pressed }) => [styles.disclosure, pressed && styles.pressed]}>
        <View style={styles.copy}>
          <Text style={styles.title}>{t('goals.sectionTitle')}</Text>
          <Text style={styles.subtitle}>
            {t('goals.sectionSubtitle', {
              goal: getGoalTypeLabel(t, profile.goalType),
              weight: formatWeightValue(profile.targetWeight, weightUnit),
              unit: weightUnit,
            })}
          </Text>
        </View>
        <Text style={styles.chevron}>{expanded ? '−' : '+'}</Text>
      </Pressable>
      {expanded ? (
        <ProfileGoalsCard
          goalType={goalType}
          isSaveDisabled={isSaveDisabled}
          onGoalTypeChange={setGoalType}
          onSaveGoals={confirmSave}
          onTargetWeightChange={setTargetWeight}
          onTrainingDaysPerWeekChange={setTrainingDaysPerWeek}
          onWeeklyWeightChangeGoalChange={setWeeklyWeightChangeGoal}
          targetWeight={targetWeight}
          trainingDaysPerWeek={trainingDaysPerWeek}
          validationErrors={validationErrors}
          weeklyWeightChangeGoal={weeklyWeightChangeGoal}
          weightUnit={weightUnit}
        />
      ) : null}
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
  pressed: { opacity: 0.78 },
  section: { gap: Spacing.two },
  subtitle: { color: Colors.dark.textSecondary, fontSize: 13, lineHeight: 18 },
  title: { color: Colors.dark.textPrimary, fontSize: 18, fontWeight: '800' },
});