import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import type { SyncConflictResolutionChoice } from '@/cloud';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { Spacing, Typography } from '@/constants/theme';
import {
  type SyncConflictResolutionReviewItem,
  useSyncConflictResolution,
} from '@/context/useSyncConflictResolution';
import { useWeightSync } from '@/context/SyncContext';
import { useLocalization } from '@/localization';
import { getSyncConflictResolutionUiCopy } from '@/localization/syncConflictResolutionMessages';
import { useAppTheme } from '@/theme/AppThemeProvider';

import { getSyncConflictCopy, getSyncConflictEntityLabel } from './syncConflictCopy';
import {
  getSyncConflictIntentStatusMessage,
  getSyncConflictPayloadKindLabel,
  getSyncConflictResolutionOutcomeMessage,
  getSyncConflictSelectedChoiceLabel,
  isSyncConflictIntentSubmitting,
  shouldFinishSyncConflictIntent,
} from './syncConflictResolutionPresentation';

type LoadState = 'loading' | 'ready' | 'error';
type RunningResolution = {
  choice: SyncConflictResolutionChoice | null;
  conflictId: string;
};

function VersionRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.versionRow, { borderColor: colors.borderSubtle }]}>
      <Text style={[styles.versionLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.versionValue, { color: colors.textPrimary }]}>{value}</Text>
    </View>
  );
}

