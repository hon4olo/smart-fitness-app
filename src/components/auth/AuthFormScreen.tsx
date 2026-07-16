import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { validateLoginForm, validateRegisterForm, type LoginFormValues, type RegisterFormValues } from '@/auth/auth-ui';
import { AppCard } from '@/components/ui/AppCard';
import { FormField } from '@/components/ui/FormField';
import { InlineError } from '@/components/ui/InlineError';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { resolveAuthSubmissionErrorMessage } from './auth-presentation';

export type AuthFormScreenMode = 'login' | 'register';

export type AuthFormScreenProps = {
  mode: AuthFormScreenMode;
  onBack: () => void;
  onSubmit(values: LoginFormValues | RegisterFormValues): Promise<void>;
  onSwitchMode: () => void;
};

const copyByMode: Record<AuthFormScreenMode, { button: string; subtitle: string; switchLabel: string; title: string }> = {
  login: {
    button: 'Sign in',
    subtitle: 'Use your account to keep backup ready and continue where you left off.',
    switchLabel: 'Create account',
    title: 'Sign in',
  },
  register: {
    button: 'Create account',
    subtitle: 'Create an account to prepare sync and backup for this profile.',
    switchLabel: 'Sign in',
    title: 'Create account',
  },
};

export function AuthFormScreen({ mode, onBack, onSubmit, onSwitchMode }: AuthFormScreenProps) {
  const safeAreaInsets = useSafeAreaInsets();
  const copy = copyByMode[mode];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<'email' | 'password' | 'confirmPassword' | 'displayName', string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const registerPayload = useMemo<RegisterFormValues>(
    () => ({ email, password, confirmPassword, displayName }),
    [confirmPassword, displayName, email, password]
  );

  const loginPayload = useMemo<LoginFormValues>(() => ({ email, password }), [email, password]);

  const clearSensitiveState = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setDisplayName('');
    setFieldErrors({});
    setFormError(null);
  };

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    const errors = mode === 'login' ? validateLoginForm(loginPayload) : validateRegisterForm(registerPayload);
    setFieldErrors(errors);
    setFormError(null);

    if (Object.keys(errors).length > 0) {
      return;
    }

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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardRoot}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: safeAreaInsets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        style={styles.screen}>
        <View style={styles.container}>
          <ScreenHeader actionLabel="Back" onActionPress={onBack} subtitle={copy.subtitle} title={copy.title} />

          <AppCard>
            <InlineError message={formError} />

            <FormField
              autoCapitalize="none"
              autoComplete="email"
              errorMessage={fieldErrors.email}
              keyboardType="email-address"
              label="Email"
              onChangeText={(value) => {
                setEmail(value);
                if (fieldErrors.email) {
                  setFieldErrors((current) => ({ ...current, email: undefined }));
                }
              }}
              placeholder="you@example.com"
              textContentType="emailAddress"
              value={email}
            />

            <FormField
              autoCapitalize="none"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              errorMessage={fieldErrors.password}
              label="Password"
              onChangeText={(value) => {
                setPassword(value);
                if (fieldErrors.password) {
                  setFieldErrors((current) => ({ ...current, password: undefined }));
                }
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
                  errorMessage={fieldErrors.confirmPassword}
                  label="Confirm password"
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

                <FormField
                  autoCapitalize="words"
                  autoComplete="name"
                  errorMessage={fieldErrors.displayName}
                  helperText="Optional"
                  label="Display name"
                  onChangeText={(value) => {
                    setDisplayName(value);
                    if (fieldErrors.displayName) {
                      setFieldErrors((current) => ({ ...current, displayName: undefined }));
                    }
                  }}
                  placeholder="Alex"
                  textContentType="name"
                  value={displayName}
                />
              </>
            ) : null}

            <PrimaryButton disabled={isSubmitting} label={copy.button} loading={isSubmitting} onPress={handleSubmit} />
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
  keyboardRoot: {
    flex: 1,
  },
  screen: {
    backgroundColor: Colors.dark.background,
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    padding: Spacing.three,
    paddingTop: Spacing.four,
  },
});
