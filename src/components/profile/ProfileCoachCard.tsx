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
  const { locale } = useLocalization();
  const activityOptions = [
    { label: locale === 'ru' ? 'Низкая' : 'Sedentary', value: 'sedentary' as const },
    { label: locale === 'ru' ? 'Лёгкая' : 'Light', value: 'light' as const },
    { label: locale === 'ru' ? 'Средняя' : 'Moderate', value: 'moderate' as const },
    { label: locale === 'ru' ? 'Высокая' : 'High', value: 'high' as const },
    { label: locale === 'ru' ? 'Очень высокая' : 'Very high', value: 'very_high' as const },
  ];
  const experienceOptions = [
    { label: locale === 'ru' ? 'Новичок' : 'Beginner', value: 'beginner' as const },
    { label: locale === 'ru' ? 'Средний' : 'Intermediate', value: 'intermediate' as const },
    { label: locale === 'ru' ? 'Продвинутый' : 'Advanced', value: 'advanced' as const },
  ];

  return (
    <AppCard>
      <Text style={styles.title}>{locale === 'ru' ? 'Профиль Coach' : 'Coach profile'}</Text>
      <Text style={styles.helpText}>
        {locale === 'ru'
          ? 'Здесь остаются только параметры тренировок. Дата рождения и формула расчёта берутся из Настроек.'
          : 'Only training inputs live here. Date of birth and calculation formula come from Settings.'}
      </Text>
      {!personalDetailsReady ? (
        <View style={styles.personalDetailsNotice}>
          <Text style={styles.noticeTitle}>
            {locale === 'ru' ? 'Заполните личные данные' : 'Complete personal details'}
          </Text>
          <Text style={styles.fieldHelp}>
            {locale === 'ru'
              ? 'Укажите дату рождения и формулу расчёта в Настройках, чтобы сохранить профиль Coach.'
              : 'Set date of birth and calculation formula in Settings before saving Coach.'}
          </Text>
          <SecondaryButton
            label={locale === 'ru' ? 'Открыть настройки' : 'Open Settings'}
            onPress={onOpenPersonalDetails}
          />
        </View>
      ) : null}
      <FormField
        errorMessage={errors.heightCm}
        helperText={
          locale === 'ru'
            ? 'Используется в детерминированных формулах энергозатрат'
            : 'Used by deterministic energy formulas'
        }
        keyboardType="decimal-pad"
        label={locale === 'ru' ? `Рост (${lengthUnit})` : `Height (${lengthUnit})`}
        onChangeText={onHeightCmChange}
        placeholder={lengthUnit === 'in' ? '69' : '175'}
        textContentType="none"
        value={heightCm}
      />
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{locale === 'ru' ? 'Уровень активности' : 'Activity level'}</Text>
        <ChoiceGrid
          accessibilityLabel={locale === 'ru' ? 'Уровень активности' : 'Activity level'}
          onChange={onActivityLevelChange}
          options={activityOptions}
          value={activityLevel}
        />
        <InlineError message={errors.activityLevel} />
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>
          {locale === 'ru' ? 'Тренировочный опыт' : 'Training experience'}
        </Text>
        <ChoiceGrid
          accessibilityLabel={locale === 'ru' ? 'Тренировочный опыт' : 'Training experience'}
          columns={3}
          onChange={onTrainingExperienceChange}
          options={experienceOptions}
          value={trainingExperience}
        />
        <InlineError message={errors.trainingExperience} />
      </View>
      <PrimaryButton
        disabled={isSaveDisabled}
        label={locale === 'ru' ? 'Сохранить профиль Coach' : 'Save coach profile'}
        onPress={onSave}
      />
      <SecondaryButton
        accessibilityHint="Opens the self-reported recovery check-in form"
        label={locale === 'ru' ? 'Добавить оценку восстановления' : 'Add recovery check-in'}
        onPress={() => router.push('/profile/recovery-check-in')}
      />
      <SecondaryButton
        accessibilityHint="Opens the self-reported training limitation manager"
        label={locale === 'ru' ? 'Ограничения тренировок' : 'Manage training limitations'}
        onPress={() => router.push('/profile/limitations')}
      />
      <SecondaryButton
        accessibilityHint="Opens the deterministic limitations and recovery readiness review"
        label={locale === 'ru' ? 'Безопасность и восстановление' : 'Open Safety & Recovery'}
        onPress={() => router.push('/profile/safety-recovery')}
      />
      <SecondaryButton
        accessibilityHint="Opens the deterministic Strength, Nutrition, and Safety combined review"
        label={locale === 'ru' ? 'Общий обзор Coach' : 'Open Combined Coach'}
        onPress={() => router.push('/profile/combined-review')}
      />
      <SecondaryButton
        accessibilityHint="Builds read-only Strength and Nutrition proposals under the Safety ceiling"
        label={locale === 'ru' ? 'Общее предложение Coach' : 'Open Combined proposal'}
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
