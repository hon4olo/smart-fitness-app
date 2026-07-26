import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, MaxContentWidth, Spacing, Typography } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { useLocalization } from '@/localization';
import type { ProfileGoalType } from '@/types';
import {
  displayWeightInputToKg,
  formatWeightValue,
  parseDisplayNumber,
  useUnitPreferences,
} from '@/units';

export default function OnboardingClientScreen() {
  const { completeOnboarding, onboardingCompleted, profile, updateNutritionTargets } =
    useAppContext();
  const { t } = useLocalization();
  const { weight: weightUnit } = useUnitPreferences();
  const insets = useSafeAreaInsets();
  const [currentWeightInput, setCurrentWeightInput] = useState('');
  const [targetWeightInput, setTargetWeightInput] = useState(() =>
    formatWeightValue(profile.targetWeight, weightUnit),
  );
  const [goalType, setGoalType] = useState<ProfileGoalType>(profile.goalType);
  const [trainingDaysInput, setTrainingDaysInput] = useState(
    `${profile.trainingDaysPerWeek}`,
  );

  useEffect(() => {
    if (onboardingCompleted) router.replace('/');
  }, [onboardingCompleted]);

  useEffect(() => {
    setTargetWeightInput(formatWeightValue(profile.targetWeight, weightUnit));
  }, [profile.targetWeight, weightUnit]);

  const parsedCurrentWeightDisplay = parseDisplayNumber(currentWeightInput);
  const parsedTargetWeightDisplay = parseDisplayNumber(targetWeightInput);
  const currentWeightKg = Number(displayWeightInputToKg(currentWeightInput, weightUnit));
  const targetWeightKg = Number(displayWeightInputToKg(targetWeightInput, weightUnit));
  const trainingDays = Number(trainingDaysInput);

  const validationMessage = useMemo(() => {
    if (!Number.isFinite(parsedCurrentWeightDisplay) || parsedCurrentWeightDisplay <= 0) {
      return t('onboarding.validation.currentWeight');
    }
    if (!Number.isFinite(parsedTargetWeightDisplay) || parsedTargetWeightDisplay <= 0) {
      return t('onboarding.validation.targetWeight');
    }
    if (!Number.isInteger(trainingDays) || trainingDays < 1 || trainingDays > 7) {
      return t('onboarding.validation.trainingDays');
    }
    return null;
  }, [parsedCurrentWeightDisplay, parsedTargetWeightDisplay, t, trainingDays]);

  const handleComplete = () => {
    if (validationMessage) return;

    completeOnboarding({
      currentWeight: currentWeightKg,
      goalType,
      targetWeight: targetWeightKg,
      trainingDaysPerWeek: trainingDays,
    });

    const maintenanceCalories = currentWeightKg * 33;
    const suggestedCalories =
      goalType === 'lose_fat'
        ? maintenanceCalories - 300
        : goalType === 'gain_muscle'
          ? maintenanceCalories + 250
          : maintenanceCalories;
    const protein = Math.round(currentWeightKg * 2);
    const fats = Math.round(currentWeightKg * 0.8);
    const calories = Math.round(suggestedCalories / 10) * 10;
    const carbs = Math.max(0, Math.round((calories - protein * 4 - fats * 9) / 4));

    updateNutritionTargets({ calories, protein, carbs, fats });
    Alert.alert(t('onboarding.successTitle'), t('onboarding.successBody'), [
      { text: t('onboarding.successAction'), onPress: () => router.replace('/') },
    ]);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.six, paddingTop: insets.top + Spacing.four },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.eyebrow}>{t('onboarding.eyebrow')}</Text>
            <Text style={styles.title}>{t('onboarding.title')}</Text>
            <Text style={styles.subtitle}>{t('onboarding.subtitle')}</Text>
          </View>

          <AppCard>
            <Field
              label={t('onboarding.currentWeight', { unit: weightUnit })}
              onChangeText={setCurrentWeightInput}
              placeholder={weightUnit === 'lb' ? '182.3' : '82.7'}
              value={currentWeightInput}
            />
            <Field
              label={t('onboarding.targetWeight', { unit: weightUnit })}
              onChangeText={setTargetWeightInput}
              placeholder={weightUnit === 'lb' ? '165' : '75'}
              value={targetWeightInput}
            />
            <Field
              label={t('onboarding.trainingDays')}
              keyboardType="number-pad"
              onChangeText={setTrainingDaysInput}
              placeholder="3"
              value={trainingDaysInput}
            />

            <View style={styles.goalBlock}>
              <Text style={styles.label}>{t('onboarding.goal')}</Text>
              <View style={styles.goalRow}>
                <AppButton
                  label={t('profile.goal.loseFat')}
                  onPress={() => setGoalType('lose_fat')}
                  variant={goalType === 'lose_fat' ? 'primary' : 'secondary'}
                />
                <AppButton
                  label={t('profile.goal.maintain')}
                  onPress={() => setGoalType('maintain')}
                  variant={goalType === 'maintain' ? 'primary' : 'secondary'}
                />
                <AppButton
                  label={t('profile.goal.gainMuscle')}
                  onPress={() => setGoalType('gain_muscle')}
                  variant={goalType === 'gain_muscle' ? 'primary' : 'secondary'}
                />
              </View>
            </View>

            {validationMessage ? (
              <Text accessibilityLiveRegion="polite" style={styles.validation}>
                {validationMessage}
              </Text>
            ) : null}
            <AppButton
              disabled={Boolean(validationMessage)}
              label={t('onboarding.complete')}
              onPress={handleComplete}
            />
          </AppCard>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  keyboardType = 'decimal-pad',
  label,
  onChangeText,
  placeholder,
  value,
}: {
  keyboardType?: 'decimal-pad' | 'number-pad';
  label: string;
  onChangeText(value: string): void;
  placeholder: string;
  value: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.dark.textMuted}
        style={styles.input}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.four, maxWidth: MaxContentWidth, width: '100%' },
  content: { alignItems: 'center', paddingHorizontal: Spacing.three },
  eyebrow: {
    color: Colors.dark.accent,
    fontSize: Typography.caption.fontSize,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  field: { gap: Spacing.one, marginBottom: Spacing.three },
  goalBlock: { gap: Spacing.two, marginBottom: Spacing.three },
  goalRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  header: { gap: Spacing.two },
  input: {
    backgroundColor: Colors.dark.surfacePrimary,
    borderColor: Colors.dark.borderSubtle,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    color: Colors.dark.textPrimary,
    fontSize: Typography.body.fontSize,
    minHeight: 52,
    paddingHorizontal: Spacing.three,
  },
  label: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.body.fontSize,
    fontWeight: '700',
  },
  screen: { backgroundColor: Colors.dark.background, flex: 1 },
  subtitle: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
  },
  title: {
    color: Colors.dark.textPrimary,
    fontSize: Typography.screenTitle.fontSize,
    fontWeight: Typography.screenTitle.fontWeight,
  },
  validation: {
    color: Colors.dark.warning,
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
    marginBottom: Spacing.two,
  },
});
