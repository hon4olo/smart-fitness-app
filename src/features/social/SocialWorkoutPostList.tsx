import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { createSocialApi, type SocialWorkoutPostDto } from '@/api/social';
import { AppCard } from '@/components/ui/AppCard';
import { DestructiveButton } from '@/components/ui/DestructiveButton';
import { InlineError } from '@/components/ui/InlineError';
import { LoadingState } from '@/components/ui/LoadingState';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Colors, Spacing } from '@/constants/theme';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useLocalization } from '@/localization';
import { useAppTheme } from '@/theme/AppThemeProvider';

import { getSocialWorkoutPostListCopy } from './socialWorkoutPostListCopy';
import {
  getSocialWorkoutPostListError,
  getSocialWorkoutPostStats,
  mergeSocialWorkoutPostPages,
  type SocialWorkoutPostListError,
} from './socialWorkoutPostListModel';

type LoadStatus = 'loading' | 'ready' | 'error';

export function SocialWorkoutPostList({
  isOwnProfile,
  username,
}: {
  isOwnProfile: boolean;
  username: string;
}) {
  const { colors } = useAppTheme();
  const { formatDate, locale, t } = useLocalization();
  const copy = getSocialWorkoutPostListCopy(locale);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { refresh, session } = useAuthSession();
  const [posts, setPosts] = useState<SocialWorkoutPostDto[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [error, setError] = useState<SocialWorkoutPostListError | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const requestSequence = useRef(0);

  const auth = useMemo(
    () => ({
      getAccessToken: async () => session?.tokens.accessToken ?? null,
      refreshAccessToken: async () => (await refresh())?.tokens.accessToken ?? null,
    }),
    [refresh, session?.tokens.accessToken],
  );
  const socialApi = useMemo(() => createSocialApi(auth), [auth]);

  const loadPosts = useCallback(
    async (mode: 'replace' | 'append', requestedCursor?: string) => {
      const sequence = ++requestSequence.current;
      if (mode === 'replace') {
        setStatus('loading');
        setError(null);
      } else {
        setLoadingMore(true);
      }

      try {
        const page = await socialApi.listWorkoutPosts(username, {
          limit: 10,
          ...(mode === 'append' && requestedCursor
            ? { cursor: requestedCursor }
            : {}),
        });
        if (sequence !== requestSequence.current) return;
        setPosts((current) =>
          mode === 'replace'
            ? page.items
            : mergeSocialWorkoutPostPages(current, page.items),
        );
        setCursor(page.nextCursor);
        setStatus('ready');
        setError(null);
      } catch (loadError) {
        if (sequence !== requestSequence.current) return;
        setError(getSocialWorkoutPostListError(loadError));
        if (mode === 'replace') setStatus('error');
      } finally {
        if (sequence === requestSequence.current) setLoadingMore(false);
      }
    },
    [socialApi, username],
  );

  useEffect(() => {
    setPosts([]);
    setCursor(null);
    void loadPosts('replace');
    return () => {
      requestSequence.current += 1;
    };
  }, [loadPosts]);

  const errorMessage = useMemo(() => {
    if (error === 'offline') return copy.offline;
    if (error === 'session_expired') return copy.sessionExpired;
    if (error === 'unavailable') return copy.unavailable;
    return copy.loadError;
  }, [copy, error]);

  const deletePost = async (postId: string) => {
    if (deletingId) return;
    setDeletingId(postId);
    setDeleteError(null);
    try {
      await socialApi.deleteWorkoutPost(postId);
      setPosts((current) => current.filter((post) => post.id !== postId));
    } catch {
      setDeleteError(copy.deleteError);
    } finally {
      setDeletingId(null);
    }
  };

  const confirmDelete = (postId: string) => {
    Alert.alert(copy.deleteTitle, copy.deleteBody, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: copy.deleteConfirm,
        style: 'destructive',
        onPress: () => void deletePost(postId),
      },
    ]);
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{copy.title}</Text>

      {status === 'loading' ? (
        <AppCard>
          <LoadingState label={copy.loading} />
        </AppCard>
      ) : null}

      {status === 'error' ? (
        <AppCard>
          <InlineError message={errorMessage} />
          <SecondaryButton label={copy.retry} onPress={() => void loadPosts('replace')} />
        </AppCard>
      ) : null}

      {status === 'ready' && posts.length === 0 ? (
        <AppCard>
          <Text style={styles.cardTitle}>{copy.emptyTitle}</Text>
          <Text style={styles.body}>{copy.emptyBody}</Text>
        </AppCard>
      ) : null}

      {status === 'ready'
        ? posts.map((post) => {
            const stats = getSocialWorkoutPostStats(post);
            const statLabels = [
              stats.durationMinutes === null
                ? null
                : copy.minutes(stats.durationMinutes),
              stats.exerciseCount === null
                ? null
                : copy.exercises(stats.exerciseCount),
              stats.setCount === null ? null : copy.sets(stats.setCount),
              stats.totalVolume === null ? null : copy.volume(stats.totalVolume),
            ].filter((value): value is string => Boolean(value));

            return (
              <AppCard key={post.id}>
                <Text style={styles.dateLabel}>
                  {formatDate(new Date(post.createdAt), {
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    month: 'short',
                  })}
                </Text>
                {post.workout.title ? (
                  <Text style={styles.cardTitle}>{post.workout.title}</Text>
                ) : null}
                <Text style={styles.body}>{post.caption || copy.noCaption}</Text>
                {statLabels.length > 0 ? (
                  <View style={styles.statsRow}>
                    {statLabels.map((label) => (
                      <Text key={label} style={styles.statLabel}>
                        {label}
                      </Text>
                    ))}
                  </View>
                ) : null}
                {isOwnProfile ? (
                  <DestructiveButton
                    disabled={deletingId === post.id}
                    label={copy.delete}
                    loading={deletingId === post.id}
                    onPress={() => confirmDelete(post.id)}
                  />
                ) : null}
              </AppCard>
            );
          })
        : null}

      <InlineError message={deleteError} />
      {status === 'ready' && cursor ? (
        <SecondaryButton
          disabled={loadingMore}
          label={copy.loadMore}
          loading={loadingMore}
          onPress={() => void loadPosts('append', cursor)}
        />
      ) : null}
    </View>
  );
}

const createStyles = (colors: typeof Colors.dark) =>
  StyleSheet.create({
    body: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    cardTitle: {
      color: colors.textPrimary,
      fontSize: 17,
      fontWeight: '800',
      lineHeight: 22,
    },
    dateLabel: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '700',
    },
    section: {
      gap: Spacing.two,
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: '900',
      lineHeight: 25,
    },
    statLabel: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 999,
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '700',
      paddingHorizontal: Spacing.one,
      paddingVertical: 5,
    },
    statsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.one,
    },
  });
