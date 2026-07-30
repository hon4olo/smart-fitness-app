import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  createLocalApiDiagnosticsRecorder,
  type ApiDiagnosticCategory,
  type LocalApiDiagnostics,
} from '@/api/client';
import { AppCard } from '@/components/ui/AppCard';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Colors, Spacing, Typography } from '@/constants/theme';
import {
  createAsyncStorageAdapter,
  createLocalStateDiagnosticsRecorder,
  type LocalStateDiagnostics,
} from '@/storage';
import { useLocalization } from '@/localization';
import { getSupportDiagnosticsMetricsCopy } from '@/localization/supportDiagnosticsMetricsCopy';

type DiagnosticsState = {
  state: LocalStateDiagnostics;
  api: LocalApiDiagnostics;
};

const API_CATEGORIES: ApiDiagnosticCategory[] = [
  'auth',
  'auth_refresh',
  'sync',
  'coach',
  'food',
  'profile',
  'other',
];

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export function LocalPerformanceDiagnosticsCard() {
  const { locale, formatNumber } = useLocalization();
  const copy = getSupportDiagnosticsMetricsCopy(locale);
  const storage = useMemo(() => createAsyncStorageAdapter(), []);
  const stateRecorder = useMemo(
    () => createLocalStateDiagnosticsRecorder(storage),
    [storage],
  );
  const apiRecorder = useMemo(
    () => createLocalApiDiagnosticsRecorder(storage),
    [storage],
  );
  const [diagnostics, setDiagnostics] = useState<DiagnosticsState | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const [state, api] = await Promise.all([
        stateRecorder.read(),
        apiRecorder.read(),
      ]);
      setDiagnostics({ state, api });
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [apiRecorder, stateRecorder]);

  useEffect(() => {
    void load();
  }, [load]);

  const number = (value: number) =>
    formatNumber(value, { maximumFractionDigits: 0 });
  const duration = (value: number) =>
    copy.milliseconds(formatNumber(value, { maximumFractionDigits: 1 }));
  const bytes = (value: number) => copy.bytes(number(value));
  const totalEntities = diagnostics
    ? Object.values(diagnostics.state.entityCounts).reduce(
        (total, value) => total + value,
        0,
      )
    : 0;
  const categoryFailures = diagnostics
    ? API_CATEGORIES.filter(
        (category) => diagnostics.api.byCategory[category].failures > 0,
      )
    : [];

  return (
    <AppCard>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.description}>{copy.description}</Text>
      {loading ? <Text style={styles.notice}>{copy.loading}</Text> : null}
      {failed ? <Text style={styles.notice}>{copy.unavailable}</Text> : null}
      {diagnostics && !loading ? (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{copy.stateSection}</Text>
            <Row
              label={copy.currentSize}
              value={bytes(diagnostics.state.lastSerializedBytes)}
            />
            <Row
              label={copy.maximumSize}
              value={bytes(diagnostics.state.maximumSerializedBytes)}
            />
            <Row label={copy.totalEntities} value={number(totalEntities)} />
            <Row label={copy.loadCount} value={number(diagnostics.state.loadCount)} />
            <Row
              label={copy.loadFailures}
              value={number(diagnostics.state.loadFailureCount)}
            />
            <Row
              label={copy.lastLoad}
              value={duration(diagnostics.state.lastLoadDurationMs)}
            />
            <Row
              label={copy.maximumLoad}
              value={duration(diagnostics.state.maximumLoadDurationMs)}
            />
            <Row label={copy.saveCount} value={number(diagnostics.state.saveCount)} />
            <Row
              label={copy.saveFailures}
              value={number(diagnostics.state.saveFailureCount)}
            />
            <Row
              label={copy.lastSave}
              value={duration(diagnostics.state.lastSaveDurationMs)}
            />
            <Row
              label={copy.maximumSave}
              value={duration(diagnostics.state.maximumSaveDurationMs)}
            />
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{copy.apiSection}</Text>
            <Row
              label={copy.requestCount}
              value={number(diagnostics.api.totalRequests)}
            />
            <Row
              label={copy.requestFailures}
              value={number(diagnostics.api.totalFailures)}
            />
            <Row
              label={copy.authRefreshFailures}
              value={number(diagnostics.api.authRefreshFailures)}
            />
            <Row
              label={copy.lastDuration}
              value={duration(diagnostics.api.lastDurationMs)}
            />
            <Row
              label={copy.maximumDuration}
              value={duration(diagnostics.api.maximumDurationMs)}
            />
            <Row
              label={copy.lastAttempts}
              value={number(diagnostics.api.lastAttempts)}
            />
            <Row
              label={copy.maximumAttempts}
              value={number(diagnostics.api.maximumAttempts)}
            />
            <Text style={styles.categoryTitle}>{copy.categoryFailures}</Text>
            {categoryFailures.length === 0 ? (
              <Text style={styles.notice}>{copy.noFailures}</Text>
            ) : (
              categoryFailures.map((category) => (
                <Row
                  key={category}
                  label={copy.category(category)}
                  value={number(diagnostics.api.byCategory[category].failures)}
                />
              ))
            )}
          </View>
        </>
      ) : null}
      <SecondaryButton label={copy.refresh} onPress={() => void load()} />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  categoryTitle: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.caption.fontSize,
    fontWeight: '700',
    marginTop: Spacing.one,
  },
  description: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
  },
  label: {
    color: Colors.dark.textSecondary,
    flex: 1,
    fontSize: Typography.caption.fontSize,
  },
  notice: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
  },
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  section: {
    borderTopColor: Colors.dark.borderSubtle,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.one,
    paddingTop: Spacing.two,
  },
  sectionTitle: {
    color: Colors.dark.textPrimary,
    fontSize: Typography.body.fontSize,
    fontWeight: '700',
  },
  title: {
    color: Colors.dark.textPrimary,
    fontSize: Typography.cardTitle.fontSize,
    fontWeight: Typography.cardTitle.fontWeight,
  },
  value: {
    color: Colors.dark.textPrimary,
    flex: 1,
    fontSize: Typography.caption.fontSize,
    textAlign: 'right',
  },
});
