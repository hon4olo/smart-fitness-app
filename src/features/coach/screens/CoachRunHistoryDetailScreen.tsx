import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { createCoachApi, type CoachRunEnvelope } from '@/api/coach';
import { parseCoachAppliedChanges } from '@/api/coach/appliedChangeSummary';
import { parseCoachApplicationProvenance } from '@/api/coach/applicationProvenance';
import { AppCard } from '@/components/ui/AppCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Colors, MaxContentWidth, Radii, Spacing, Typography } from '@/constants/theme';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useLocalization } from '@/localization';
import { useAppTheme } from '@/theme/AppThemeProvider';
import { getCoachHistoryCopy } from '../coachHistoryCopy';
import { CoachAppliedChangeCard } from '../components/CoachAppliedChangeCard';
import { CoachRunTrustCard } from '../components/CoachRunTrustCard';

export default function CoachRunHistoryDetailScreen() {
  const params = useLocalSearchParams<{ runId?: string }>();
  const runId = typeof params.runId === 'string' ? params.runId : '';
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { locale, formatDate } = useLocalization();
  const copy = getCoachHistoryCopy(locale);
  const { refresh, session } = useAuthSession();
  const [run, setRun] = useState<CoachRunEnvelope | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const api = useMemo(
    () =>
      createCoachApi({
        getAccessToken: async () => session?.tokens.accessToken ?? null,
        refreshAccessToken: async () => (await refresh())?.tokens.accessToken ?? null,
      }),
    [refresh, session?.tokens.accessToken],
  );

  const provenanceState = useMemo(() => {
    if (!run) return { invalid: false, items: [] };
    try {
      return {
        invalid: false,
        items: parseCoachApplicationProvenance(run.run.result),
      };
    } catch {
      return { invalid: true, items: [] };
    }
  }, [run]);

  const appliedChangeState = useMemo(() => {
    if (!run) return { invalid: false, items: [] };
    try {
      return {
        invalid: false,
        items: parseCoachAppliedChanges(run.run.result),
      };
    } catch {
      return { invalid: true, items: [] };
    }
  }, [run]);

  useEffect(() => {
    let cancelled = false;
    if (!runId) {
      setError(true);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }
    setLoading(true);
    setError(false);
    void api
      .getRun(runId)
      .then((value) => {
        if (!cancelled) setRun(value);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api, runId]);

  const retry = () => {
    setRun(null);
    setError(false);
    setLoading(true);
    void api
      .getRun(runId)
      .then(setRun)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.backButton}>
          <Text style={styles.backLabel}>‹</Text>
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.subtitle}>{copy.immutable}</Text>
        </View>
      </View>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.eight },
        ]}>
        <View style={styles.container}>
          {loading ? <Text style={styles.body}>{copy.loading}</Text> : null}
          {error ? (
            <AppCard>
              <Text style={styles.body}>{copy.notice}</Text>
              <PrimaryButton label={copy.retry} onPress={retry} />
            </AppCard>
          ) : null}
          {run ? (
            <>
              <AppCard>
                <Text style={styles.cardTitle}>{copy.domain(run.run.domain)}</Text>
                <Row
                  label={copy.requestType}
                  value={run.run.requestType.replaceAll('_', ' ')}
                />
                <Row
                  label={copy.statusLabel}
                  value={copy.status(run.run.status)}
                />
                <Row
                  label={copy.requested}
                  value={formatDate(run.run.requestedAt, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                />
                {run.run.completedAt ? (
                  <Row
                    label={copy.completed}
                    value={formatDate(run.run.completedAt, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  />
                ) : null}
              </AppCard>

              <CoachRunTrustCard run={run} locale={locale} />

              <CoachAppliedChangeCard
                changes={appliedChangeState.items}
                invalid={appliedChangeState.invalid}
              />

              {provenanceState.invalid || provenanceState.items.length > 0 ? (
                <AppCard>
                  <Text style={styles.cardTitle}>{copy.provenance}</Text>
                  {provenanceState.invalid ? (
                    <Text style={styles.body}>{copy.provenanceUnavailable}</Text>
                  ) : (
                    provenanceState.items.map((item) => (
                      <View
                        key={`${item.applicationKey}:${item.sourceFingerprint}`}
                        style={styles.provenanceBlock}>
                        <Text style={styles.agentName}>
                          {copy.application(item.applicationKey)}
                        </Text>
                        {item.sources.map((source) => (
                          <Row
                            key={`${source.entityType}:${source.entityId}`}
                            label={copy.sourceRevision}
                            value={`${copy.entity(source.entityType)} · ${copy.revision(source.revision)}`}
                          />
                        ))}
                        <Row
                          label={copy.appliedRevision}
                          value={`${copy.entity(item.appliedEntity.entityType)} · ${copy.revision(item.appliedEntity.revision)}`}
                        />
                        <Text style={styles.provenanceNote}>
                          {copy.fingerprintRecorded}
                        </Text>
                      </View>
                    ))
                  )}
                </AppCard>
              ) : null}

              <AppCard>
                <Text style={styles.cardTitle}>{copy.policies}</Text>
                {Object.entries(run.run.policyVersions).length === 0 ? (
                  <Text style={styles.body}>{copy.noPolicies}</Text>
                ) : (
                  Object.entries(run.run.policyVersions).map(([name, version]) => (
                    <Row key={name} label={name} value={version} />
                  ))
                )}
              </AppCard>

              <AppCard>
                <Text style={styles.cardTitle}>{copy.agents}</Text>
                {run.agentRuns.length === 0 ? (
                  <Text style={styles.body}>{copy.noAgents}</Text>
                ) : (
                  run.agentRuns.map((agent) => (
                    <View key={agent.id} style={styles.agentBlock}>
                      <Text style={styles.agentName}>
                        {agent.sequence}. {agent.agentName}
                      </Text>
                      <Row
                        label={copy.statusLabel}
                        value={copy.status(agent.status)}
                      />
                      {agent.policyVersion ? (
                        <Row label={copy.policies} value={agent.policyVersion} />
                      ) : null}
                    </View>
                  ))
                )}
              </AppCard>
            </>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={stylesStatic.row}>
      <Text style={stylesStatic.label}>{label}</Text>
      <Text style={stylesStatic.value}>{value}</Text>
    </View>
  );
}

const stylesStatic = StyleSheet.create({
  label: {
    color: Colors.dark.textSecondary,
    flex: 1,
    fontSize: Typography.caption.fontSize,
  },
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  value: {
    color: Colors.dark.textPrimary,
    flex: 1,
    fontSize: Typography.caption.fontSize,
    textAlign: 'right',
  },
});

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    agentBlock: {
      borderTopColor: colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
      gap: Spacing.one,
      paddingTop: Spacing.two,
    },
    agentName: {
      color: colors.textPrimary,
      fontSize: Typography.body.fontSize,
      fontWeight: '700',
    },
    backButton: {
      alignItems: 'center',
      borderColor: colors.borderSubtle,
      borderRadius: Radii.large,
      borderWidth: 1,
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
    },
    container: {
      alignSelf: 'center',
      gap: Spacing.three,
      maxWidth: MaxContentWidth,
      width: '100%',
    },
    content: {
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.three,
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.three,
      paddingBottom: Spacing.two,
      paddingHorizontal: Spacing.three,
    },
    headerCopy: { flex: 1, gap: Spacing.one },
    provenanceBlock: {
      borderTopColor: colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
      gap: Spacing.one,
      paddingTop: Spacing.two,
    },
    provenanceNote: {
      color: colors.textSecondary,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    screen: { backgroundColor: colors.background, flex: 1 },
    subtitle: {
      color: colors.textSecondary,
      fontSize: Typography.caption.fontSize,
    },
    title: {
      color: colors.textPrimary,
      fontSize: Typography.screenTitle.fontSize,
      fontWeight: Typography.screenTitle.fontWeight,
    },
  });
