import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  validateLoginForm,
  validateRegisterForm,
  type AuthFieldErrors,
  type LoginFormValues,
  type RegisterFormValues,
} from '@/auth/auth-ui';
import { AppCard } from '@/components/ui/AppCard';
import { FormField } from '@/components/ui/FormField';
import { InlineError } from '@/components/ui/InlineError';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Colors, MaxContentWidth, Radii, Spacing, Typography } from '@/constants/theme';
import { localizeAuthSubmission, localizeAuthValidation } from '@/localization/authCopy';
import { useLocalization } from '@/localization';
import type { ProfileTrainingExperience } from '@/types';
import { displayLengthInputToCm, useUnitPreferences } from '@/units';

import { resolveAuthSubmissionErrorMessage } from './auth-presentation';

export type AuthFormScreenMode = 'login' | 'register';

export type AuthFormScreenProps = {
  mode: AuthFormScreenMode;
  onBack: () => void;
  onSubmit(values: LoginFormValues | RegisterFormValues): Promise<void>;
  onSwitchMode: () => void;
};

const EXPERIENCE_VALUES: ProfileTrainingExperience[] = [
  'beginner',
  'intermediate',
  'advanced',
];

export function AuthFormScreen({ mode, onBack, onSubmit, onSwitchMode }: AuthFormScreenProps) {
  const safeAreaInsets = useSafeAreaInsets();
  const { t } = useLocalization();
  const { length: lengthUnit } = useUnitPreferences();
  const copy =
    mode === 'login'
      ? {
          button: t('auth.login.action'),
          subtitle: t('auth.login.subtitle'),
          switchLabel: t('auth.login.switch'),
          title: t('auth.login.title'),
        }
      : {
          button: t('auth.register.action'),
          subtitle: t('auth.register.subtitle'),
          switchLabel: t('auth.register.switch'),
          title: t('auth.register.title'),
        };
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [heightInput, setHeightInput] = useState('');
  const [trainingExperience, setTrainingExperience] =
    useState<ProfileTrainingExperience | null>(null);
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const registerPayload = useMemo<RegisterFormValues>(
    () => ({
      email,
      password,
      confirmPassword,
      displayName,
      heightCm: Number(displayLengthInputToCm(heightInput, lengthUnit)),
      trainingExperience,
    }),
    [confirmPassword, displayName, email, heightInput, lengthUnit, password, trainingExperience],
  );

  const loginPayload = useMemo<LoginFormValues>(() => ({ email, password }), [email, password]);

  const clearSensitiveState = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setDisplayName('');
    setHeightInput('');
    setTrainingExperience(null);
    setFieldErrors({});
    setFormError(null);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const errors =
      mode === 'login' ? validateLoginForm(loginPayload) : validateRegisterForm(registerPayload);
    setFieldErrors(errors);
    setFormError(null);

    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit(mode === 'login' ? loginPayload : registerPayload);
      clearSensitiveState();
    } catch (error) {
      setFormError(resolveAuthSubmissionErrorMessage(error, mode));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardRoot}>
      <ScrollView
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: safeAreaInsets.bottom + 32 },
        ]}
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.screen}>
        <View style={styles.container}>
          <ScreenHeader
            actionLabel={t('common.back')}
            onActionPress={onBack}
            subtitle={copy.subtitle}
            title={copy.title}
          />

          <AppCard>
            <InlineError message={localizeAuthSubmission(formError, t)} />

            <FormField
              autoCapitalize="none"
              autoComplete="email"
              errorMessage={localizeAuthValidation(fieldErrors.email, t)}
              keyboardType="email-address"
              label={t('common.email')}
              onChangeText={(value) => {
                setEmail(value);
                if (fieldErrors.email) setFieldErrors((current) => ({ ...current, email: undefined }));
              }}
              placeholder={t('auth.emailPlaceholder')}
              textContentType="emailAddress"
              value={email}
            />

            <FormField
              autoCapitalize="none"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              errorMessage={localizeAuthValidation(fieldErrors.password, t)}
              label={t('common.password')}
              onChangeText={(value) => {
                setPassword(value);
                if (fieldErrors.password) setFieldErrors((current) => ({ ...current, password: undefined }));
              }}
              placeholder="••••••••"
              secureTextEntry
              textContentType={mode === 'login' ? 'password' : 'newPassword'}
              value={password}
            />

            {mode === 'register' ? (
              <>
                <FormField
                  autoCapitalize="none"
                  autoComplete="new-password"
                  errorMessage={localizeAuthValidation(fieldErrors.confirmPassword, t)}
                  label={t('auth.confirmPassword')}
                  onChangeText={(value) => {
                    setConfirmPassword(value);
                    if (fieldErrors.confirmPassword) setFieldErrors((current) => ({ ...current, confirmPassword: undefined }));
                  }}
                  placeholder="••••••••"
                  secureTextEntry
                  textContentType="newPassword"
                  value={confirmPassword}
                />

                <FormField
                  autoCapitalize="words"
                  autoComplete="name"
                  errorMessage={localizeAuthValidation(fieldErrors.displayName, t)}
                  helperText={t('common.optional')}
                  label={t('auth.displayName')}
                  onChangeText={(value) => {
                    setDisplayName(value);
                    if (fieldErrors.displayName) setFieldErrors((current) => ({ ...current, displayName: undefined }));
                  }}
                  placeholder={t('auth.displayNamePlaceholder')}
                  textContentType="name"
                  value={displayName}
                />

                <FormField
                  errorMessage={localizeAuthValidation(fieldErrors.heightCm, t)}
                  keyboardType="decimal-pad"
                  label={t('auth.height', { unit: lengthUnit })}
                  onChangeText={(value) => {
                    setHeightInput(value);
                    if (fieldErrors.heightCm) setFieldErrors((current) => ({ ...current, heightCm: undefined }));
                  }}
                  placeholder={lengthUnit === 'in' ? '69' : '175'}
                  textContentType="none"
                  value={heightInput}
                />

                <View style={styles.experienceField}>
                  <Text style={styles.fieldLabel}>{t('auth.trainingExperience')}</Text>
                  <View style={styles.experienceRow}>
                    {EXPERIENCE_VALUES.map((experience) => {
                      const selected = trainingExperience === experience;
                      return (
                        <Pressable
                          key={experience}
                          accessibilityRole="radio"
                          accessibilityState={{ checked: selected }}
                          onPress={() => {
                            setTrainingExperience(experience);
                            if (fieldErrors.trainingExperience) setFieldErrors((current) => ({ ...current, trainingExperience: undefined }));
                          }}
                          style={({ pressed }) => [
                            styles.experienceChoice,
                            selected && styles.experienceChoiceSelected,
                            pressed && styles.pressed,
                          ]}>
                          <Text style={[styles.experienceLabel, selected && styles.experienceLabelSelected]}>
                            {t(`profile.experience.${experience}`)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  <InlineError message={localizeAuthValidation(fieldErrors.trainingExperience, t)} />
                </View>
              </>
            ) : null}

            <PrimaryButton
              disabled={isSubmitting}
              label={copy.button}
              loading={isSubmitting}
              onPress={handleSubmit}
            />
            <SecondaryButton label={copy.switchLabel} onPress={onSwitchMode} />
          </AppCard>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: MaxContentWidth,
    width: '100%',
  },
  experienceChoice: {
    alignItems: 'center',
    backgroundColor: Colors.dark.surfaceSecondary,
    borderColor: Colors.dark.borderSubtle,
    borderRadius: Radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flexBasis: 120,
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 0,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  experienceChoiceSelected: {
    backgroundColor: Colors.dark.backgroundSelected,
    borderColor: Colors.dark.accent,
  },
  experienceField: { gap: Spacing.one },
  experienceLabel: {
    color: Colors.dark.textSecondary,
    flexShrink: 1,
    fontSize: Typography.label.fontSize,
    fontWeight: Typography.label.fontWeight,
    textAlign: 'center',
  },
  experienceLabelSelected: { color: Colors.dark.textPrimary },
  experienceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  fieldLabel: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.label.fontSize,
    fontWeight: Typography.label.fontWeight,
  },
  keyboardRoot: {
    flex: 1,
  },
  pressed: { opacity: 0.72 },
  screen: {
    backgroundColor: Colors.dark.background,
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    flexGrow: 1,
    padding: Spacing.three,
    paddingTop: Spacing.four,
  },
});
