import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { createSocialApi, type SocialProfileVisibility } from '@/api/social';
import { AppCard } from '@/components/ui/AppCard';
import { FormField } from '@/components/ui/FormField';
import { InlineError } from '@/components/ui/InlineError';
import { LoadingState } from '@/components/ui/LoadingState';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Colors, MaxContentWidth, Radii, Spacing, Typography } from '@/constants/theme';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useLocalization } from '@/localization';
import { useAppTheme } from '@/theme/AppThemeProvider';

import { SocialManagedAvatarCard } from '../SocialManagedAvatarCard';
import { getSocialManagedAvatarCopy } from '../socialManagedAvatarCopy';
import { getSocialProfileCopy } from '../socialProfileCopy';
import {
  buildSocialProfileInput,
  createSocialProfileFormValues,
  getSocialProfileRequestError,
  validateSocialProfileForm,
  type SocialProfileFormValues,
} from '../socialProfileForm';
import { getSocialRateLimitMessage } from '../socialRateLimitCopy';
import { useSocialManagedAvatar } from '../useSocialManagedAvatar';

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export default function SocialProfileEditorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { locale, t } = useLocalization();
  const copy = getSocialProfileCopy(locale);
  const avatarCopy = getSocialManagedAvatarCopy(locale);
  const { isAuthenticated, profile: accountProfile, ready, refresh, session } = useAuthSession();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const requestSequence = useRef(0);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>('idle');
  const [profileExists, setProfileExists] = useState(false);
  const [values, setValues] = useState<SocialProfileFormValues>(() =>
    createSocialProfileFormValues(null, ''),
  );
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  const auth = useMemo(
    () => ({
      getAccessToken: async () => session?.tokens.accessToken ?? null,
      refreshAccessToken: async () => (await refresh())?.tokens.accessToken ?? null,
    }),
    [refresh, session?.tokens.accessToken],
  );
  const socialApi = useMemo(() => createSocialApi(auth), [auth]);
  const managedAvatar = useSocialManagedAvatar({
    accountId: accountProfile?.id ?? null,
    api: socialApi,
    copy: avatarCopy,
    profileExists,
  });

  const requestErrorCopy = useCallback(
    (error: unknown): string => {
      const rateLimitMessage = getSocialRateLimitMessage(error, locale);
      if (rateLimitMessage) return rateLimitMessage;
      const state = getSocialProfileRequestError(error);
      if (state === 'username_taken') return copy.errorUsernameTaken;
      if (state === 'offline') return copy.errorOffline;
      if (state === 'session_expired') return copy.errorSessionExpired;
      return copy.errorGeneric;
    },
    [copy, locale],
  );

  const loadProfile = useCallback(async () => {
    if (!isAuthenticated) return;
    const sequence = ++requestSequence.current;
    setLoadStatus('loading');
    setRequestError(null);
    try {
      const profile = await socialApi.getOwnProfile();
      if (sequence !== requestSequence.current) return;
      setProfileExists(Boolean(profile));
      setValues(
        createSocialProfileFormValues(profile, accountProfile?.displayName ?? ''),
      );
      setSubmitted(false);
      setLoadStatus('ready');
    } catch (error) {
      if (sequence !== requestSequence.current) return;
      setRequestError(requestErrorCopy(error));
      setLoadStatus('error');
    }
  }, [accountProfile?.displayName, isAuthenticated, requestErrorCopy, socialApi]);

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated) {
      requestSequence.current += 1;
      setLoadStatus('idle');
      setProfileExists(false);
      setRequestError(null);
      return;
    }
    void loadProfile();
    return () => {
      requestSequence.current += 1;
    };
  }, [isAuthenticated, loadProfile, ready]);

  const errors = useMemo(() => validateSocialProfileForm(values), [values]);
  const hasErrors = Object.keys(errors).length > 0;
  const visibilityOptions: ReadonlyArray<{
    label: string;
    value: SocialProfileVisibility;
  }> = [
    { label: copy.visibilityPublic, value: 'public' },
    { label: copy.visibilityPrivate, value: 'private' },
  ];

  const getFieldError = (
    field: keyof typeof errors,
  ): string | undefined => {
    if (!submitted || !errors[field]) return undefined;
    const code = errors[field];
    if (field === 'username') {
      return code === 'required'
        ? copy.validationUsernameRequired
        : copy.validationUsernameFormat;
    }
    if (field === 'displayName') {
      return code === 'required'
        ? copy.validationDisplayNameRequired
        : copy.validationDisplayNameLength;
    }
    return copy.validationBioLength;
  };

  const updateValue = <Key extends keyof SocialProfileFormValues>(
    key: Key,
    value: SocialProfileFormValues[Key],
  ) => setValues((current) => ({ ...current, [key]: value }));

  const save = async () => {
    if (saving) return;
    setSubmitted(true);
    setRequestError(null);
    if (hasErrors) return;

    setSaving(true);
    try {
      const profile = await socialApi.upsertOwnProfile(buildSocialProfileInput(values));
      setValues(createSocialProfileFormValues(profile, accountProfile?.displayName ?? ''));
      setProfileExists(true);
      setSubmitted(false);
      Alert.alert(copy.savedTitle, copy.savedBody);
    } catch (error) {
      setRequestError(requestErrorCopy(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + Spacing.eight },
      ]}
      keyboardShouldPersistTaps="handled"
      style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Pressable
            accessibilityLabel={t('common.back')}
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Text style={styles.backLabel}>‹</Text>
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
            <Text style={styles.title}>{copy.title}</Text>
            <Text style={styles.subtitle}>{copy.subtitle}</Text>
          </View>
        </View>

        {!ready || loadStatus === 'loading' ? (
          <AppCard>
            <LoadingState label={copy.loading} />
          </AppCard>
        ) : null}

        {ready && !isAuthenticated ? (
          <AppCard>
            <Text style={styles.cardTitle}>{copy.signInTitle}</Text>
            <Text style={styles.body}>{copy.signInBody}</Text>
            <PrimaryButton
              label={copy.signInAction}
              onPress={() => router.push('/auth/sign-in')}
            />
          </AppCard>
        ) : null}

        {ready && isAuthenticated && loadStatus === 'error' ? (
          <AppCard>
            <InlineError message={requestError ?? copy.loadError} />
            <SecondaryButton label={copy.retry} onPress={loadProfile} />
          </AppCard>
        ) : null}

        {ready && isAuthenticated && loadStatus === 'ready' ? (
          <AppCard>
            <FormField
              autoCapitalize="none"
              autoCorrect={false}
              errorMessage={getFieldError('username')}
              helperText={copy.usernameHelp}
              label={copy.username}
              maxLength={30}
              onChangeText={(value) => updateValue('username', value)}
              placeholder={copy.usernamePlaceholder}
              textContentType="username"
              value={values.username}
            />
            <FormField
              autoCapitalize="words"
              errorMessage={getFieldError('displayName')}
              label={copy.displayName}
              maxLength={80}
              onChangeText={(value) => updateValue('displayName', value)}
              placeholder={copy.displayNamePlaceholder}
              value={values.displayName}
            />
            <FormField
              errorMessage={getFieldError('bio')}
              helperText={copy.bioHelp}
              label={copy.bio}
              maxLength={280}
              multiline
              onChangeText={(value) => updateValue('bio', value)}
              placeholder={copy.bioPlaceholder}
              style={styles.multilineInput}
              textAlignVertical="top"
              value={values.bio}
            />
            <SocialManagedAvatarCard controller={managedAvatar} copy={avatarCopy} />
            <View style={styles.visibilityGroup}>
              <Text style={styles.label}>{copy.visibility}</Text>
              <Text style={styles.help}>{copy.visibilityHelp}</Text>
              <SegmentedControl
                accessibilityLabel={copy.visibility}
                onChange={(value) => updateValue('visibility', value)}
                options={visibilityOptions}
                value={values.visibility}
              />
            </View>
            <Text style={styles.privacyNote}>{copy.privacyNote}</Text>
            <InlineError message={requestError} />
            <PrimaryButton
              disabled={saving}
              label={saving ? copy.saving : copy.save}
              loading={saving}
              onPress={save}
            />
          </AppCard>
        ) : null}
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: typeof Colors.dark) =>
  StyleSheet.create({
    backButton: {
      alignItems: 'center',
      borderColor: colors.borderSubtle,
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    backLabel: { color: colors.textPrimary, fontSize: 32, lineHeight: 34 },
    body: {
      color: colors.textSecondary,
      fontSize: Typography.body.fontSize,
      lineHeight: Typography.body.lineHeight,
    },
    cardTitle: {
      color: colors.textPrimary,
      fontSize: Typography.cardTitle.fontSize,
      fontWeight: Typography.cardTitle.fontWeight,
      lineHeight: Typography.cardTitle.lineHeight,
    },
    container: { gap: Spacing.four, maxWidth: MaxContentWidth, width: '100%' },
    content: {
      alignItems: 'center',
      paddingHorizontal: Spacing.four,
      paddingTop: Spacing.four,
    },
    eyebrow: {
      color: colors.accent,
      fontSize: Typography.caption.fontSize,
      fontWeight: '800',
      letterSpacing: 1.2,
    },
    headerCopy: { flex: 1, gap: Spacing.one },
    headerRow: { alignItems: 'flex-start', flexDirection: 'row', gap: Spacing.three },
    help: {
      color: colors.textSecondary,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    label: {
      color: colors.textSecondary,
      fontSize: Typography.label.fontSize,
      fontWeight: Typography.label.fontWeight,
      lineHeight: Typography.label.lineHeight,
    },
    multilineInput: { minHeight: 112 },
    pressed: { opacity: 0.72 },
    privacyNote: {
      color: colors.textMuted,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    screen: { backgroundColor: colors.background, flex: 1 },
    subtitle: {
      color: colors.textSecondary,
      fontSize: Typography.body.fontSize,
      lineHeight: Typography.body.lineHeight,
    },
    title: {
      color: colors.textPrimary,
      fontSize: Typography.screenTitle.fontSize,
      fontWeight: Typography.screenTitle.fontWeight,
      letterSpacing: Typography.screenTitle.letterSpacing,
      lineHeight: Typography.screenTitle.lineHeight,
    },
    visibilityGroup: { gap: Spacing.one },
  });
