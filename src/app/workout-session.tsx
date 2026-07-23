import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import WorkoutSafetyGateScreen from '@/features/workouts/screens/WorkoutSafetyGateScreen';
import WorkoutSessionScreen from '@/features/workouts/screens/WorkoutSessionScreen';
import type { WorkoutSessionDraft } from '@/features/workouts/types';
import type { WorkoutSafetyGateDecision } from '@/features/workouts/workoutSafetyGateModel';
import {
  getActiveWorkoutSessionDraft,
  hydrateActiveWorkoutSessionDraft,
} from '@/lib/workouts';
import {
  createAsyncStorageAdapter,
  createWorkoutSafetyAcknowledgementStore,
} from '@/storage';
import { useAppTheme } from '@/theme/AppThemeProvider';

export default function WorkoutSessionRoute() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const storage = useMemo(() => createAsyncStorageAdapter(), []);
  const acknowledgementStore = useMemo(
    () => createWorkoutSafetyAcknowledgementStore(storage),
    [storage],
  );
  const [draft, setDraft] = useState<WorkoutSessionDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [gateComplete, setGateComplete] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const prepare = async () => {
      await hydrateActiveWorkoutSessionDraft();
      const activeDraft = getActiveWorkoutSessionDraft();
      if (cancelled) return;

      if (!activeDraft) {
        setGateComplete(true);
        setLoading(false);
        return;
      }

      const acknowledgement = await acknowledgementStore.get(activeDraft.id);
      if (cancelled) return;
      setDraft(activeDraft);
      setGateComplete(Boolean(acknowledgement));
      setLoading(false);
    };

    void prepare();
    return () => {
      cancelled = true;
    };
  }, [acknowledgementStore]);

  const continueToWorkout = async (decision: WorkoutSafetyGateDecision) => {
    if (!draft) {
      setGateComplete(true);
      return;
    }
    await acknowledgementStore.set({
      schemaVersion: 1,
      draftId: draft.id,
      acknowledgedAt: new Date().toISOString(),
      reviewRunId: decision.reviewRunId,
      sourceFingerprint: decision.sourceFingerprint,
      reviewStatus: decision.reviewStatus,
    });
    setGateComplete(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.loadingText}>Preparing workout safety check…</Text>
      </View>
    );
  }

  if (!gateComplete && draft) {
    return <WorkoutSafetyGateScreen draft={draft} onContinue={continueToWorkout} />;
  }

  return <WorkoutSessionScreen />;
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    loadingScreen: {
      alignItems: 'center',
      backgroundColor: colors.background,
      flex: 1,
      justifyContent: 'center',
      padding: 24,
    },
    loadingText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '700',
    },
  });
