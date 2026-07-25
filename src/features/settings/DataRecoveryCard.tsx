import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { Spacing, Typography } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { recoverAppMutationOutbox } from '@/context/appContext/AppMutationOutboxRecovery';
import { useLocalization } from '@/localization';
import {
  createAsyncStorageAdapter,
  createAsyncStorageOperationQueueStore,
  getDefaultAppMutationOutboxRecoveryStore,
} from '@/storage';
import { useAppTheme } from '@/theme/AppThemeProvider';

import { getDataRecoveryCopy } from './dataRecoveryCopy';

type RecoveryState = 'idle' | 'loading' | 'recovering' | 'recovered' | 'error';

export function DataRecoveryCard() {
  const { colors } = useAppTheme();
  const { locale } = useLocalization();
  const { mutationFailure, pendingMutationCount, retryFailedMutation } = useAppContext();
  const copy = getDataRecoveryCopy(locale);
  const recoveryStore = useMemo(getDefaultAppMutationOutboxRecoveryStore, []);
  const recoveryQueueStore = useMemo(
    () => createAsyncStorageOperationQueueStore(createAsyncStorageAdapter()),
    [],
  );
  const [journalCount, setJournalCount] = useState(0);
  const [state, setState] = useState<RecoveryState>('loading');

  const refreshJournalCount = useCallback(async () => {
    try {
      const records = await recoveryStore.list();
      setJournalCount(records.length);
      setState((current) => (current === 'recovering' ? current : 'idle'));
    } catch {
      setState('error');
    }
  }, [recoveryStore]);

  useEffect(() => {
    void refreshJournalCount();
  }, [refreshJournalCount]);

  const recoverProtectedChanges = async () => {
    setState('recovering');
    try {
      await recoverAppMutationOutbox({
        queueStore: recoveryQueueStore,
        recoveryStore,
      });
      setJournalCount(0);
      setState('recovered');
    } catch {
      await refreshJournalCount();
      setState('error');
    }
  };

  const hasActiveFailure = Boolean(mutationFailure);
  const hasProtectedChanges = journalCount > 0;
  const isBusy = pendingMutationCount > 0 || state === 'recovering';
  const stageDescription =
    mutationFailure?.stage === 'outbox' ? copy.outboxFailure : copy.localFailure;

  return (
    <AppCard>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{copy.title}</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        {hasActiveFailure
          ? stageDescription
          : hasProtectedChanges
            ? copy.protectedChanges(journalCount)
            : state === 'recovered'
              ? copy.recovered
              : state === 'error'
                ? copy.checkFailed
                : copy.healthy}
      </Text>

      {hasActiveFailure ? (
        <View style={styles.actionBlock}>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            {copy.failedAction}: {mutationFailure?.label ?? copy.unknownAction}
          </Text>
          <AppButton
            disabled={isBusy}
            label={isBusy ? copy.waiting : copy.retrySave}
            loading={pendingMutationCount > 0}
            onPress={retryFailedMutation}
          />
        </View>
      ) : null}

      {hasProtectedChanges ? (
        <View style={styles.actionBlock}>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            {copy.journalCount}: {journalCount}
          </Text>
          <AppButton
            disabled={isBusy}
            label={state === 'recovering' ? copy.recovering : copy.recover}
            loading={state === 'recovering'}
            onPress={() => void recoverProtectedChanges()}
            variant="secondary"
          />
        </View>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  actionBlock: { gap: Spacing.two, marginTop: Spacing.three },
  description: {
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
    marginTop: Spacing.one,
  },
  meta: {
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
