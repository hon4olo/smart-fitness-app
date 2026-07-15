import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import {
  getSafeLoginErrorMessage,
  getSafeRegisterErrorMessage,
  validateLoginForm,
  validateRegisterForm,
  type LoginFormValues,
  type RegisterFormValues,
} from '@/auth/auth-ui';

export type AuthFormScreenMode = 'login' | 'register';

export type AuthFormScreenProps = {
  mode: AuthFormScreenMode;
  onSubmit(values: LoginFormValues | RegisterFormValues): Promise<void>;
  onSwitchMode: () => void;
};

const submitCopy: Record<AuthFormScreenMode, { button: string; heading: string; subtitle: string; error: string; switchLabel: string }> = {
  login: {
    button: 'Sign in',
    heading: 'Sign in',
    subtitle:
      'Use your account to prepare sync and backup. Local data stays on this device, and workouts, nutrition, and progress are still local in this build.',
    error: getSafeLoginErrorMessage(),
    switchLabel: 'Create account',
  },
  register: {
    button: 'Create account',
    heading: 'Create account',
    subtitle:
      'Create a cloud-ready account. Local data stays on this device, and this build does not sync workouts, nutrition, or progress yet.',
    error: getSafeRegisterErrorMessage(),
    switchLabel: 'Sign in',
  },
};

export function AuthFormScreen({ mode, onSubmit, onSwitchMode }: AuthFormScreenProps) {
  const safeAreaInsets = useSafeAreaInsets();
  const copy = submitCopy[mode];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<'email' | 'password' | 'confirmPassword' | 'displayName', string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const registerPayload = useMemo<RegisterFormValues>(
    () => ({
      email,
      password,
      confirmPassword,
      displayName,
    }),
    [confirmPassword, displayName, email, password]
  );

  const loginPayload = useMemo<LoginFormValues>(
    () => ({
      email,
      password,
    }),
    [email, password]
  );

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
    } catch {
      setFormError(copy.error);
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
          <AppCard>
            <Text style={styles.title}>{copy.heading}</Text>
            <Text style={styles.subtitle}>{copy.subtitle}</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                accessibilityLabel="Email address"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                onChangeText={(value) => {
                  setEmail(value);
                  if (fieldErrors.email) {
                    setFieldErrors((current) => ({ ...current, email: undefined }));
                  }
                }}
                placeholder="you@example.com"
                placeholderTextColor={Colors.dark.textSecondary}
                returnKeyType="next"
                style={styles.input}
                textContentType="emailAddress"
                value={email}
              />
              {fieldErrors.email ? <Text style={styles.errorText}>{fieldErrors.email}</Text> : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                accessibilityLabel="Password"
                autoCapitalize="none"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                onChangeText={(value) => {
                  setPassword(value);
                  if (fieldErrors.password) {
                    setFieldErrors((current) => ({ ...current, password: undefined }));
                  }
                }}
                placeholder="••••••••"
                placeholderTextColor={Colors.dark.textSecondary}
                secureTextEntry
                style={styles.input}
                textContentType={mode === 'login' ? 'password' : 'newPassword'}
                value={password}
              />
              {fieldErrors.password ? <Text style={styles.errorText}>{fieldErrors.password}</Text> : null}
            </View>

            {mode === 'register' ? (
              <>
                <View style={styles.field}>
                  <Text style={styles.label}>Confirm password</Text>
                  <TextInput
                    accessibilityLabel="Confirm password"
                    autoCapitalize="none"
                    autoComplete="new-password"
                    onChangeText={(value) => {
                      setConfirmPassword(value);
                      if (fieldErrors.confirmPassword) {
                        setFieldErrors((current) => ({ ...current, confirmPassword: undefined }));
                      }
                    }}
                    placeholder="••••••••"
                    placeholderTextColor={Colors.dark.textSecondary}
                    secureTextEntry
                    style={styles.input}
                    textContentType="newPassword"
                    value={confirmPassword}
                  />
                  {fieldErrors.confirmPassword ? <Text style={styles.errorText}>{fieldErrors.confirmPassword}</Text> : null}
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Display name (optional)</Text>
                  <TextInput
                    accessibilityLabel="Display name, optional"
                    autoCapitalize="words"
                    autoComplete="name"
                    onChangeText={(value) => {
                      setDisplayName(value);
                      if (fieldErrors.displayName) {
                        setFieldErrors((current) => ({ ...current, displayName: undefined }));
                      }
                    }}
                    placeholder="Alex"
                    placeholderTextColor={Colors.dark.textSecondary}
                    style={styles.input}
                    textContentType="name"
                    value={displayName}
                  />
                  {fieldErrors.displayName ? <Text style={styles.errorText}>{fieldErrors.displayName}</Text> : null}
                </View>
              </>
            ) : null}

            {formError ? <Text style={styles.formError}>{formError}</Text> : null}

            <AppButton disabled={isSubmitting} label={isSubmitting ? `${copy.button}…` : copy.button} onPress={handleSubmit} />
            <AppButton label={copy.switchLabel} onPress={onSwitchMode} variant="secondary" />
          </AppCard>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: MaxContentWidth,
    width: '100%' as const,
  },
  errorText: {
    color: '#FF9CA5',
    fontSize: 12,
    lineHeight: 17,
  },
  field: {
    gap: Spacing.one,
    marginBottom: Spacing.two,
  },
  formError: {
    color: '#FF9CA5',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.two,
  },
  input: {
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 10,
    borderWidth: 1,
    color: Colors.dark.text,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: Spacing.two,
  },
  keyboardRoot: {
    flex: 1,
  },
  label: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  screen: {
    backgroundColor: Colors.dark.background,
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center' as const,
    padding: Spacing.three,
    paddingTop: Spacing.four,
  },
  subtitle: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: Spacing.three,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: Spacing.one,
  },
});
