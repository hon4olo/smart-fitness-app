import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
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

import { getDefaultSocialFollowingFeedCacheStore } from '../socialFollowingFeedCache';
import { getSocialFollowingFeedCopy } from '../socialFollowingFeedCopy';
import { SocialWorkoutPostCard } from '../SocialWorkoutPostCard';
import { getSocialWorkoutPostSurfaceCopy } from '../socialWorkoutPostSurfaceCopy';
import {
  getSocialWorkoutPostLoadError,
  mergeSocialWorkoutPosts,
  type SocialWorkoutPostLoadError,
} from '../socialWorkoutPostSurfaceModel';
import { createSocialWorkoutPostSurfaceStyles } from './SocialWorkoutPostSurface.styles';

type FeedStatus = 'idle' | 'loading' | 'ready' | 'error';

const PAGE_SIZE = 20;

export default function SocialFollowingFeedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { locale, t } = useLocalization();
  const copy = getSocialFollowingFeedCopy(locale);
  const postCopy = getSocialWorkoutPostSurfaceCopy(locale);
  const styles = useMemo(() => createSocialWorkoutPostSurfaceStyles(colors), [colors]);
  const { isAuthenticated, ready, refresh, session } = useAuthSession();
  const accountId = session?.user.id ?? null;
  const cacheStore = useMemo(
    () => getDefaultSocialFollowingFeedCacheStore(),
    [],
  );
  const requestSequence = useRef(0);
  const [status, setStatus] = useState<FeedStatus>('idle');
  const [posts, setPosts] = useState<SocialWorkoutPostDto[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showingCachedFeed, setShowingCachedFeed] = useState(false);
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

  const loadFirstPage = useCallback(
    async (asRefresh = false) => {
      if (!isAuthenticated || !accountId) return;
      const sequence = ++requestSequence.current;
      const hadVisiblePosts = posts.length > 0;
      let cachedPageShown = false;

      if (asRefresh) {
        setRefreshing(true);
      } else {
        setStatus('loading');
        setPosts([]);
        setNextCursor(null);
        setShowingCachedFeed(false);
      }
      setLoadError(null);

      if (!asRefresh) {
        const cached = await cacheStore.load(accountId);
        if (sequence !== requestSequence.current) return;
        if (cached) {
          cachedPageShown = true;
          setPosts(cached.items);
          setNextCursor(null);
          setShowingCachedFeed(true);
          setStatus('ready');
        }
      }

      try {
        const page = await socialApi.listFollowingFeed({ limit: PAGE_SIZE });
        if (sequence !== requestSequence.current) return;
        setPosts(page.items);
        setNextCursor(page.nextCursor);
        setShowingCachedFeed(false);
        setStatus('ready');
        setRefreshing(false);
        if (page.items.length > 0) {
          await cacheStore.save(accountId, page.items);
        } else {
          await cacheStore.remove(accountId);
        }
      } catch (error) {
        if (sequence !== requestSequence.current) return;
        const mapped = getSocialWorkoutPostLoadError(error);
        setLoadError(mapped);
        if (mapped === 'session_expired') {
          setPosts([]);
          setNextCursor(null);
          setShowingCachedFeed(false);
          setStatus('error');
        } else if (cachedPageShown || (asRefresh && hadVisiblePosts)) {
          setStatus('ready');
        } else {
          setStatus('error');
        }
      } finally {
        if (sequence === requestSequence.current) setRefreshing(false);
      }
    },
    [accountId, cacheStore, isAuthenticated, posts.length, socialApi],
  );

  const loadMore = async () => {
    if (!nextCursor || loadingMore || showingCachedFeed) return;
    const sequence = ++requestSequence.current;
    setLoadingMore(true);
    setLoadError(null);
    try {
      const page = await socialApi.listFollowingFeed({
        limit: PAGE_SIZE,
        cursor: nextCursor,
      });
      if (sequence !== requestSequence.current) return;
      setPosts((current) => mergeSocialWorkoutPosts(current, page.items));
      setNextCursor(page.nextCursor);
    } catch (error) {
      if (sequence !== requestSequence.current) return;
      setLoadError(getSocialWorkoutPostLoadError(error));
    } finally {
      if (sequence === requestSequence.current) setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated || !accountId) {
      requestSequence.current += 1;
      setStatus('idle');
      setPosts([]);
      setNextCursor(null);
      setShowingCachedFeed(false);
      return;
    }
    void loadFirstPage(false);
    return () => {
      requestSequence.current += 1;
    };
  }, [accountId, isAuthenticated, ready, socialApi]);

  const openPost = (postId: string) => {
    router.push({ pathname: '/social/workout-post/[postId]', params: { postId } });
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
      refreshControl={
        ready && isAuthenticated ? (
          <RefreshControl
            accessibilityLabel={copy.refreshing}
            onRefresh={() => void loadFirstPage(true)}
            refreshing={refreshing}
            tintColor={colors.accent}
          />
        ) : undefined
      }
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

        {ready && isAuthenticated && status === 'error' ? (
          <StateCard body={errorMessage} styles={styles} title={copy.loadErrorTitle}>
            <SecondaryButton label={copy.retry} onPress={() => void loadFirstPage(false)} />
          </StateCard>
        ) : null}

        {ready && isAuthenticated && status === 'ready' && showingCachedFeed ? (
          <AppCard>
            <Text style={styles.body}>{copy.cachedNotice}</Text>
          </AppCard>
        ) : null}

        {ready && isAuthenticated && status === 'ready' && posts.length === 0 ? (
          <StateCard body={copy.emptyBody} styles={styles} title={copy.emptyTitle}>
            <PrimaryButton label={copy.findProfiles} onPress={() => router.push('/social')} />
            <SecondaryButton
              label={copy.manageFollowing}
              onPress={() => router.push('/social/relationships')}
            />
          </StateCard>
        ) : null}

        {ready && isAuthenticated && status === 'ready'
          ? posts.map((post) => (
              <SocialWorkoutPostCard
                copy={postCopy}
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
            <SecondaryButton label={copy.retry} onPress={() => void loadFirstPage(true)} />
          </>
        ) : null}

        {ready &&
        isAuthenticated &&
        status === 'ready' &&
        nextCursor &&
        !loadError &&
        !showingCachedFeed ? (
          <SecondaryButton
            disabled={loadingMore}
            label={copy.loadMore}
            loading={loadingMore}
            onPress={() => void loadMore()}
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
