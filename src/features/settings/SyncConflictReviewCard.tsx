import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { Spacing, Typography } from '@/constants/theme';
import { useWeightSync } from '@/context/SyncContext';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useLocalization } from '@/localization';
import { createAsyncStorageAdapter, createSyncConflictStore, type SyncConflictSnapshot } from '@/storage';
import { useAppTheme } from '@/theme/AppThemeProvider';

import { getSyncConflictCopy, getSyncConflictEntityLabel } from './syncConflictCopy';
import { getSyncConflictDiagnosticItems } from './syncConflictDiagnostic';

type LoadState = 'loading' | 'ready' | 'error';

export function SyncConflictReviewCard() {
  const { colors } = useAppTheme();
  const { formatDate, t } = useLocalization();
  const { session } = useAuthSession();
  const { conflictCount, status, syncNow } = useWeightSync();
  const copy = getSyncConflictCopy(t);
  const conflictStore = useMemo(
    () => createSyncConflictStore(createAsyncStorageAdapter()),
    [],
  );
  const [conflicts, setConflicts] = useState<SyncConflictSnapshot[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');

  const loadConflicts = useCallback(async () => {
    const userId = session?.user.id;
    if (!userId) {
      setConflicts([]);
      setLoadState('ready');
      return;
    }

    setLoadState('loading');
    try {
      setConflicts(await conflictStore.list(userId));
      setLoadState('ready');
    } catch {
      setLoadState('error');
    }
  }, [conflictStore, session?.user.id]);

  useEffect(() => {
    void loadConflicts();
  }, [conflictCount, loadConflicts]);

  const isBusy = status === 'syncing';
  const retryResolution = async () => {
    await syncNow();
    await loadConflicts();
  };

  return (
    <AppCard>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{copy.title}</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        {loadState === 'loading'
          ? copy.loading
          : loadState === 'error'
            ? copy.loadFailed
            : conflicts.length === 0
              ? copy.healthy
              : copy.explanation}
      </Text>

      {conflicts.length > 0 ? (
        <View style={styles.list}>
          {conflicts.map((conflict) => {
            const diagnostics = getSyncConflictDiagnosticItems(conflict);
            return (
              <View
                key={conflict.conflictId}
                style={[styles.conflict, { borderColor: colors.borderSubtle }]}>
                <Text style={[styles.entity, { color: colors.textPrimary }]}>
                  {getSyncConflictEntityLabel(copy, conflict.entityType)}
                </Text>
                <Text style={[styles.meta, { color: colors.textSecondary }]}>
                  {copy.detected}: {formatDate(conflict.detectedAt, { dateStyle: 'medium', timeStyle: 'short' })}
                </Text>
                <Text style={[styles.meta, { color: colors.textSecondary }]}>
                  {copy.source}: {copy.sourceLabels[conflict.source]}
                </Text>
                <View style={[styles.diagnostic, { borderColor: colors.borderSubtle }]}>
                  <Text style={[styles.diagnosticTitle, { color: colors.textPrimary }]}>
                    {copy.diagnosticTitle}
                  </Text>
                  {diagnostics.map((item) => (
                    <Text
                      key={item.key}
                      selectable
                      style={[styles.diagnosticLine, { color: colors.textSecondary }]}>
                      <Text style={{ color: colors.textPrimary }}>
                        {copy.diagnosticLabels[item.key]}:\u00a0
                      </Text>
                      {item.value}
                    </Text>
                  ))}
                </View>
              </View>
            );
          })}
          <Text style={[styles.note, { color: colors.textSecondary }]}>
            {copy.retryExplanation}
          </Text>
          <AppButton
            disabled={isBusy}
            label={isBusy ? copy.retrying : copy.retry}
            loading={isBusy}
            onPress={() => void retryResolution()}
            variant="secondary"
          />
        </View>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  conflict: {
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 2,
    paddingTop: Spacing.two,
  },
  description: {
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
    marginTop: Spacing.one,
  },
  diagnostic: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
    marginTop: Spacing.one,
    padding: Spacing.two,
  },
  diagnosticLine: {
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
  },
  diagnosticTitle: {
    fontSize: Typography.label.fontSize,
    fontWeight: Typography.label.fontWeight,
    lineHeight: Typography.label.lineHeight,
    marginBottom: 2,
  },
  entity: {
    fontSize: Typography.bodyEmphasized.fontSize,
    fontWeight: Typography.bodyEmphasized.fontWeight,
    lineHeight: Typography.bodyEmphasized.lineHeight,
  },
  list: { gap: Spacing.two, marginTop: Spacing.three },
  meta: {
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
  },
  note: {
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
  },
  title: {
    fontSize: Typography.sectionTitle.fontSize,
    fontWeight: Typography.sectionTitle.fontWeight,
    letterSpacing: Typography.sectionTitle.letterSpacing,
    lineHeight: Typography.sectionTitle.lineHeight,
    textTransform: Typography.sectionTitle.textTransform,
  },
});
