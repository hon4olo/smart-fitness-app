import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, MaxContentWidth, Radii, Spacing, Typography } from '@/constants/theme';
import { useAppActions, useAppInfrastructure } from '@/context/AppContext';
import { useProfileState } from '@/context/ProfileStateContext';
import type { ProfileActivityLevel } from '@/features/profile/profilePlan';
import { useLocalization } from '@/localization';
import type { ProfileGoalType } from '@/types';
import {
  displayWeightInputToKg,
  parseDisplayNumber,
  useUnitPreferences,
} from '@/units';

const ACTIVITY_LEVELS: ProfileActivityLevel[] = [
  'sedentary',
  'light',
  'moderate',
  'high',
  'very_high',
];

export default function OnboardingClientScreen() {
  const { completeOnboarding } = useAppActions();
  const {
    isRestoringState,
    mutationFailure,
    pendingMutationCount,
  } = useAppInfrastructure();
  const { onboardingCompleted, profile } = useProfileState();
  const { t } = useLocalization();
  const { weight: weightUnit } = useUnitPreferences();
  const insets = useSafeAreaInsets();
  const [ageInput, setAgeInput] = useState('');
  const [currentWeightInput, setCurrentWeightInput] = useState('');
  const [activityLevel, setActivityLevel] = useState<ProfileActivityLevel | null>(null);
  const [goalType, setGoalType] = useState<ProfileGoalType>(profile.goalType);
  const [trainingDaysInput, setTrainingDaysInput] = useState(
    `${profile.trainingDaysPerWeek}`,
  );
  const [completionRequested, setCompletionRequested] = useState(false);
  const [completionAlertShown, setCompletionAlertShown] = useState(false);

  useEffect(() => {
    if (isRestoringState || completionRequested) return;
    if (onboardingCompleted) router.replace('/');
  }, [completionRequested, isRestoringState, onboardingCompleted]);

  useEffect(() => {
    if (
      !completionRequested ||
      completionAlertShown ||
      !onboardingCompleted ||
      pendingMutationCount > 0
    ) {
      return;
    }

    const localPersistenceFailed =
      mutationFailure?.label === 'Complete onboarding' &&
      mutationFailure.stage === 'local_persistence';
    if (localPersistenceFailed) return;

    setCompletionAlertShown(true);
    Alert.alert(t('onboarding.successTitle'), t('onboarding.successBody'), [
      { text: t('onboarding.successAction'), onPress: () => router.replace('/') },
    ]);
  }, [
    completionAlertShown,
    completionRequested,
    mutationFailure,
    onboardingCompleted,
    pendingMutationCount,
    t,
  ]);

  const age = Number(ageInput);
  const parsedCurrentWeightDisplay = parseDisplayNumber(currentWeightInput);
  const currentWeightKg = Number(displayWeightInputToKg(currentWeightInput, weightUnit));
  const trainingDays = Number(trainingDaysInput);

  const validationMessage = useMemo(() => {
    if (!Number.isInteger(age) || age < 18 || age > 100) {
      return t('onboarding.validation.age');
    }
    if (!Number.isFinite(parsedCurrentWeightDisplay) || parsedCurrentWeightDisplay <= 0) {
      return t('onboarding.validation.currentWeight');
    }
    if (!activityLevel) {
      return t('onboarding.validation.activity');
    }
    if (!Number.isInteger(trainingDays) || trainingDays < 1 || trainingDays > 7) {
      return t('onboarding.validation.trainingDays');
    }
    return null;
  }, [activityLevel, age, parsedCurrentWeightDisplay, t, trainingDays]);

  const handleComplete = () => {
    if (validationMessage || !activityLevel || completionRequested) return;

    setCompletionRequested(true);
    completeOnboarding({
      age,
      activityLevel,
      currentWeight: currentWeightKg,
      goalType,
      trainingDaysPerWeek: trainingDays,
    });
  };

  if (isRestoringState || (onboardingCompleted && !completionRequested)) {
    return <View style={styles.screen} />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}>
      <ScrollView
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.six, paddingTop: insets.top + Spacing.four },
        ]}
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
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
              keyboardType="number-pad"
              label={t('onboarding.age')}
              onChangeText={setAgeInput}
              placeholder="18"
              value={ageInput}
            />
            <Field
              label={t('onboarding.currentWeight', { unit: weightUnit })}
              onChangeText={setCurrentWeightInput}
              placeholder={weightUnit === 'lb' ? '182.3' : '82.7'}
              value={currentWeightInput}
            />
            <Field
              keyboardType="number-pad"
              label={t('onboarding.trainingDays')}
              onChangeText={setTrainingDaysInput}
              placeholder="3"
              value={trainingDaysInput}
            />

            <View style={styles.choiceBlock}>
              <Text style={styles.label}>{t('onboarding.activity')}</Text>
              <Text style={styles.helper}>{t('onboarding.activityHelp')}</Text>
              <View style={styles.choiceGrid}>
                {ACTIVITY_LEVELS.map((level) => {
                  const selected = activityLevel === level;
                  return (
                    <Pressable
                      key={level}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      disabled={completionRequested}
                      onPress={() => setActivityLevel(level)}
                      style={({ pressed }) => [
                        styles.choice,
                        selected && styles.choiceSelected,
                        pressed && styles.pressed,
                      ]}>
                      <Text style={[styles.choiceLabel, selected && styles.choiceLabelSelected]}>
                        {t(`profile.activity.${level === 'very_high' ? 'veryHigh' : level}`)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {activityLevel ? (
                <Text style={styles.activityExplanation}>
                  {t(`onboarding.activity.${activityLevel}`)}
                </Text>
              ) : null}
            </View>

            <View style={styles.choiceBlock}>
              <Text style={styles.label}>{t('onboarding.goal')}</Text>
              <View style={styles.goalRow}>
                <View style={styles.goalChoice}>
                  <AppButton
                    disabled={completionRequested}
                    label={t('profile.goal.loseFat')}
                    onPress={() => setGoalType('lose_fat')}
                    variant={goalType === 'lose_fat' ? 'primary' : 'secondary'}
                  />
                </View>
                <View style={styles.goalChoice}>
                  <AppButton
                    disabled={completionRequested}
                    label={t('profile.goal.maintain')}
                    onPress={() => setGoalType('maintain')}
                    variant={goalType === 'maintain' ? 'primary' : 'secondary'}
                  />
                </View>
                <View style={styles.goalChoice}>
                  <AppButton
                    disabled={completionRequested}
                    label={t('profile.goal.gainMuscle')}
                    onPress={() => setGoalType('gain_muscle')}
                    variant={goalType === 'gain_muscle' ? 'primary' : 'secondary'}
                  />
                </View>
              </View>
            </View>

            {validationMessage ? (
              <Text accessibilityLiveRegion="polite" style={styles.validation}>
                {validationMessage}
              </Text>
            ) : null}
            <AppButton
              disabled={Boolean(validationMessage) || completionRequested}
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
  activityExplanation: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
  },
  choice: {
    alignItems: 'center',
    backgroundColor: Colors.dark.surfaceSecondary,
    borderColor: Colors.dark.borderSubtle,
    borderRadius: Radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flexBasis: 140,
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: 46,
    minWidth: 0,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  choiceBlock: { gap: Spacing.two, marginBottom: Spacing.three },
  choiceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  choiceLabel: {
    color: Colors.dark.textSecondary,
    flexShrink: 1,
    fontSize: Typography.label.fontSize,
    fontWeight: Typography.label.fontWeight,
    textAlign: 'center',
  },
  choiceLabelSelected: { color: Colors.dark.textPrimary },
  choiceSelected: {
    backgroundColor: Colors.dark.backgroundSelected,
    borderColor: Colors.dark.accent,
  },
  container: { gap: Spacing.four, maxWidth: MaxContentWidth, width: '100%' },
  content: {
    alignItems: 'center',
    flexGrow: 1,
    paddingHorizontal: Spacing.three,
  },
  eyebrow: {
    color: Colors.dark.accent,
    fontSize: Typography.caption.fontSize,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  field: { gap: Spacing.one, marginBottom: Spacing.three },
  goalChoice: {
    flexBasis: 140,
    flexGrow: 1,
    minWidth: 0,
  },
  goalRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  header: { gap: Spacing.two },
  helper: {
    color: Colors.dark.textMuted,
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
  },
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
  pressed: { opacity: 0.72 },
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
