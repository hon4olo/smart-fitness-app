import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { FormField } from '@/components/ui/FormField';
import { InlineError } from '@/components/ui/InlineError';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Colors, Radii, Spacing, Typography } from '@/constants/theme';
import type {
  CoachActivityLevel,
  CoachProfileFormErrors,
} from '@/features/profile/coachProfileForm';
import type {
  ProfileCalculationSex,
  ProfileTrainingExperience,
} from '@/types';

type Option<Value extends string> = {
  label: string;
  value: Value;
};

type ChoiceGridProps<Value extends string> = {
  accessibilityLabel: string;
  columns?: number;
  onChange: (value: Value) => void;
  options: readonly Option<Value>[];
  value: Value | null;
};

const calculationSexOptions = [
  { label: 'Male formula', value: 'male' as const },
  { label: 'Female formula', value: 'female' as const },
];

const activityOptions = [
  { label: 'Sedentary', value: 'sedentary' as const },
  { label: 'Light', value: 'light' as const },
  { label: 'Moderate', value: 'moderate' as const },
  { label: 'High', value: 'high' as const },
  { label: 'Very high', value: 'very_high' as const },
];

const experienceOptions = [
  { label: 'Beginner', value: 'beginner' as const },
  { label: 'Intermediate', value: 'intermediate' as const },
  { label: 'Advanced', value: 'advanced' as const },
];

function ChoiceGrid<Value extends string>({
  accessibilityLabel,
  columns = 2,
  onChange,
  options,
  value,
}: ChoiceGridProps<Value>) {
  return (
    <View accessibilityLabel={accessibilityLabel} style={styles.choiceGrid}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.choice,
              { flexBasis: `${100 / columns - 2}%` },
              selected && styles.choiceSelected,
              pressed && styles.choicePressed,
            ]}>
            <Text style={[styles.choiceLabel, selected && styles.choiceLabelSelected]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type ProfileCoachCardProps = {
  activityLevel: CoachActivityLevel | null;
  calculationSex: ProfileCalculationSex | null;
  dateOfBirth: string;
  errors: CoachProfileFormErrors;
  heightCm: string;
  isSaveDisabled: boolean;
  onActivityLevelChange: (value: CoachActivityLevel) => void;
  onCalculationSexChange: (value: ProfileCalculationSex) => void;
  onDateOfBirthChange: (value: string) => void;
  onHeightCmChange: (value: string) => void;
  onSave: () => void;
  onTrainingExperienceChange: (value: ProfileTrainingExperience) => void;
  trainingExperience: ProfileTrainingExperience | null;
};

export function ProfileCoachCard({
  activityLevel,
  calculationSex,
  dateOfBirth,
  errors,
  heightCm,
  isSaveDisabled,
  onActivityLevelChange,
  onCalculationSexChange,
  onDateOfBirthChange,
  onHeightCmChange,
  onSave,
  onTrainingExperienceChange,
  trainingExperience,
}: ProfileCoachCardProps) {
  return (
    <AppCard>
      <Text style={styles.title}>Coach profile</Text>
      <Text style={styles.helpText}>
        These fields are required for deterministic energy calculations. They are synchronized as a
        revisioned profile and are never inferred by the model.
      </Text>

      <FormField
        autoCapitalize="none"
        autoCorrect={false}
        errorMessage={errors.dateOfBirth}
        helperText="YYYY-MM-DD · supported age 18–100"
        keyboardType="numbers-and-punctuation"
        label="Date of birth"
        maxLength={10}
        onChangeText={onDateOfBirthChange}
        placeholder="2000-05-12"
        textContentType="none"
        value={dateOfBirth}
      />
      <FormField
        errorMessage={errors.heightCm}
        helperText="Used by deterministic BMR formulas"
        keyboardType="decimal-pad"
        label="Height (cm)"
        onChangeText={onHeightCmChange}
        placeholder="175"
        textContentType="none"
        value={heightCm}
      />

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Calculation formula</Text>
        <Text style={styles.fieldHelp}>
          Formula input only; this is separate from identity and display settings.
        </Text>
        <ChoiceGrid
          accessibilityLabel="Calculation formula"
          onChange={onCalculationSexChange}
          options={calculationSexOptions}
          value={calculationSex}
        />
        <InlineError message={errors.calculationSex} />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Activity level</Text>
        <ChoiceGrid
          accessibilityLabel="Activity level"
          onChange={onActivityLevelChange}
          options={activityOptions}
          value={activityLevel}
        />
        <InlineError message={errors.activityLevel} />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Training experience</Text>
        <ChoiceGrid
          accessibilityLabel="Training experience"
          columns={3}
          onChange={onTrainingExperienceChange}
          options={experienceOptions}
          value={trainingExperience}
        />
        <InlineError message={errors.trainingExperience} />
      </View>

      <PrimaryButton
        disabled={isSaveDisabled}
        label="Save coach profile"
        onPress={onSave}
      />
      <SecondaryButton
        accessibilityHint="Opens the self-reported recovery check-in form"
        label="Add recovery check-in"
        onPress={() => router.push('/profile/recovery-check-in')}
      />
      <SecondaryButton
        accessibilityHint="Opens saved self-reported training limitations"
        label="Manage training limitations"
        onPress={() => router.push('/profile/limitations')}
      />
      <SecondaryButton
        accessibilityHint="Opens the deterministic limitations and recovery readiness review"
        label="Open Safety & Recovery"
        onPress={() => router.push('/profile/safety-recovery')}
      />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  choice: {
    alignItems: 'center',
    backgroundColor: Colors.dark.surfaceSecondary,
    borderColor: Colors.dark.borderSubtle,
    borderCurve: 'continuous',
    borderRadius: Radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  choiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  choiceLabel: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.label.fontSize,
    fontWeight: Typography.label.fontWeight,
    lineHeight: Typography.label.lineHeight,
    textAlign: 'center',
  },
  choiceLabelSelected: {
    color: Colors.dark.textPrimary,
  },
  choicePressed: {
    opacity: 0.72,
  },
  choiceSelected: {
    backgroundColor: Colors.dark.backgroundSelected,
    borderColor: Colors.dark.accent,
  },
  fieldGroup: {
    gap: Spacing.one,
  },
  fieldHelp: {
    color: Colors.dark.textMuted,
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
  },
  helpText: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
    marginBottom: Spacing.two,
  },
  label: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.label.fontSize,
    fontWeight: Typography.label.fontWeight,
    lineHeight: Typography.label.lineHeight,
  },
  title: {
    color: Colors.dark.textPrimary,
    fontSize: Typography.cardTitle.fontSize,
    fontWeight: Typography.cardTitle.fontWeight,
    lineHeight: Typography.cardTitle.lineHeight,
  },
});
