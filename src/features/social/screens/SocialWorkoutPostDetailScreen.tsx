import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  createSocialApi,
  type SocialWorkoutPostDto,
  type SocialWorkoutReactionDto,
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

import { SocialWorkoutPostDetailContent } from '../SocialWorkoutPostDetailContent';
import { SocialWorkoutReactionCard } from '../SocialWorkoutReactionCard';
import { getSocialWorkoutPostSurfaceCopy } from '../socialWorkoutPostSurfaceCopy';
import {
  getSocialWorkoutPostLoadError,
  type SocialWorkoutPostLoadError,
} from '../socialWorkoutPostSurfaceModel';
import {
  getSocialWorkoutReactionError,
  type SocialWorkoutReactionError,
} from '../socialWorkoutReactionModel';
import { createSocialWorkoutPostSurfaceStyles } from './SocialWorkoutPostSurface.styles';

type DetailStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'private'
  | 'blocked'
  | 'not_found'
  | 'deleted'
  | 'error';

const readParam = (value: string | string[] | undefined): string =>
  (Array.isArray(value) ? value[0] ?? '' : value ?? '').trim();

export default function SocialWorkoutPostDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ postId?: string | string[] }>();
  const postId = readParam(params.postId);
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { locale, t } = useLocalization();
  const copy = getSocialWorkoutPostSurfaceCopy(locale);
  const styles = useMemo(() => createSocialWorkoutPostSurfaceStyles(colors), [colors]);
  const { isAuthenticated, ready, refresh, session } = useAuthSession();
  const requestSequence = useRef(0);
  const [status, setStatus] = useState<DetailStatus>('idle');
  const [post, setPost] = useState<SocialWorkoutPostDto | null>(null);
  const [isOwnPost, setIsOwnPost] = useState(false);
  const [hasSocialProfile, setHasSocialProfile] = useState(false);
  const [loadError, setLoadError] = useState<SocialWorkoutPostLoadError | null>(
    null,
  );
  const [reaction, setReaction] = useState<SocialWorkoutReactionDto | null>(null);
  const [reactionLoading, setReactionLoading] = useState(false);
  const [reactionBusy, setReactionBusy] = useState(false);
  const [reactionError, setReactionError] =
    useState<SocialWorkoutReactionError | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const auth = useMemo(
    () => ({
      getAccessToken: async () => session?.tokens.accessToken ?? null,
      refreshAccessToken: async () => (await refresh())?.tokens.accessToken ?? null,
    }),
    [refresh, session?.tokens.accessToken],
  );
  const socialApi = useMemo(() => createSocialApi(auth), [auth]);

  const loadPost = useCallback(async () => {
    if (!isAuthenticated) return;
    if (!postId) {
      setStatus('not_found');
      return;
    }
    const sequence = ++requestSequence.current;
    setStatus('loading');
    setPost(null);
    setIsOwnPost(false);
    setHasSocialProfile(false);
    setLoadError(null);
    setDeleteError(null);
    setReaction(null);
    setReactionError(null);
    setReactionLoading(true);

    const reactionRequest = socialApi
      .getWorkoutPostReaction(postId)
      .then((value) => ({ value, error: null }))
      .catch((error: unknown) => ({
        value: null,
        error: getSocialWorkoutReactionError(error),
      }));

    try {
      const [loadedPost, ownProfile, reactionResult] = await Promise.all([
        socialApi.getWorkoutPost(postId),
        socialApi.getOwnProfile(),
        reactionRequest,
      ]);
      if (sequence !== requestSequence.current) return;
      setPost(loadedPost);
      setIsOwnPost(ownProfile?.username === loadedPost.author.username);
      setHasSocialProfile(Boolean(ownProfile));
      setReaction(reactionResult.value);
      setReactionError(reactionResult.error);
      setStatus('ready');
    } catch (error) {
      if (sequence !== requestSequence.current) return;
      const mapped = getSocialWorkoutPostLoadError(error);
      setLoadError(mapped);
      setStatus(
        mapped === 'private'
          ? 'private'
          : mapped === 'blocked'
            ? 'blocked'
            : mapped === 'not_found'
              ? 'not_found'
              : 'error',
      );
    } finally {
      if (sequence === requestSequence.current) setReactionLoading(false);
    }
  }, [isAuthenticated, postId, socialApi]);

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated) {
      requestSequence.current += 1;
      setStatus('idle');
      return;
    }
    void loadPost();
    return () => {
      requestSequence.current += 1;
    };
  }, [isAuthenticated, loadPost, ready]);

  const retryReaction = async () => {
    if (!post || reactionLoading) return;
    setReactionLoading(true);
    setReactionError(null);
    try {
      setReaction(await socialApi.getWorkoutPostReaction(post.id));
    } catch (error) {
      setReactionError(getSocialWorkoutReactionError(error));
    } finally {
      setReactionLoading(false);
    }
  };

  const toggleReaction = async () => {
    if (!post || !reaction || reactionBusy || !hasSocialProfile) return;
    setReactionBusy(true);
    setReactionError(null);
    try {
      const next = reaction.reacted
        ? await socialApi.unreactToWorkoutPost(post.id)
        : await socialApi.reactToWorkoutPost(post.id);
      setReaction(next);
    } catch (error) {
      const mapped = getSocialWorkoutReactionError(error);
      if (mapped === 'profile_required') setHasSocialProfile(false);
      setReactionError(mapped);
    } finally {
      setReactionBusy(false);
    }
  };

  const deletePost = async () => {
    if (deleteBusy || !isOwnPost) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await socialApi.deleteWorkoutPost(postId);
      setPost(null);
      setReaction(null);
      setStatus('deleted');
    } catch {
      setDeleteError(copy.deleteError);
    } finally {
      setDeleteBusy(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(copy.deleteTitle, copy.deleteBody, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: copy.deleteConfirm, style: 'destructive', onPress: deletePost },
    ]);
  };

  const errorMessage =
    loadError === 'offline'
      ? copy.loadErrorOffline
      : loadError === 'session_expired'
        ? copy.loadErrorSession
        : copy.loadErrorGeneric;
  const reactionErrorMessage =
    reactionError === 'offline'
      ? copy.reactionErrorOffline
      : reactionError === 'session_expired'
        ? copy.reactionErrorSession
        : reactionError === 'profile_required'
          ? copy.reactionErrorProfile
          : reactionError === 'unavailable'
            ? copy.reactionErrorUnavailable
            : reactionError === 'generic'
              ? copy.reactionErrorGeneric
              : null;

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
            <Text style={styles.eyebrow}>{copy.detailEyebrow}</Text>
            <Text style={styles.title}>
              {post?.workout.title ?? copy.untitledWorkout}
            </Text>
          </View>
        </View>

        {!ready || (ready && isAuthenticated && (status === 'idle' || status === 'loading')) ? (
          <AppCard>
            <LoadingState label={copy.loadingPost} />
          </AppCard>
        ) : null}

        {ready && !isAuthenticated ? (
          <StateCard body={copy.signInBody} styles={styles} title={copy.signInTitle}>
            <PrimaryButton
              label={copy.signInAction}
              onPress={() => router.push('/auth/sign-in')}
            />
          </StateCard>
        ) : null}

        {ready && isAuthenticated && status === 'private' ? (
          <StateCard body={copy.privateBody} styles={styles} title={copy.privateTitle} />
        ) : null}

        {ready && isAuthenticated && status === 'blocked' ? (
          <StateCard body={copy.blockedBody} styles={styles} title={copy.blockedTitle} />
        ) : null}

        {ready && isAuthenticated && status === 'not_found' ? (
          <StateCard body={copy.notFoundBody} styles={styles} title={copy.notFoundTitle} />
        ) : null}

        {ready && isAuthenticated && status === 'deleted' ? (
          <StateCard body={copy.deletedBody} styles={styles} title={copy.deletedTitle}>
            <SecondaryButton label={t('common.back')} onPress={() => router.back()} />
          </StateCard>
        ) : null}

        {ready && isAuthenticated && status === 'error' ? (
          <StateCard body={errorMessage} styles={styles} title={copy.loadErrorTitle}>
            <SecondaryButton label={copy.retry} onPress={loadPost} />
          </StateCard>
        ) : null}

        {ready && isAuthenticated && status === 'ready' && post ? (
          <>
            <SocialWorkoutPostDetailContent
              copy={copy}
              locale={locale}
              post={post}
              styles={styles}
            />
            <SocialWorkoutReactionCard
              busy={reactionBusy}
              canReact={hasSocialProfile}
              copy={copy}
              errorMessage={reactionErrorMessage}
              loading={reactionLoading}
              onCreateProfile={() => router.push('/settings/social-profile')}
              onRetry={() => void retryReaction()}
              onToggle={() => void toggleReaction()}
              reaction={reaction}
              styles={styles}
            />
            {isOwnPost ? (
              <>
                <InlineError message={deleteError} />
                <DestructiveButton
                  disabled={deleteBusy}
                  label={copy.deletePost}
                  loading={deleteBusy}
                  onPress={confirmDelete}
                />
              </>
            ) : null}
          </>
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
  styles: ReturnType<typeof createSocialWorkoutPostSurfaceStyles>;
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
