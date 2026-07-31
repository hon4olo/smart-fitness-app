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

import {
  createSocialApi,
  type SocialNotificationDto,
} from '@/api/social';
import { AppCard } from '@/components/ui/AppCard';
import { InlineError } from '@/components/ui/InlineError';
import { LoadingState } from '@/components/ui/LoadingState';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Spacing } from '@/constants/theme';
import { useAuthSession } from '@/hooks/useAuthSession';
import {
  formatLocalizedDateTime,
  useLocalization,
} from '@/localization';
import { useAppTheme } from '@/theme/AppThemeProvider';

import {
  getSocialNotificationCopy,
  getSocialNotificationMessage,
} from '../socialNotificationCopy';
import {
  getSocialNotificationLoadError,
  getSocialNotificationTarget,
  isMissingSocialNotificationError,
  markSocialNotificationReadOptimistically,
  mergeSocialNotifications,
  removeSocialNotification,
  replaceSocialNotification,
  type SocialNotificationLoadError,
} from '../socialNotificationModel';
import { createSocialNotificationScreenStyles } from './SocialNotificationScreen.styles';

type NotificationStatus = 'idle' | 'loading' | 'ready' | 'error';

const PAGE_SIZE = 20;

export default function SocialNotificationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { locale, t } = useLocalization();
  const copy = getSocialNotificationCopy(locale);
  const styles = useMemo(
    () => createSocialNotificationScreenStyles(colors),
    [colors],
  );
  const { isAuthenticated, ready, refresh, session } = useAuthSession();
  const requestSequence = useRef(0);
  const mounted = useRef(true);
  const [status, setStatus] = useState<NotificationStatus>('idle');
  const [notifications, setNotifications] = useState<SocialNotificationDto[]>(
    [],
  );
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadError, setLoadError] =
    useState<SocialNotificationLoadError | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadMoreBusy, setLoadMoreBusy] = useState(false);
  const [loadMoreError, setLoadMoreError] =
    useState<SocialNotificationLoadError | null>(null);
  const [readError, setReadError] = useState<string | null>(null);

  const auth = useMemo(
    () => ({
      getAccessToken: async () => session?.tokens.accessToken ?? null,
      refreshAccessToken: async () => (await refresh())?.tokens.accessToken ?? null,
    }),
    [refresh, session?.tokens.accessToken],
  );
  const socialApi = useMemo(() => createSocialApi(auth), [auth]);

  const loadInitial = useCallback(
    async (asRefresh = false) => {
      if (!isAuthenticated) return;
      const sequence = ++requestSequence.current;
      if (asRefresh) {
        setRefreshing(true);
      } else {
        setStatus('loading');
        setNotifications([]);
        setNextCursor(null);
      }
      setLoadError(null);
      setLoadMoreError(null);
      setReadError(null);

      try {
        const page = await socialApi.listNotifications({ limit: PAGE_SIZE });
        if (sequence !== requestSequence.current || !mounted.current) return;
        setNotifications(page.items);
        setNextCursor(page.nextCursor);
        setStatus('ready');
      } catch (error) {
        if (sequence !== requestSequence.current || !mounted.current) return;
        setLoadError(getSocialNotificationLoadError(error));
        if (!asRefresh) setStatus('error');
      } finally {
        if (sequence === requestSequence.current && mounted.current) {
          setRefreshing(false);
        }
      }
    },
    [isAuthenticated, socialApi],
  );

  useEffect(() => {
    mounted.current = true;
    if (!ready) return;
    if (!isAuthenticated) {
      requestSequence.current += 1;
      setStatus('idle');
      setNotifications([]);
      setNextCursor(null);
      return;
    }
    void loadInitial();
    return () => {
      mounted.current = false;
      requestSequence.current += 1;
    };
  }, [isAuthenticated, loadInitial, ready]);

  const loadMore = async () => {
    if (!nextCursor || loadMoreBusy) return;
    const sequence = requestSequence.current;
    setLoadMoreBusy(true);
    setLoadMoreError(null);
    try {
      const page = await socialApi.listNotifications({
        limit: PAGE_SIZE,
        cursor: nextCursor,
      });
      if (sequence !== requestSequence.current || !mounted.current) return;
      setNotifications((current) =>
        mergeSocialNotifications(current, page.items),
      );
      setNextCursor(page.nextCursor);
    } catch (error) {
      if (sequence !== requestSequence.current || !mounted.current) return;
      setLoadMoreError(getSocialNotificationLoadError(error));
    } finally {
      if (mounted.current) setLoadMoreBusy(false);
    }
  };

  const navigateToNotification = (notification: SocialNotificationDto) => {
    const target = getSocialNotificationTarget(notification);
    if (target.kind === 'profile') {
      router.push({
        pathname: '/social/[username]',
        params: { username: target.username },
      });
      return;
    }
    router.push({
      pathname: '/social/workout-post/[postId]',
      params: { postId: target.postId },
    });
  };

  const openNotification = (notification: SocialNotificationDto) => {
    setReadError(null);
    if (notification.readAt === null) {
      const optimistic = markSocialNotificationReadOptimistically(
        notification,
        new Date().toISOString(),
      );
      setNotifications((current) =>
        replaceSocialNotification(current, optimistic),
      );
      void socialApi
        .markNotificationRead(notification.id)
        .then((updated) => {
          if (!mounted.current) return;
          setNotifications((current) =>
            replaceSocialNotification(current, updated),
          );
        })
        .catch((error: unknown) => {
          if (!mounted.current) return;
          if (isMissingSocialNotificationError(error)) {
            setNotifications((current) =>
              removeSocialNotification(current, notification.id),
            );
            return;
          }
          setNotifications((current) =>
            replaceSocialNotification(current, notification),
          );
          setReadError(copy.readError);
        });
    }
    navigateToNotification(notification);
  };

  const errorMessage = (error: SocialNotificationLoadError | null): string => {
    if (error === 'invalid_cursor') return copy.loadCursor;
    if (error === 'offline') return copy.loadOffline;
    if (error === 'session_expired') return copy.loadSession;
    return copy.loadGeneric;
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + Spacing.eight },
      ]}
      refreshControl={
        ready && isAuthenticated && status === 'ready' ? (
          <RefreshControl
            accessibilityLabel={copy.refresh}
            onRefresh={() => void loadInitial(true)}
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
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}>
            <Text style={styles.backLabel}>‹</Text>
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
            <Text style={styles.title}>{copy.title}</Text>
            <Text style={styles.subtitle}>{copy.subtitle}</Text>
          </View>
        </View>

        {!ready || (ready && isAuthenticated && status === 'loading') ? (
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

        {ready &&
        isAuthenticated &&
        status === 'error' &&
        loadError === 'profile_required' ? (
          <StateCard
            body={copy.profileRequiredBody}
            styles={styles}
            title={copy.profileRequiredTitle}>
            <PrimaryButton
              label={copy.profileRequiredAction}
              onPress={() => router.push('/settings/social-profile')}
            />
          </StateCard>
        ) : null}

        {ready &&
        isAuthenticated &&
        status === 'error' &&
        loadError !== 'profile_required' ? (
          <StateCard
            body={errorMessage(loadError)}
            styles={styles}
            title={copy.title}>
            <SecondaryButton
              label={copy.retry}
              onPress={() => void loadInitial()}
            />
          </StateCard>
        ) : null}

        {ready && isAuthenticated && status === 'ready' ? (
          <>
            <InlineError
              message={loadError ? errorMessage(loadError) : readError}
            />
            {notifications.length === 0 ? (
              <StateCard
                body={copy.emptyBody}
                styles={styles}
                title={copy.emptyTitle}
              />
            ) : (
              notifications.map((notification) => {
                const unread = notification.readAt === null;
                const message = getSocialNotificationMessage(
                  copy,
                  notification.type,
                );
                const accessibilityLabel = `${
                  unread ? copy.unread : copy.read
                }. ${notification.actor.displayName} ${message}`;
                return (
                  <Pressable
                    accessibilityHint={copy.open}
                    accessibilityLabel={accessibilityLabel}
                    accessibilityRole="button"
                    key={notification.id}
                    onPress={() => openNotification(notification)}
                    style={({ pressed }) => [
                      styles.notificationCard,
                      pressed && styles.pressed,
                    ]}>
                    <View style={styles.notificationHeader}>
                      {unread ? <View style={styles.unreadDot} /> : null}
                      <Text style={styles.message}>
                        <Text style={styles.username}>
                          {notification.actor.displayName}
                        </Text>{' '}
                        {message}
                      </Text>
                    </View>
                    <View style={styles.notificationMeta}>
                      <Text style={styles.timestamp}>
                        {formatLocalizedDateTime(
                          notification.createdAt,
                          locale,
                        )}
                      </Text>
                      <Text
                        style={
                          unread ? styles.unreadLabel : styles.readLabel
                        }>
                        {unread ? copy.unread : copy.read}
                      </Text>
                    </View>
                  </Pressable>
                );
              })
            )}

            {nextCursor ? (
              <>
                <InlineError
                  message={
                    loadMoreError ? errorMessage(loadMoreError) : null
                  }
                />
                <SecondaryButton
                  disabled={loadMoreBusy}
                  label={
                    loadMoreError === 'invalid_cursor'
                      ? copy.reload
                      : copy.loadMore
                  }
                  loading={loadMoreBusy}
                  onPress={
                    loadMoreError === 'invalid_cursor'
                      ? () => void loadInitial()
                      : loadMore
                  }
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
  styles: ReturnType<typeof createSocialNotificationScreenStyles>;
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