export function SyncConflictReviewCard() {
  const { colors } = useAppTheme();
  const { formatDate, locale, t } = useLocalization();
  const { conflictCount, status, syncNow } = useWeightSync();
  const { continueResolution, listReviewItems, resolve } =
    useSyncConflictResolution();
  const copy = getSyncConflictCopy(t);
  const resolutionCopy = useMemo(
    () => getSyncConflictResolutionUiCopy(locale),
    [locale],
  );
  const [items, setItems] = useState<SyncConflictResolutionReviewItem[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [runningResolution, setRunningResolution] =
    useState<RunningResolution | null>(null);
  const [isRetryingSync, setIsRetryingSync] = useState(false);
  const [notices, setNotices] = useState<Record<string, string>>({});
  const loadVersionRef = useRef(0);

  const loadItems = useCallback(async () => {
    const version = ++loadVersionRef.current;
    setLoadState('loading');
    try {
      const nextItems = await listReviewItems();
      if (loadVersionRef.current !== version) return;
      setItems(nextItems);
      setLoadState('ready');
    } catch {
      if (loadVersionRef.current === version) setLoadState('error');
    }
  }, [listReviewItems]);

  useEffect(() => {
    void loadItems();
    return () => {
      loadVersionRef.current += 1;
    };
  }, [conflictCount, loadItems]);

  const finishOperation = useCallback(
    async (
      item: SyncConflictResolutionReviewItem,
      choice: SyncConflictResolutionChoice | null,
      operation: () => ReturnType<typeof resolve>,
    ) => {
      setRunningResolution({ conflictId: item.conflictId, choice });
      try {
        const outcome = await operation();
        setNotices((current) => ({
          ...current,
          [item.conflictId]: getSyncConflictResolutionOutcomeMessage(
            resolutionCopy,
            outcome.status,
          ),
        }));
        await loadItems();
      } catch {
        setNotices((current) => ({
          ...current,
          [item.conflictId]: resolutionCopy.outcomeRetryable,
        }));
      } finally {
        setRunningResolution((current) =>
          current?.conflictId === item.conflictId ? null : current,
        );
      }
    },
    [loadItems, resolutionCopy, resolve],
  );

  const runNewResolution = useCallback(
    (
      item: SyncConflictResolutionReviewItem,
      choice: SyncConflictResolutionChoice,
    ) => {
      if (!item.candidate) return Promise.resolve();
      return finishOperation(item, choice, () => resolve(item.candidate!, choice));
    },
    [finishOperation, resolve],
  );

  const resumeResolution = useCallback(
    (item: SyncConflictResolutionReviewItem) =>
      finishOperation(item, item.intentChoice, () => continueResolution(item)),
    [continueResolution, finishOperation],
  );

  const confirmResolution = useCallback(
    (
      item: SyncConflictResolutionReviewItem,
      choice: SyncConflictResolutionChoice,
    ) => {
      const keepDevice = choice === 'keep_local';
      Alert.alert(
        keepDevice
          ? resolutionCopy.confirmDeviceTitle
          : resolutionCopy.confirmAccountTitle,
        keepDevice
          ? resolutionCopy.confirmDeviceBody
          : resolutionCopy.confirmAccountBody,
        [
          { text: resolutionCopy.cancel, style: 'cancel' },
          {
            text: resolutionCopy.confirm,
            style: 'destructive',
            onPress: () => void runNewResolution(item, choice),
          },
        ],
      );
    },
    [resolutionCopy, runNewResolution],
  );

  const retryRemainingConflicts = useCallback(async () => {
    setIsRetryingSync(true);
    try {
      await syncNow();
      await loadItems();
    } finally {
      setIsRetryingSync(false);
    }
  }, [loadItems, syncNow]);

  const isBusy = status === 'syncing' || runningResolution !== null || isRetryingSync;
  const candidateCount = items.filter((item) => item.candidate !== null).length;
  const otherConflictCount = Math.max(0, conflictCount - candidateCount);

  return (
    <AppCard>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{copy.title}</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        {loadState === 'loading'
          ? copy.loading
          : loadState === 'error'
            ? copy.loadFailed
            : conflictCount === 0 && items.length === 0
              ? copy.healthy
              : copy.explanation}
      </Text>

      {items.length > 0 ? (
        <View style={styles.list}>
          {items.map((item) => {
            const { candidate, conflictId, intentChoice, intentState } = item;
            const isRunning = runningResolution?.conflictId === conflictId;
            const hasIntent = intentChoice !== null && intentState !== null;
            const isSubmitting = isSyncConflictIntentSubmitting(intentState);
            const actionLabel = shouldFinishSyncConflictIntent(intentState)
              ? resolutionCopy.finishSynchronization
              : resolutionCopy.retrySelectedChoice;

            return (
              <View
                key={conflictId}
                style={[styles.conflict, { borderColor: colors.borderSubtle }]}>
                <Text style={[styles.entity, { color: colors.textPrimary }]}>
                  {candidate
                    ? getSyncConflictEntityLabel(copy, candidate.entityType)
                    : copy.unknownEntity}
                </Text>
                {candidate ? (
                  <>
                    <Text style={[styles.meta, { color: colors.textSecondary }]}>
                      {copy.detected}:{' '}
                      {formatDate(candidate.detectedAt, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </Text>
                    <View style={styles.versions}>
                      <VersionRow
                        label={resolutionCopy.thisDevice}
                        value={getSyncConflictPayloadKindLabel(
                          resolutionCopy,
                          candidate.localKind,
                        )}
                      />
                      <VersionRow
                        label={resolutionCopy.accountVersion}
                        value={getSyncConflictPayloadKindLabel(
                          resolutionCopy,
                          candidate.remoteKind,
                        )}
                      />
                    </View>
                  </>
                ) : null}

                {hasIntent ? (
                  <View style={styles.intent}>
                    <Text style={[styles.selected, { color: colors.textPrimary }]}>
                      {getSyncConflictSelectedChoiceLabel(
                        resolutionCopy,
                        intentChoice,
                      )}
                    </Text>
                    <Text style={[styles.note, { color: colors.textSecondary }]}>
                      {getSyncConflictIntentStatusMessage(
                        resolutionCopy,
                        intentState,
                      )}
                    </Text>
                    <AppButton
                      disabled={isBusy || isSubmitting}
                      label={isRunning || isSubmitting ? resolutionCopy.retrying : actionLabel}
                      loading={isRunning || isSubmitting}
                      onPress={() => void resumeResolution(item)}
                      variant="secondary"
                    />
                  </View>
                ) : intentState !== null ? (
                  <Text style={[styles.notice, { color: colors.textSecondary }]}>
                    {resolutionCopy.outcomeRejected}
                  </Text>
                ) : candidate ? (
                  <View style={styles.choiceArea}>
                    <Text style={[styles.note, { color: colors.textSecondary }]}>
                      {resolutionCopy.selectionExplanation}
                    </Text>
                    <View style={styles.actions}>
                      <AppButton
                        disabled={isBusy}
                        label={
                          isRunning && runningResolution?.choice === 'keep_local'
                            ? resolutionCopy.retrying
                            : resolutionCopy.useDeviceVersion
                        }
                        loading={
                          isRunning && runningResolution?.choice === 'keep_local'
                        }
                        onPress={() => confirmResolution(item, 'keep_local')}
                        variant="secondary"
                      />
                      <AppButton
                        disabled={isBusy}
                        label={
                          isRunning && runningResolution?.choice === 'keep_remote'
                            ? resolutionCopy.retrying
                            : resolutionCopy.useAccountVersion
                        }
                        loading={
                          isRunning && runningResolution?.choice === 'keep_remote'
                        }
                        onPress={() => confirmResolution(item, 'keep_remote')}
                        variant="secondary"
                      />
                    </View>
                  </View>
                ) : (
                  <Text style={[styles.notice, { color: colors.textSecondary }]}>
                    {resolutionCopy.outcomeRejected}
                  </Text>
                )}

                {notices[conflictId] ? (
                  <Text style={[styles.notice, { color: colors.textSecondary }]}>
                    {notices[conflictId]}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>
      ) : null}

      {otherConflictCount > 0 ? (
        <View style={styles.remaining}>
          <Text style={[styles.note, { color: colors.textSecondary }]}>
            {resolutionCopy.otherConflicts}
          </Text>
          <AppButton
            disabled={isBusy}
            label={isRetryingSync ? resolutionCopy.retrying : resolutionCopy.retrySync}
            loading={isRetryingSync}
            onPress={() => void retryRemainingConflicts()}
            variant="secondary"
          />
        </View>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  actions: { gap: Spacing.two },
  choiceArea: { gap: Spacing.two, marginTop: Spacing.one },
  conflict: {
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.one,
    paddingTop: Spacing.two,
  },
  description: {
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
    marginTop: Spacing.one,
  },
  entity: {
    fontSize: Typography.bodyEmphasized.fontSize,
    fontWeight: Typography.bodyEmphasized.fontWeight,
    lineHeight: Typography.bodyEmphasized.lineHeight,
  },
  intent: { gap: Spacing.two, marginTop: Spacing.one },
  list: { gap: Spacing.three, marginTop: Spacing.three },
  meta: {
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
  },
  note: {
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
  },
  notice: {
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
    marginTop: Spacing.one,
  },
  remaining: { gap: Spacing.two, marginTop: Spacing.three },
  selected: {
    fontSize: Typography.label.fontSize,
    fontWeight: Typography.label.fontWeight,
    lineHeight: Typography.label.lineHeight,
  },
  title: {
    fontSize: Typography.sectionTitle.fontSize,
    fontWeight: Typography.sectionTitle.fontWeight,
    letterSpacing: Typography.sectionTitle.letterSpacing,
    lineHeight: Typography.sectionTitle.lineHeight,
    textTransform: Typography.sectionTitle.textTransform,
  },
  versionLabel: {
    flex: 1,
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
  },
  versionRow: {
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
    paddingTop: Spacing.one,
  },
  versions: { gap: Spacing.one, marginTop: Spacing.one },
  versionValue: {
    fontSize: Typography.label.fontSize,
    fontWeight: Typography.label.fontWeight,
    lineHeight: Typography.label.lineHeight,
    textAlign: 'right',
  },
});
