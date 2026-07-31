import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { createSocialApi, type SocialWorkoutPostDto } from '@/api/social';
import { AppCard } from '@/components/ui/AppCard';
import { InlineError } from '@/components/ui/InlineError';
import { LoadingState } from '@/components/ui/LoadingState';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Spacing } from '@/constants/theme';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useLocalization } from '@/localization';
import { useAppTheme } from '@/theme/AppThemeProvider';

import { SocialWorkoutPostCard } from '../SocialWorkoutPostCard';
import { getSocialWorkoutPostSurfaceCopy } from '../socialWorkoutPostSurfaceCopy';
import {
  getSocialWorkoutPostLoadError,
  mergeSocialWorkoutPosts,
  type SocialWorkoutPostLoadError,
} from '../socialWorkoutPostSurfaceModel';
import {
  normalizeSocialLookupUsername,
  validateSocialLookupUsername,
} from '../socialPublicProfileModel';
import { createSocialWorkoutPostSurfaceStyles } from './SocialWorkoutPostSurface.styles';

type ListStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'private'
  | 'blocked'
  | 'not_found'
  | 'error';

const PAGE_SIZE = 20;
const readParam = (value: string | string[] | undefined): string =>
  normalizeSocialLookupUsername(Array.isArray(value) ? value[0] ?? '' : value ?? '');

export default function SocialProfileWorkoutPostsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ username?: string | string[] }>();
  const username = readParam(params.username);
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { locale, t } = useLocalization();
  const copy = getSocialWorkoutPostSurfaceCopy(locale);
  const styles = useMemo(() => createSocialWorkoutPostSurfaceStyles(colors), [colors]);
  const { isAuthenticated, ready, refresh, session } = useAuthSession();
  const requestSequence = useRef(0);
  const [status, setStatus] = useState<ListStatus>('idle');
  const [posts, setPosts] = useState<SocialWorkoutPostDto[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<SocialWorkoutPostLoadError | null>(
    null,
  );

  const auth = useMemo(
    () => ({
      getAccessToken: async () => session?.tokens.accessToken ?? null,
      refreshAccessToken: async () => (await refresh())?.tokens.accessToken ?? null,
    }),
    [refresh, session?.tokens.accessToken],
  );
  const socialApi = useMemo(() => createSocialApi(auth), [auth]);

  const applyErrorStatus = (error: SocialWorkoutPostLoadError, reset: boolean) => {
    if (!reset) return;
    setStatus(
      error === 'private'
        ? 'private'
        : error === 'blocked'
          ? 'blocked'
          : error === 'not_found'
            ? 'not_found'
            : 'error',
    );
  };

  const loadPosts = useCallback(
    async (reset: boolean) => {
      if (!isAuthenticated) return;
      if (validateSocialLookupUsername(username)) {
        setStatus('not_found');
        return;
      }
      const cursor = reset ? undefined : nextCursor ?? undefined;
      if (!reset && !cursor) return;

      const sequence = ++requestSequence.current;
      if (reset) {
        setStatus('loading');
        setPosts([]);
        setNextCursor(null);
      } else {
        setLoadingMore(true);
      }
      setLoadError(null);

      try {
        const page = await socialApi.listWorkoutPosts(username, {
          limit: PAGE_SIZE,
          ...(cursor ? { cursor } : {}),
        });
        if (sequence !== requestSequence.current) return;
        setPosts((current) =>
          reset ? page.items : mergeSocialWorkoutPosts(current, page.items),
        );
        setNextCursor(page.nextCursor);
        setStatus('ready');
      } catch (error) {
        if (sequence !== requestSequence.current) return;
        const mapped = getSocialWorkoutPostLoadError(error);
        setLoadError(mapped);
        applyErrorStatus(mapped, reset);
      } finally {
        if (sequence === requestSequence.current) setLoadingMore(false);
      }
    }, [isAuthenticated, nextCursor, socialApi, username]);

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated) {
      requestSequence.current += 1;
      setStatus('idle');
      return;
    }
    void loadPosts(true);
    return () => {
      requestSequence.current += 1;
    };
  }, [isAuthenticated, ready, username]);

  const openPost = (postId: string) => {
    router.push({
      pathname: '/social/workout-post/[postId]',
      params: { postId },
    });
  };

  const errorMessage =
    loadError === 'offline'
      ? copy.loadErrorOffline
      : loadError === 'session_expired'
        ? copy.loadErrorSession
        : loadError === 'invalid_cursor'
          ? copy.loadErrorCursor
          : copy.loadErrorGeneric;

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
            <Text style={styles.eyebrow}>{copy.listEyebrow}</Text>
            <Text style={styles.title}>@{username}</Text>
            <Text style={styles.subtitle}>{copy.listSubtitle}</Text>
          </View>
        </View>

        {!ready || (ready && isAuthenticated && (status === 'idle' || status === 'loading')) ? (
          <AppCard>
            <LoadingState label={copy.loading} />
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

        {ready && isAuthenticated && status === 'error' ? (
          <StateCard body={errorMessage} styles={styles} title={copy.loadErrorTitle}>
            <SecondaryButton label={copy.retry} onPress={() => void loadPosts(true)} />
          </StateCard>
        ) : null}

        {ready && isAuthenticated && status === 'ready' && posts.length === 0 ? (
          <StateCard body={copy.emptyBody} styles={styles} title={copy.emptyTitle} />
        ) : null}

        {ready && isAuthenticated && status === 'ready'
          ? posts.map((post) => (
              <SocialWorkoutPostCard
                copy={copy}
                key={post.id}
                locale={locale}
                onOpen={openPost}
                post={post}
                styles={styles}
              />
            ))
          : null}

        {ready && isAuthenticated && status === 'ready' && loadError ? (
          <>
            <InlineError message={errorMessage} />
            <SecondaryButton label={copy.retry} onPress={() => void loadPosts(true)} />
          </>
        ) : null}

        {ready &&
        isAuthenticated &&
        status === 'ready' &&
        nextCursor &&
        !loadError ? (
          <SecondaryButton
            disabled={loadingMore}
            label={copy.loadMore}
            loading={loadingMore}
            onPress={() => void loadPosts(false)}
          />
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
