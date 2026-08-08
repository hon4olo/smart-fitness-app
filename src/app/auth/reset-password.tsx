import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { resolvePasswordResetTokenParam } from '@/auth/passwordResetLink';
import {
  isRejectedPasswordResetTokenError,
  resolvePasswordResetSubmissionError,
  validateResetPassword,
  type ResetPasswordErrors,
} from '@/auth/passwordResetModel';
import {
  CapabilityStatusNotice,
  useCapabilityGate,
} from '@/capabilities';
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

const INVALID_RESET_LINK = 'This reset link is invalid or incomplete.';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const tokenResolution = useMemo(
    () => resolvePasswordResetTokenParam(params.token),
    [params.token],
  );
  const token = tokenResolution.token;
  const insets = useSafeAreaInsets();
  const { t } = useLocalization();
  const { resetPassword } = useAuthSession();
  const passwordReset = useCapabilityGate('passwordReset');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<ResetPasswordErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (tokenResolution.status !== 'invalid') return;
    router.setParams({ token: undefined });
  }, [router, tokenResolution.status]);

  const handleSubmit = async () => {
    if (
      isSubmitting ||
      !passwordReset.canUse ||
      tokenResolution.status !== 'valid'
    ) {
      return;
    }
    const errors = validateResetPassword({ token, newPassword, confirmPassword });
    setFieldErrors(errors);
    setFormError(null);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      await resetPassword({ token, newPassword });
      router.setParams({ token: undefined });
      setNewPassword('');
      setConfirmPassword('');
      setCompleted(true);
    } catch (error) {
      if (isRejectedPasswordResetTokenError(error)) {
        router.setParams({ token: undefined });
      }
      setFormError(resolvePasswordResetSubmissionError(error, 'reset'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const invalidLinkMessage = localizePasswordResetMessage(
    formError ?? INVALID_RESET_LINK,
    t,
    'passwordReset.error.resetGeneric',
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardRoot}>
      <ScrollView
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.four, paddingTop: insets.top + Spacing.four },
        ]}
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.screen}>
        <View style={styles.container}>
          <ScreenHeader
            actionLabel={t('common.back')}
            onActionPress={() => router.back()}
            subtitle={
              completed
                ? t('passwordReset.reset.successBody')
                : t('passwordReset.reset.subtitle')
            }
            title={
              completed
                ? t('passwordReset.reset.successTitle')
                : t('passwordReset.reset.title')
            }
          />
          <AppCard>
            {!passwordReset.canUse ? (
              <>
                <CapabilityStatusNotice gate={passwordReset} />
                <SecondaryButton
                  label={t('passwordReset.backToSignIn')}
                  onPress={() => router.replace('/auth/sign-in')}
                />
              </>
            ) : completed ? (
              <SecondaryButton
                label={t('passwordReset.backToSignIn')}
                onPress={() => router.replace('/auth/sign-in')}
              />
            ) : tokenResolution.status !== 'valid' ? (
              <>
                <InlineError message={invalidLinkMessage} />
                <SecondaryButton
                  label={t('passwordReset.requestNew')}
                  onPress={() => router.replace('/auth/forgot-password')}
                />
                <SecondaryButton
                  label={t('passwordReset.backToSignIn')}
                  onPress={() => router.replace('/auth/sign-in')}
                />
              </>
            ) : (
              <>
                <InlineError
                  message={localizePasswordResetMessage(
                    fieldErrors.token ?? formError,
                    t,
                    'passwordReset.error.resetGeneric',
                  )}
                />
                <FormField
                  autoCapitalize="none"
                  autoComplete="new-password"
                  errorMessage={localizeAuthValidation(fieldErrors.newPassword, t)}
                  label={t('passwordReset.reset.newPassword')}
                  onChangeText={(value) => {
                    setNewPassword(value);
                    if (fieldErrors.newPassword) {
                      setFieldErrors((current) => ({ ...current, newPassword: undefined }));
                    }
                  }}
                  placeholder="••••••••"
                  secureTextEntry
                  textContentType="newPassword"
                  value={newPassword}
                />
                <FormField
                  autoCapitalize="none"
                  autoComplete="new-password"
                  errorMessage={localizeAuthValidation(fieldErrors.confirmPassword, t)}
                  label={t('passwordReset.reset.confirmPassword')}
                  onChangeText={(value) => {
                    setConfirmPassword(value);
                    if (fieldErrors.confirmPassword) {
                      setFieldErrors((current) => ({ ...current, confirmPassword: undefined }));
                    }
                  }}
                  placeholder="••••••••"
                  secureTextEntry
                  textContentType="newPassword"
                  value={confirmPassword}
                />
                <PrimaryButton
                  disabled={isSubmitting}
                  label={t('passwordReset.reset.action')}
                  loading={isSubmitting}
                  onPress={handleSubmit}
                />
                <SecondaryButton
                  label={t('passwordReset.requestNew')}
                  onPress={() => router.replace('/auth/forgot-password')}
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
  content: {
    alignItems: 'center',
    flexGrow: 1,
    paddingHorizontal: Spacing.three,
  },
  keyboardRoot: { flex: 1 },
  screen: { backgroundColor: Colors.dark.background, flex: 1 },
});
