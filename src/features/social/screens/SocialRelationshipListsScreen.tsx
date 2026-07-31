import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  createSocialApi,
  type SocialProfileListItemDto,
  type SocialProfileListPageDto,
} from '@/api/social';
import { AppCard } from '@/components/ui/AppCard';
import { InlineError } from '@/components/ui/InlineError';
import { LoadingState } from '@/components/ui/LoadingState';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Spacing } from '@/constants/theme';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useLocalization } from '@/localization';
import { useAppTheme } from '@/theme/AppThemeProvider';

import { SocialRelationshipListCard } from '../SocialRelationshipListCard';
import { getSocialRelationshipListsCopy } from '../socialRelationshipListsCopy';
import {
  SOCIAL_RELATIONSHIP_LIST_KINDS,
  getSocialRelationshipListError,
  mergeSocialProfileListItems,
  removeSocialProfileListItem,
  type SocialRelationshipListError,
  type SocialRelationshipListKind,
} from '../socialRelationshipListsModel';
import { createSocialRelationshipListsStyles } from './SocialRelationshipListsScreen.styles';

type ListStatus = 'idle' | 'loading' | 'ready' | 'error';
type RowAction = 'approve' | 'reject' | 'cancel' | 'unfollow';

const PAGE_SIZE = 20;

