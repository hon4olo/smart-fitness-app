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
import {
  getActivityLevelLabel,
  getCoachProfileErrors,
  getTrainingExperienceLabel,
} from '@/features/progress/progressLocalization';
import { useLocalization } from '@/localization';
import type { ProfileTrainingExperience } from '@/types';
import type { LengthUnit } from '@/units';

type Option<Value extends string> = { label: string; value: Value };
type ChoiceGridProps<Value extends string> = {
  accessibilityLabel: string;
  columns?: number;
  onChange: (value: Value) => void;
  options: readonly Option<Value>[];
  value: Value | null;
};

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
  errors: CoachProfileFormErrors;
  heightCm: string;
  isSaveDisabled: boolean;
  lengthUnit: LengthUnit;
  onActivityLevelChange: (value: CoachActivityLevel) => void;
  onHeightCmChange: (value: string) => void;
  onOpenPersonalDetails: () => void;
  onSave: () => void;
  onTrainingExperienceChange: (value: ProfileTrainingExperience) => void;
  personalDetailsReady: boolean;
  trainingExperience: ProfileTrainingExperience | null;
};

export function ProfileCoachCard({
  activityLevel,
  errors,
  heightCm,
  isSaveDisabled,
  lengthUnit,
  onActivityLevelChange,
  onHeightCmChange,
  onOpenPersonalDetails,
  onSave,
  onTrainingExperienceChange,
  personalDetailsReady,
  trainingExperience,
}: ProfileCoachCardProps) {
  const { t } = useLocalization();
  const localizedErrors = getCoachProfileErrors(t, errors);
  const activityOptions = [
    { label: getActivityLevelLabel(t, 'sedentary'), value: 'sedentary' as const },
    { label: getActivityLevelLabel(t, 'light'), value: 'light' as const },
    { label: getActivityLevelLabel(t, 'moderate'), value: 'moderate' as const },
    { label: getActivityLevelLabel(t, 'high'), value: 'high' as const },
    { label: getActivityLevelLabel(t, 'very_high'), value: 'very_high' as const },
  ];
  const experienceOptions = [
    { label: getTrainingExperienceLabel(t, 'beginner'), value: 'beginner' as const },
    { label: getTrainingExperienceLabel(t, 'intermediate'), value: 'intermediate' as const },
    { label: getTrainingExperienceLabel(t, 'advanced'), value: 'advanced' as const },
  ];

  return (
    <AppCard>
      <Text style={styles.title}>{t('coach.profileTitle')}</Text>
      <Text style={styles.helpText}>{t('coach.profileHelp')}</Text>
      {!personalDetailsReady ? (
        <View style={styles.personalDetailsNotice}>
          <Text style={styles.noticeTitle}>{t('coach.personalDetailsRequired')}</Text>
          <Text style={styles.fieldHelp}>{t('coach.personalDetailsRequiredBody')}</Text>
          <SecondaryButton label={t('profile.settingsAction')} onPress={onOpenPersonalDetails} />
        </View>
      ) : null}
      <FormField
        errorMessage={localizedErrors.heightCm}
        helperText={t('coach.heightHelp')}
        keyboardType="decimal-pad"
        label={t('coach.height', { unit: lengthUnit })}
        onChangeText={onHeightCmChange}
        placeholder={lengthUnit === 'in' ? '69' : '175'}
        textContentType="none"
        value={heightCm}
      />
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{t('coach.activityLevel')}</Text>
        <ChoiceGrid
          accessibilityLabel={t('coach.activityLevel')}
          onChange={onActivityLevelChange}
          options={activityOptions}
          value={activityLevel}
        />
        <InlineError message={localizedErrors.activityLevel} />
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{t('coach.trainingExperience')}</Text>
        <ChoiceGrid
          accessibilityLabel={t('coach.trainingExperience')}
          columns={3}
          onChange={onTrainingExperienceChange}
          options={experienceOptions}
          value={trainingExperience}
        />
        <InlineError message={localizedErrors.trainingExperience} />
      </View>
      <PrimaryButton
        disabled={isSaveDisabled}
        label={t('coach.saveProfile')}
        onPress={onSave}
      />
      <SecondaryButton
        accessibilityHint={t('coach.hintRecoveryCheckIn')}
        label={t('coach.addRecoveryCheckIn')}
        onPress={() => router.push('/profile/recovery-check-in')}
      />
      <SecondaryButton
        accessibilityHint={t('coach.hintLimitations')}
        label={t('coach.manageLimitations')}
        onPress={() => router.push('/profile/limitations')}
      />
      <SecondaryButton
        accessibilityHint={t('coach.hintSafetyRecovery')}
        label={t('coach.openSafetyRecovery')}
        onPress={() => router.push('/profile/safety-recovery')}
      />
      <SecondaryButton
        accessibilityHint={t('coach.hintCombinedReview')}
        label={t('coach.openCombinedReview')}
        onPress={() => router.push('/profile/combined-review')}
      />
      <SecondaryButton
        accessibilityHint={t('coach.hintCombinedProposal')}
        label={t('coach.openCombinedProposal')}
        onPress={() => router.push('/profile/combined-proposal')}
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
  choiceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  choiceLabel: { color: Colors.dark.textSecondary, fontSize: Typography.label.fontSize, fontWeight: Typography.label.fontWeight, lineHeight: Typography.label.lineHeight, textAlign: 'center' },
  choiceLabelSelected: { color: Colors.dark.textPrimary },
  choicePressed: { opacity: 0.72 },
  choiceSelected: { backgroundColor: Colors.dark.backgroundSelected, borderColor: Colors.dark.accent },
  fieldGroup: { gap: Spacing.one },
  fieldHelp: { color: Colors.dark.textMuted, fontSize: Typography.caption.fontSize, lineHeight: Typography.caption.lineHeight },
  helpText: { color: Colors.dark.textSecondary, fontSize: Typography.body.fontSize, lineHeight: Typography.body.lineHeight, marginBottom: Spacing.two },
  label: { color: Colors.dark.textSecondary, fontSize: Typography.label.fontSize, fontWeight: Typography.label.fontWeight, lineHeight: Typography.label.lineHeight },
  noticeTitle: { color: Colors.dark.textPrimary, fontSize: Typography.label.fontSize, fontWeight: '800' },
  personalDetailsNotice: { backgroundColor: Colors.dark.surfaceSecondary, borderRadius: Radii.medium, gap: Spacing.one, padding: Spacing.two },
  title: { color: Colors.dark.textPrimary, fontSize: Typography.cardTitle.fontSize, fontWeight: Typography.cardTitle.fontWeight, lineHeight: Typography.cardTitle.lineHeight },
});
