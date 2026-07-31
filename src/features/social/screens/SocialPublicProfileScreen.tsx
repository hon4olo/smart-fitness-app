import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  createSocialApi,
  type SocialProfileViewDto,
  type SocialRelationshipDto,
} from '@/api/social';
import { AppCard } from '@/components/ui/AppCard';
import { DestructiveButton } from '@/components/ui/DestructiveButton';
import { InlineError } from '@/components/ui/InlineError';
import { LoadingState } from '@/components/ui/LoadingState';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Spacing } from '@/constants/theme';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useLocalization } from '@/localization';
import { useAppTheme } from '@/theme/AppThemeProvider';

import { getSocialPublicProfileCopy } from '../socialPublicProfileCopy';
import {
  getSocialActionError,
  getSocialPrimaryAction,
  getSocialProfileLoadError,
  normalizeSocialLookupUsername,
  validateSocialLookupUsername,
  type SocialActionError,
  type SocialProfileLoadError,
} from '../socialPublicProfileModel';
import { getSocialRateLimitMessage } from '../socialRateLimitCopy';
import { getSocialWorkoutPostSurfaceCopy } from '../socialWorkoutPostSurfaceCopy';
import {
  createSocialPublicProfileStyles,
  type SocialPublicProfileStyles,
} from './SocialPublicProfileScreen.styles';

type ProfileStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'private'
  | 'blocked'
  | 'blocked_by_viewer'
  | 'not_found'
  | 'error';

type BusyAction =
  | 'follow'
  | 'unfollow'
  | 'cancel_request'
  | 'approve'
  | 'reject'
  | 'block'
  | 'unblock'
  | null;

const readUsername = (value: string | string[] | undefined): string =>
  normalizeSocialLookupUsername(Array.isArray(value) ? value[0] ?? '' : value ?? '');

