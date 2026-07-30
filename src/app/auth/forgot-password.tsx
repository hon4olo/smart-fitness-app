import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  resolvePasswordResetSubmissionError,
  validateForgotPassword,
} from '@/auth/passwordResetModel';
import { AppCard } from '@/components/ui/AppCard';
import { FormField } from '@/components/ui/FormField';
import { InlineError } from '@/components/ui/InlineError';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuthSession } from '@/hooks/useAuthSession';
import {
  localizeAuthValidation,
  localizePasswordResetMessage,
} from '@/localization/authCopy';
import { useLocalization } from '@/localization';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLocalization();
  const { requestPasswordReset } = useAuthSession();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const handleSubmit = async () => {
    if (isSubmitting) return;
    const errors = validateForgotPassword(email);
    setEmailError(errors.email);
    setFormError(null);
    if (errors.email) return;

    setIsSubmitting(true);
    try {
      await requestPasswordReset({ email: email.trim().toLowerCase() });
      setAccepted(true);
    } catch (error) {
      setFormError(resolvePasswordResetSubmissionError(error, 'forgot'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardRoot}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.four, paddingTop: insets.top + Spacing.four },
        ]}
        keyboardShouldPersistTaps="handled"
        style={styles.screen}>
        <View style={styles.container}>
          <ScreenHeader
            actionLabel={t('common.back')}
            onActionPress={() => router.back()}
            subtitle={
              accepted
                ? t('passwordReset.forgot.successBody')
                : t('passwordReset.forgot.subtitle')
            }
            title={
              accepted
                ? t('passwordReset.forgot.successTitle')
                : t('passwordReset.forgot.title')
            }
          />
          <AppCard>
            {accepted ? (
              <SecondaryButton
                label={t('passwordReset.backToSignIn')}
                onPress={() => router.replace('/auth/sign-in')}
              />
            ) : (
              <>
                <InlineError
                  message={localizePasswordResetMessage(
                    formError,
                    t,
                    'passwordReset.error.forgotGeneric',
                  )}
                />
                <FormField
                  autoCapitalize="none"
                  autoComplete="email"
                  errorMessage={localizeAuthValidation(emailError, t)}
                  keyboardType="email-address"
                  label={t('common.email')}
                  onChangeText={(value) => {
                    setEmail(value);
                    if (emailError) setEmailError(undefined);
                  }}
                  placeholder={t('auth.emailPlaceholder')}
                  textContentType="emailAddress"
                  value={email}
                />
                <PrimaryButton
                  disabled={isSubmitting}
                  label={t('passwordReset.forgot.action')}
                  loading={isSubmitting}
                  onPress={handleSubmit}
                />
                <SecondaryButton
                  label={t('passwordReset.backToSignIn')}
                  onPress={() => router.replace('/auth/sign-in')}
                />
              </>
            )}
          </AppCard>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.four, maxWidth: MaxContentWidth, width: '100%' },
  content: { alignItems: 'center', paddingHorizontal: Spacing.three },
  keyboardRoot: { flex: 1 },
  screen: { backgroundColor: Colors.dark.background, flex: 1 },
});
