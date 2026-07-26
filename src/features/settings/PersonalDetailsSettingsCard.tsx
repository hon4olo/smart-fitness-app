import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { FormField } from '@/components/ui/FormField';
import { InlineError } from '@/components/ui/InlineError';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Colors, Radii, Spacing, Typography } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { useLocalization } from '@/localization';
import type { ProfileCalculationSex } from '@/types';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const validateDateOfBirth = (value: string): string | null => {
  const trimmed = value.trim();
  if (!DATE_PATTERN.test(trimmed)) return 'format';
  const date = new Date(`${trimmed}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== trimmed) {
    return 'format';
  }
  const now = new Date();
  let age = now.getUTCFullYear() - date.getUTCFullYear();
  const beforeBirthday =
    now.getUTCMonth() < date.getUTCMonth() ||
    (now.getUTCMonth() === date.getUTCMonth() && now.getUTCDate() < date.getUTCDate());
  if (beforeBirthday) age -= 1;
  if (date > now) return 'future';
  if (age < 18 || age > 100) return 'age';
  return null;
};

export function PersonalDetailsSettingsCard() {
  const app = useAppContext();
  const { t } = useLocalization();
  const [dateOfBirth, setDateOfBirth] = useState(app.profile.dateOfBirth ?? '');
  const [calculationSex, setCalculationSex] = useState<ProfileCalculationSex | null>(
    app.profile.calculationSex,
  );

  useEffect(() => {
    setDateOfBirth(app.profile.dateOfBirth ?? '');
    setCalculationSex(app.profile.calculationSex);
  }, [app.profile.calculationSex, app.profile.dateOfBirth]);

  const dateErrorKey = useMemo(() => validateDateOfBirth(dateOfBirth), [dateOfBirth]);
  const dateError = dateErrorKey
    ? t(
        dateErrorKey === 'future'
          ? 'personalDetails.validation.future'
          : dateErrorKey === 'age'
            ? 'personalDetails.validation.age'
            : 'personalDetails.validation.format',
      )
    : undefined;
  const formulaError = calculationSex
    ? undefined
    : t('personalDetails.validation.formula');
  const isDisabled = Boolean(dateError || formulaError);

  const save = () => {
    if (isDisabled || !calculationSex) return;
    const nextState = {
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
      profile: {
        ...app.profile,
        dateOfBirth: dateOfBirth.trim(),
        calculationSex,
      },
      onboardingCompleted: app.onboardingCompleted,
    };
    app.replaceState(nextState);
    Alert.alert(t('personalDetails.savedTitle'), t('personalDetails.savedBody'));
  };

  return (
    <AppCard>
      <Text style={styles.title}>{t('personalDetails.title')}</Text>
      <Text style={styles.help}>
        {t('personalDetails.description')}
      </Text>
      <FormField
        autoCapitalize="none"
        autoCorrect={false}
        errorMessage={dateError}
        helperText={t('personalDetails.dateFormat')}
        keyboardType="numbers-and-punctuation"
        label={t('personalDetails.dateOfBirth')}
        maxLength={10}
        onChangeText={setDateOfBirth}
        placeholder="2000-05-12"
        textContentType="none"
        value={dateOfBirth}
      />
      <View style={styles.group}>
        <Text style={styles.label}>
          {t('personalDetails.calculationFormula')}
        </Text>
        <Text style={styles.help}>
          {t('personalDetails.calculationFormulaDescription')}
        </Text>
        <View style={styles.row}>
          <FormulaOption
            label={t('personalDetails.formulaMale')}
            onPress={() => setCalculationSex('male')}
            selected={calculationSex === 'male'}
          />
          <FormulaOption
            label={t('personalDetails.formulaFemale')}
            onPress={() => setCalculationSex('female')}
            selected={calculationSex === 'female'}
          />
        </View>
        <InlineError message={formulaError} />
      </View>
      <PrimaryButton
        disabled={isDisabled}
        label={t('personalDetails.save')}
        onPress={save}
      />
    </AppCard>
  );
}

function FormulaOption({
  label,
  onPress,
  selected,
}: {
  label: string;
  onPress(): void;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        selected && styles.optionSelected,
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  group: { gap: Spacing.one },
  help: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
  },
  label: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.label.fontSize,
    fontWeight: Typography.label.fontWeight,
  },
  option: {
    alignItems: 'center',
    backgroundColor: Colors.dark.surfaceSecondary,
    borderColor: Colors.dark.borderSubtle,
    borderRadius: Radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    minHeight: 46,
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
  },
  optionLabel: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.label.fontSize,
    fontWeight: Typography.label.fontWeight,
  },
  optionLabelSelected: { color: Colors.dark.textPrimary },
  optionSelected: { backgroundColor: Colors.dark.backgroundSelected, borderColor: Colors.dark.accent },
  pressed: { opacity: 0.76 },
  row: { flexDirection: 'row', gap: Spacing.two },
  title: {
    color: Colors.dark.textPrimary,
    fontSize: Typography.cardTitle.fontSize,
    fontWeight: Typography.cardTitle.fontWeight,
  },
});