export default function SocialPublicProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ username?: string | string[] }>();
  const username = readUsername(params.username);
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { locale, t } = useLocalization();
  const copy = getSocialPublicProfileCopy(locale);
  const postsCopy = getSocialWorkoutPostSurfaceCopy(locale);
  const { isAuthenticated, ready, refresh, session } = useAuthSession();
  const styles = useMemo(() => createSocialPublicProfileStyles(colors), [colors]);
  const requestSequence = useRef(0);
  const [status, setStatus] = useState<ProfileStatus>('idle');
  const [profileView, setProfileView] = useState<SocialProfileViewDto | null>(null);
  const [privateRelationship, setPrivateRelationship] =
    useState<SocialRelationshipDto | null>(null);
  const [ownUsername, setOwnUsername] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<SocialProfileLoadError | null>(null);
  const [actionError, setActionError] = useState<SocialActionError | null>(null);
  const [actionRateLimitMessage, setActionRateLimitMessage] = useState<string | null>(
    null,
  );
  const [busyAction, setBusyAction] = useState<BusyAction>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const auth = useMemo(
    () => ({
      getAccessToken: async () => session?.tokens.accessToken ?? null,
      refreshAccessToken: async () => (await refresh())?.tokens.accessToken ?? null,
    }),
    [refresh, session?.tokens.accessToken],
  );
  const socialApi = useMemo(() => createSocialApi(auth), [auth]);

  const loadProfile = useCallback(async () => {
    if (!isAuthenticated) return;
    if (validateSocialLookupUsername(username)) {
      setStatus('not_found');
      return;
    }

    const sequence = ++requestSequence.current;
    setStatus('loading');
    setProfileView(null);
    setPrivateRelationship(null);
    setLoadError(null);
    setActionError(null);
    setActionRateLimitMessage(null);
    setAvatarFailed(false);

    try {
      const ownProfile = await socialApi.getOwnProfile();
      if (sequence !== requestSequence.current) return;
      setOwnUsername(ownProfile?.username ?? null);

      try {
        const view = await socialApi.getProfile(username);
        if (sequence !== requestSequence.current) return;
        setProfileView(view);
        setStatus('ready');
      } catch (error) {
        if (sequence !== requestSequence.current) return;
        const state = getSocialProfileLoadError(error);
        setLoadError(state);
        setStatus(
          state === 'private'
            ? 'private'
            : state === 'blocked_by_viewer'
              ? 'blocked_by_viewer'
              : state === 'blocked'
                ? 'blocked'
                : state === 'not_found'
                  ? 'not_found'
                  : 'error',
        );
      }
    } catch (error) {
      if (sequence !== requestSequence.current) return;
      setLoadError(getSocialProfileLoadError(error));
      setStatus('error');
    }
  }, [isAuthenticated, socialApi, username]);

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated) {
      requestSequence.current += 1;
      setStatus('idle');
      return;
    }
    void loadProfile();
    return () => {
      requestSequence.current += 1;
    };
  }, [isAuthenticated, loadProfile, ready]);

  const actionErrorMessage = useMemo(() => {
    if (actionRateLimitMessage) return actionRateLimitMessage;
    if (actionError === 'offline') return copy.actionErrorOffline;
    if (actionError === 'session_expired') return copy.actionErrorSession;
    if (actionError === 'unavailable') return copy.actionErrorUnavailable;
    if (actionError === 'generic') return copy.actionErrorGeneric;
    return null;
  }, [actionError, actionRateLimitMessage, copy]);

  const loadErrorMessage = useMemo(() => {
    if (loadError === 'offline') return copy.actionErrorOffline;
    if (loadError === 'session_expired') return copy.actionErrorSession;
    return copy.loadError;
  }, [copy, loadError]);

  const setActionFailure = (error: unknown) => {
    setActionRateLimitMessage(getSocialRateLimitMessage(error, locale));
    setActionError(getSocialActionError(error));
  };

  const clearActionError = () => {
    setActionError(null);
    setActionRateLimitMessage(null);
  };

  const runRelationshipAction = async (
    action: Exclude<BusyAction, 'block' | 'unblock' | null>,
  ) => {
    if (busyAction) return;
    setBusyAction(action);
    clearActionError();
    try {
      const relationship =
        action === 'follow'
          ? await socialApi.follow(username)
          : action === 'approve'
            ? await socialApi.approveFollowRequest(username)
            : action === 'reject'
              ? await socialApi.rejectFollowRequest(username)
              : await socialApi.unfollow(username);

      if (status === 'private') {
        setPrivateRelationship(relationship);
      } else if (
        status === 'ready' &&
        profileView &&
        action === 'unfollow' &&
        profileView.profile.visibility === 'private' &&
        !relationship.following
      ) {
        setProfileView(null);
        setPrivateRelationship(relationship);
        setStatus('private');
      } else if (status === 'ready' && profileView) {
        setProfileView({ ...profileView, relationship });
      }
    } catch (error) {
      setActionFailure(error);
    } finally {
      setBusyAction(null);
    }
  };

  const blockProfile = async () => {
    if (busyAction) return;
    setBusyAction('block');
    clearActionError();
    try {
      const relationship = await socialApi.block(username);
      setProfileView(null);
      setPrivateRelationship(relationship);
      setStatus('blocked_by_viewer');
    } catch (error) {
      setActionFailure(error);
    } finally {
      setBusyAction(null);
    }
  };

  const confirmBlock = () => {
    Alert.alert(copy.blockTitle, copy.blockBody, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: copy.blockConfirm, style: 'destructive', onPress: blockProfile },
    ]);
  };

  const unblockProfile = async () => {
    if (busyAction) return;
    setBusyAction('unblock');
    clearActionError();
    try {
      await socialApi.unblock(username);
      await loadProfile();
    } catch (error) {
      setActionFailure(error);
    } finally {
      setBusyAction(null);
    }
  };

  const relationship = profileView?.relationship ?? privateRelationship;
  const isOwnProfile = Boolean(profileView && ownUsername === profileView.profile.username);
  const primaryAction = isOwnProfile ? null : getSocialPrimaryAction(relationship);
  const primaryLabel =
    primaryAction === 'unfollow'
      ? copy.unfollow
      : primaryAction === 'cancel_request'
        ? copy.cancelRequest
        : status === 'private'
          ? copy.requestFollow
          : copy.follow;
  const primaryBusy =
    primaryAction === 'unfollow'
      ? busyAction === 'unfollow'
      : primaryAction === 'cancel_request'
        ? busyAction === 'cancel_request'
        : busyAction === 'follow';

  const runPrimaryAction = () => {
    if (primaryAction === 'unfollow') void runRelationshipAction('unfollow');
    else if (primaryAction === 'cancel_request') {
      void runRelationshipAction('cancel_request');
    } else if (primaryAction === 'follow') void runRelationshipAction('follow');
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + Spacing.eight },
      ]}
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
            <Text style={styles.eyebrow}>{copy.profileEyebrow}</Text>
            <Text style={styles.title}>@{username}</Text>
          </View>
        </View>

        {!ready || (ready && isAuthenticated && (status === 'idle' || status === 'loading')) ? (
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

        {ready && isAuthenticated && status === 'not_found' ? (
          <StateCard body={copy.notFoundBody} title={copy.notFoundTitle} styles={styles}>
            <SecondaryButton label={copy.findAction} onPress={() => router.replace('/social')} />
          </StateCard>
        ) : null}

        {ready && isAuthenticated && status === 'blocked' ? (
          <StateCard body={copy.blockedBody} title={copy.blockedTitle} styles={styles} />
        ) : null}

        {ready && isAuthenticated && status === 'blocked_by_viewer' ? (
          <StateCard body={copy.blockedBody} title={copy.blockedTitle} styles={styles}>
            <InlineError message={actionErrorMessage} />
            <SecondaryButton
              disabled={busyAction === 'unblock'}
              label={copy.unblock}
              loading={busyAction === 'unblock'}
              onPress={unblockProfile}
            />
          </StateCard>
        ) : null}

        {ready && isAuthenticated && status === 'error' ? (
          <StateCard body={loadErrorMessage} title={copy.loadErrorTitle} styles={styles}>
            <SecondaryButton label={copy.retry} onPress={loadProfile} />
          </StateCard>
        ) : null}

        {ready && isAuthenticated && status === 'private' ? (
          <StateCard body={copy.privateBody} title={copy.privateTitle} styles={styles}>
            {relationship?.outgoingRequest ? (
              <Text style={styles.relationshipLabel}>{copy.requestPending}</Text>
            ) : null}
            <InlineError message={actionErrorMessage} />
            {primaryAction ? (
              <PrimaryButton
                disabled={primaryBusy}
                label={primaryLabel}
                loading={primaryBusy}
                onPress={runPrimaryAction}
              />
            ) : null}
            <DestructiveButton
              disabled={busyAction === 'block'}
              label={copy.block}
              loading={busyAction === 'block'}
              onPress={confirmBlock}
            />
          </StateCard>
        ) : null}

        {ready && isAuthenticated && status === 'ready' && profileView ? (
          <AppCard>
            <View style={styles.identityRow}>
              {profileView.profile.avatarUrl && !avatarFailed ? (
                <Image
                  accessibilityIgnoresInvertColors
                  onError={() => setAvatarFailed(true)}
                  source={{ uri: profileView.profile.avatarUrl }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitial}>
                    {profileView.profile.displayName.trim().charAt(0).toUpperCase() || '?'}
                  </Text>
                </View>
              )}
              <View style={styles.identityCopy}>
                <Text style={styles.displayName}>{profileView.profile.displayName}</Text>
                <Text style={styles.username}>@{profileView.profile.username}</Text>
                <Text style={styles.visibilityBadge}>
                  {profileView.profile.visibility === 'private'
                    ? copy.visibilityPrivate
                    : copy.visibilityPublic}
                </Text>
              </View>
            </View>

            <Text style={styles.bio}>{profileView.profile.bio || copy.noBio}</Text>

            <SecondaryButton
              label={postsCopy.postsAction}
              onPress={() =>
                router.push({
                  pathname: '/social/posts/[username]',
                  params: { username: profileView.profile.username },
                })
              }
            />

            {isOwnProfile ? <Text style={styles.relationshipLabel}>{copy.ownProfile}</Text> : null}
            {!isOwnProfile && profileView.relationship.following ? (
              <Text style={styles.relationshipLabel}>{copy.following}</Text>
            ) : null}
            {!isOwnProfile && profileView.relationship.followedBy ? (
              <Text style={styles.relationshipLabel}>{copy.followsYou}</Text>
            ) : null}
            {!isOwnProfile && profileView.relationship.outgoingRequest ? (
              <Text style={styles.relationshipLabel}>{copy.requestPending}</Text>
            ) : null}
            {!isOwnProfile && profileView.relationship.incomingRequest ? (
              <Text style={styles.relationshipLabel}>{copy.requestedToFollow}</Text>
            ) : null}

            <InlineError message={actionErrorMessage} />

            {isOwnProfile ? (
              <PrimaryButton
                label={copy.editOwnProfile}
                onPress={() => router.push('/settings/social-profile')}
              />
            ) : null}

            {!isOwnProfile && profileView.relationship.incomingRequest ? (
              <View style={styles.actionStack}>
                <PrimaryButton
                  disabled={busyAction === 'approve'}
                  label={copy.approveRequest}
                  loading={busyAction === 'approve'}
                  onPress={() => void runRelationshipAction('approve')}
                />
                <SecondaryButton
                  disabled={busyAction === 'reject'}
                  label={copy.rejectRequest}
                  loading={busyAction === 'reject'}
                  onPress={() => void runRelationshipAction('reject')}
                />
              </View>
            ) : null}

            {!isOwnProfile && primaryAction ? (
              <PrimaryButton
                disabled={primaryBusy}
                label={primaryLabel}
                loading={primaryBusy}
                onPress={runPrimaryAction}
              />
            ) : null}

            {!isOwnProfile ? (
              <DestructiveButton
                disabled={busyAction === 'block'}
                label={copy.block}
                loading={busyAction === 'block'}
                onPress={confirmBlock}
              />
            ) : null}
          </AppCard>
        ) : null}
      </View>
    </ScrollView>
  );
}

function StateCard({
  body,
  children,
  styles,
  title,
}: {
  body: string;
  children?: React.ReactNode;
  styles: SocialPublicProfileStyles;
  title: string;
}) {
  return (
    <AppCard>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {children}
    </AppCard>
  );
}