export default function SocialRelationshipListsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { locale, t } = useLocalization();
  const copy = getSocialRelationshipListsCopy(locale);
  const styles = useMemo(() => createSocialRelationshipListsStyles(colors), [colors]);
  const { isAuthenticated, ready, refresh, session } = useAuthSession();
  const requestSequence = useRef(0);
  const [kind, setKind] = useState<SocialRelationshipListKind>('followers');
  const [status, setStatus] = useState<ListStatus>('idle');
  const [items, setItems] = useState<SocialProfileListItemDto[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<SocialRelationshipListError | null>(
    null,
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyUsername, setBusyUsername] = useState<string | null>(null);

  const auth = useMemo(
    () => ({
      getAccessToken: async () => session?.tokens.accessToken ?? null,
      refreshAccessToken: async () => (await refresh())?.tokens.accessToken ?? null,
    }),
    [refresh, session?.tokens.accessToken],
  );
  const socialApi = useMemo(() => createSocialApi(auth), [auth]);

  const requestPage = useCallback(
    (listKind: SocialRelationshipListKind, cursor?: string) => {
      const input = cursor ? { limit: PAGE_SIZE, cursor } : { limit: PAGE_SIZE };
      if (listKind === 'followers') return socialApi.listFollowers(input);
      if (listKind === 'following') return socialApi.listFollowing(input);
      if (listKind === 'incoming') {
        return socialApi.listIncomingFollowRequests(input);
      }
      return socialApi.listOutgoingFollowRequests(input);
    },
    [socialApi],
  );

  const applyPage = useCallback(
    (page: SocialProfileListPageDto, reset: boolean) => {
      setItems((current) =>
        reset ? page.items : mergeSocialProfileListItems(current, page.items),
      );
      setNextCursor(page.nextCursor);
      setStatus('ready');
    },
    [],
  );

  const loadList = useCallback(
    async (reset: boolean) => {
      if (!isAuthenticated) return;
      const cursor = reset ? undefined : nextCursor ?? undefined;
      if (!reset && !cursor) return;

      const sequence = ++requestSequence.current;
      if (reset) {
        setStatus('loading');
        setItems([]);
        setNextCursor(null);
      } else {
        setLoadingMore(true);
      }
      setLoadError(null);
      setActionError(null);

      try {
        const page = await requestPage(kind, cursor);
        if (sequence !== requestSequence.current) return;
        applyPage(page, reset);
      } catch (error) {
        if (sequence !== requestSequence.current) return;
        setLoadError(getSocialRelationshipListError(error));
        if (reset) setStatus('error');
      } finally {
        if (sequence === requestSequence.current) setLoadingMore(false);
      }
    }, [applyPage, isAuthenticated, kind, nextCursor, requestPage]);

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated) {
      requestSequence.current += 1;
      setStatus('idle');
      setItems([]);
      setNextCursor(null);
      return;
    }
    void loadList(true);
    return () => {
      requestSequence.current += 1;
    };
  }, [isAuthenticated, kind, ready]);

  const runAction = async (action: RowAction, username: string) => {
    if (busyUsername) return;
    setBusyUsername(username);
    setActionError(null);
    try {
      if (action === 'approve') await socialApi.approveFollowRequest(username);
      else if (action === 'reject') await socialApi.rejectFollowRequest(username);
      else if (action === 'cancel') await socialApi.cancelFollowRequest(username);
      else await socialApi.unfollow(username);
      setItems((current) => removeSocialProfileListItem(current, username));
    } catch {
      setActionError(copy.actionError);
    } finally {
      setBusyUsername(null);
    }
  };

  const selectKind = (nextKind: SocialRelationshipListKind) => {
    if (nextKind === kind) return;
    requestSequence.current += 1;
    setKind(nextKind);
    setStatus('idle');
    setItems([]);
    setNextCursor(null);
    setLoadError(null);
    setActionError(null);
  };

  const openProfile = (username: string) => {
    router.push({ pathname: '/social/[username]', params: { username } });
  };

  const tabLabel = (value: SocialRelationshipListKind): string => {
    if (value === 'followers') return copy.followers;
    if (value === 'following') return copy.following;
    if (value === 'incoming') return copy.incoming;
    return copy.outgoing;
  };

  const emptyCopy = () => {
    if (kind === 'followers') {
      return { title: copy.emptyFollowersTitle, body: copy.emptyFollowersBody };
    }
    if (kind === 'following') {
      return { title: copy.emptyFollowingTitle, body: copy.emptyFollowingBody };
    }
    if (kind === 'incoming') {
      return { title: copy.emptyIncomingTitle, body: copy.emptyIncomingBody };
    }
    return { title: copy.emptyOutgoingTitle, body: copy.emptyOutgoingBody };
  };

  const loadErrorMessage =
    loadError === 'offline'
      ? copy.loadErrorOffline
      : loadError === 'session_expired'
        ? copy.loadErrorSession
        : loadError === 'invalid_cursor'
          ? copy.loadErrorCursor
          : copy.loadErrorGeneric;
  const empty = emptyCopy();

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
            <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
            <Text style={styles.title}>{copy.title}</Text>
            <Text style={styles.subtitle}>{copy.subtitle}</Text>
          </View>
        </View>

        {!ready ? (
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

        {ready && isAuthenticated ? (
          <View style={styles.tabs}>
            {SOCIAL_RELATIONSHIP_LIST_KINDS.map((value) => {
              const active = value === kind;
              return (
                <Pressable
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  key={value}
                  onPress={() => selectKind(value)}
                  style={({ pressed }) => [
                    styles.tab,
                    active && styles.tabActive,
                    pressed && styles.pressed,
                  ]}>
                  <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                    {tabLabel(value)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {ready && isAuthenticated && (status === 'idle' || status === 'loading') ? (
          <AppCard>
            <LoadingState label={copy.loading} />
          </AppCard>
        ) : null}

        {ready && isAuthenticated && status === 'error' ? (
          <AppCard>
            <Text style={styles.cardTitle}>{copy.loadErrorTitle}</Text>
            <Text style={styles.body}>{loadErrorMessage}</Text>
            <SecondaryButton label={copy.retry} onPress={() => void loadList(true)} />
          </AppCard>
        ) : null}

        {ready && isAuthenticated && status === 'ready' && items.length === 0 ? (
          <AppCard>
            <Text style={styles.cardTitle}>{empty.title}</Text>
            <Text style={styles.body}>{empty.body}</Text>
          </AppCard>
        ) : null}

        {ready && isAuthenticated && status === 'ready'
          ? items.map((item) => (
              <SocialRelationshipListCard
                busy={busyUsername === item.profile.username}
                copy={copy}
                item={item}
                key={item.profile.username}
                kind={kind}
                onApprove={(username) => void runAction('approve', username)}
                onCancel={(username) => void runAction('cancel', username)}
                onOpen={openProfile}
                onReject={(username) => void runAction('reject', username)}
                onUnfollow={(username) => void runAction('unfollow', username)}
                styles={styles}
              />
            ))
          : null}

        {ready && isAuthenticated && status === 'ready' ? (
          <InlineError
            message={
              actionError ?? (items.length > 0 && loadError ? loadErrorMessage : null)
            }
          />
        ) : null}

        {ready && isAuthenticated && status === 'ready' && nextCursor ? (
          <SecondaryButton
            disabled={loadingMore}
            label={copy.loadMore}
            loading={loadingMore}
            onPress={() => void loadList(false)}
          />
        ) : null}
      </View>
    </ScrollView>
  );
}
