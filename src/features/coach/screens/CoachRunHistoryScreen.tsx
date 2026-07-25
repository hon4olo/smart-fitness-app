import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { createCoachHistoryApi, type CoachRunHistoryItem } from '@/api/coach/history';
import type { CoachDomain, CoachRunStatus } from '@/api/coach';
import { AppCard } from '@/components/ui/AppCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Colors, MaxContentWidth, Radii, Spacing, Typography } from '@/constants/theme';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useLocalization } from '@/localization';
import { useAppTheme } from '@/theme/AppThemeProvider';
import { getCoachHistoryCopy } from '../coachHistoryCopy';

const DOMAIN_FILTERS: Array<CoachDomain | 'all'> = [
  'all',
  'combined',
  'strength',
  'nutrition',
  'safety_recovery',
];
const STATUS_FILTERS: Array<CoachRunStatus | 'all'> = [
  'all',
  'completed',
  'running',
  'queued',
  'rejected',
  'failed',
];

export default function CoachRunHistoryScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { locale, formatDate } = useLocalization();
  const copy = getCoachHistoryCopy(locale);
  const { ready, refresh, session } = useAuthSession();
  const [domain, setDomain] = useState<CoachDomain | 'all'>('all');
  const [status, setStatus] = useState<CoachRunStatus | 'all'>('all');
  const [items, setItems] = useState<CoachRunHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const isAuthenticated = Boolean(session?.tokens.accessToken);

  const api = useMemo(
    () =>
      createCoachHistoryApi({
        getAccessToken: async () => session?.tokens.accessToken ?? null,
        refreshAccessToken: async () => (await refresh())?.tokens.accessToken ?? null,
      }),
    [refresh, session?.tokens.accessToken],
  );

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(false);
    try {
      setItems(
        await api.listRuns({
          limit: 50,
          ...(domain === 'all' ? {} : { domain }),
          ...(status === 'all' ? {} : { status }),
        }),
      );
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [api, domain, isAuthenticated, status]);

  useEffect(() => {
    if (ready && isAuthenticated) void load();
  }, [isAuthenticated, load, ready]);

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}> 
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backLabel}>‹</Text>
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.subtitle}>{copy.subtitle}</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.eight }]}> 
        <View style={styles.container}>
          {!ready ? <Text style={styles.body}>{copy.loading}</Text> : null}
          {ready && !isAuthenticated ? (
            <AppCard>
              <Text style={styles.body}>{copy.signIn}</Text>
              <PrimaryButton label={locale === 'ru' ? 'Войти' : 'Sign in'} onPress={() => router.push('/auth/sign-in')} />
            </AppCard>
          ) : null}
          {ready && isAuthenticated ? (
            <>
              <FilterRow<CoachDomain | 'all'>
                labels={DOMAIN_FILTERS.map((value) => ({
                  label: value === 'all' ? copy.all : copy.domain(value),
                  value,
                }))}
                onChange={(value) => setDomain(value)}
                value={domain}
              />
              <FilterRow<CoachRunStatus | 'all'>
                labels={STATUS_FILTERS.map((value) => ({
                  label: value === 'all' ? copy.all : copy.status(value),
                  value,
                }))}
                onChange={(value) => setStatus(value)}
                value={status}
              />
              {loading ? <Text style={styles.body}>{copy.loading}</Text> : null}
              {error ? (
                <AppCard>
                  <Text style={styles.body}>{copy.notice}</Text>
                  <PrimaryButton label={copy.retry} onPress={() => void load()} />
                </AppCard>
              ) : null}
              {!loading && !error && items.length === 0 ? (
                <AppCard><Text style={styles.body}>{copy.empty}</Text></AppCard>
              ) : null}
              {items.map((item) => (
                <Pressable
                  accessibilityRole="button"
                  key={item.id}
                  onPress={() => router.push(`/profile/coach-history/${item.id}`)}>
                  <AppCard>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>{copy.domain(item.domain)}</Text>
                      <Text style={styles.status}>{copy.status(item.status)}</Text>
                    </View>
                    <Text style={styles.body}>{item.requestType.replaceAll('_', ' ')}</Text>
                    <Text style={styles.meta}>
                      {formatDate(item.requestedAt, { dateStyle: 'medium', timeStyle: 'short' })}
                    </Text>
                    <Text style={styles.meta}>
                      {Object.keys(item.policyVersions).length} {copy.policies.toLowerCase()}
                    </Text>
                  </AppCard>
                </Pressable>
              ))}
            </>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

function FilterRow<T extends string>({
  labels,
  onChange,
  value,
}: {
  labels: Array<{ label: string; value: T }>;
  onChange(value: T): void;
  value: T;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={stylesStatic.filters}>
      {labels.map((option) => (
        <Pressable
          accessibilityRole="button"
          key={option.value}
          onPress={() => onChange(option.value)}
          style={[stylesStatic.filter, option.value === value && stylesStatic.filterActive]}>
          <Text style={stylesStatic.filterLabel}>{option.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const stylesStatic = StyleSheet.create({
  filter: { borderColor: Colors.dark.borderSubtle, borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  filterActive: { borderColor: Colors.dark.accent },
  filterLabel: { color: Colors.dark.textPrimary, fontSize: Typography.caption.fontSize },
  filters: { gap: Spacing.two },
});

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  backButton: { alignItems: 'center', borderColor: colors.borderSubtle, borderRadius: Radii.large, borderWidth: 1, height: 44, justifyContent: 'center', width: 44 },
  backLabel: { color: colors.textPrimary, fontSize: 32, lineHeight: 34 },
  body: { color: colors.textSecondary, fontSize: Typography.body.fontSize, lineHeight: Typography.body.lineHeight },
  cardHeader: { alignItems: 'center', flexDirection: 'row', gap: Spacing.two, justifyContent: 'space-between' },
  cardTitle: { color: colors.textPrimary, fontSize: Typography.cardTitle.fontSize, fontWeight: Typography.cardTitle.fontWeight },
  container: { alignSelf: 'center', gap: Spacing.three, maxWidth: MaxContentWidth, width: '100%' },
  content: { paddingHorizontal: Spacing.three, paddingTop: Spacing.three },
  header: { alignItems: 'center', flexDirection: 'row', gap: Spacing.three, paddingBottom: Spacing.two, paddingHorizontal: Spacing.three },
  headerCopy: { flex: 1, gap: Spacing.one },
  meta: { color: colors.textMuted, fontSize: Typography.caption.fontSize },
  screen: { backgroundColor: colors.background, flex: 1 },
  status: { color: colors.accent, fontSize: Typography.caption.fontSize, fontWeight: '700' },
  subtitle: { color: colors.textSecondary, fontSize: Typography.caption.fontSize },
  title: { color: colors.textPrimary, fontSize: Typography.screenTitle.fontSize, fontWeight: Typography.screenTitle.fontWeight },
});
