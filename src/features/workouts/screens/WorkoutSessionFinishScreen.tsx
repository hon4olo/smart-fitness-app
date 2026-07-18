import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { clearActiveWorkoutSessionDraft, getActiveWorkoutSessionDraft, hydrateActiveWorkoutSessionDraft, markActiveWorkoutSessionCompleted, markActiveWorkoutSessionFinishing } from '@/lib/workouts';
import { buildCompletedWorkoutSessionSnapshotFromDraft, getWorkoutSessionCompletedSetCount } from '@/features/workouts/sessionScreenModel';
import { openAppleHealthIntegration } from '@/features/workouts/integrations/appleHealth';
import { openStravaIntegration } from '@/features/workouts/integrations/strava';
import { openWorkoutMediaIntegration } from '@/features/workouts/integrations/workoutMedia';
import { useWorkoutTheme } from '@/features/workouts/workoutTheme';

const getSessionTitle = () => {
  const hour = new Date().getHours();

  if (hour < 12) {
    return 'Morning session';
  }

  if (hour < 18) {
    return 'Afternoon session';
  }

  return 'Evening session';
};

const formatDurationLabel = (startedAt: string, finishedAt = new Date().toISOString()) => {
  const elapsedMs = Math.max(0, new Date(finishedAt).getTime() - new Date(startedAt).getTime());
  const totalMinutes = Math.floor(elapsedMs / 60000);

  if (totalMinutes < 60) {
    return `${totalMinutes}min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}min`;
};

const isSameCalendarDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();

const formatDateTimeLabel = (value: string) => {
  const date = new Date(value);
  const time = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

  if (isSameCalendarDay(date, new Date())) {
    return `Today at ${time}`;
  }

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  }).format(date);
};

export default function WorkoutSessionFinishScreen() {
  const { isRestoringState, saveWorkoutSession } = useAppContext();
  const { colors } = useWorkoutTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [draft, setDraft] = useState<ReturnType<typeof getActiveWorkoutSessionDraft> | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [title, setTitle] = useState('');
  const [stravaEnabled, setStravaEnabled] = useState(false);
  const [appleHealthEnabled, setAppleHealthEnabled] = useState(false);
  const saveGuard = useRef(false);

  useEffect(() => {
    let cancelled = false;

    void hydrateActiveWorkoutSessionDraft().then((activeDraft) => {
      if (!cancelled) {
        setDraft(activeDraft ?? getActiveWorkoutSessionDraft());
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (draft && title.length === 0) {
      setTitle(getSessionTitle());
    }
  }, [draft, title.length]);

  useEffect(() => {
    if (!isRestoringState && draft === null) {
      router.replace('/workouts');
    }
  }, [draft, isRestoringState]);

  if (isRestoringState || draft === undefined) {
    return (
      <View style={[styles.screen, styles.loadingState]}>
        <Text style={styles.loadingLabel}>Loading workout…</Text>
      </View>
    );
  }

  if (draft === null) {
    return null;
  }

  const completedSetCount = getWorkoutSessionCompletedSetCount(draft);
  const canSave = completedSetCount > 0;
  const dateTimeLabel = formatDateTimeLabel(new Date().toISOString());
  const durationLabel = formatDurationLabel(draft.startedAt);
  const discardActiveWorkoutAndReturn = () => {
    clearActiveWorkoutSessionDraft();
    setDraft(null);
    setNotes('');
    setTitle('');
    setStravaEnabled(false);
    setAppleHealthEnabled(false);
    router.replace('/workouts');
  };

  const handleSave = () => {
    if (!canSave || saveGuard.current) {
      return;
    }

    saveGuard.current = true;
    const finishedAt = new Date().toISOString();
    const completedSnapshot = buildCompletedWorkoutSessionSnapshotFromDraft(
      {
        ...draft,
        workoutTitle: title.trim() || draft.workoutTitle,
      },
      {
        finishedAt,
        notes,
      },
    );

    markActiveWorkoutSessionFinishing();
    saveWorkoutSession(completedSnapshot);
    clearActiveWorkoutSessionDraft();
    markActiveWorkoutSessionCompleted();
    router.replace('/workouts');
  };

  const discardWorkout = () => {
    Alert.alert('Discard workout?', 'Your logged sets will not be saved.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard workout',
        style: 'destructive',
        onPress: () => {
          discardActiveWorkoutAndReturn();
        },
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 4, paddingBottom: insets.bottom + 112 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable accessibilityRole="button" onPress={() => router.back()} style={({ pressed }) => [styles.resumeButton, pressed && styles.pressed]}>
              <Text style={styles.resumeChevron}>‹</Text>
              <Text style={styles.resumeLabel}>Resume</Text>
            </Pressable>
            <Text style={styles.title}>Finish Workout</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.formStack}>
            <View style={styles.singleLineField}>
              <TextInput
                autoCapitalize="words"
                placeholder="Workout name"
                placeholderTextColor={colors.textMuted}
                selectionColor={colors.accent}
                style={styles.titleInput}
                value={title}
                onChangeText={setTitle}
              />
              {title.length > 0 ? (
                <Pressable accessibilityRole="button" onPress={() => setTitle('')} style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}>
                  <Text style={styles.clearLabel}>×</Text>
                </Pressable>
              ) : null}
            </View>

            <TextInput
              multiline
              onChangeText={setNotes}
              placeholder="How did it go? Share more about your workout"
              placeholderTextColor={colors.textMuted}
              selectionColor={colors.accent}
              style={styles.notesInput}
              textAlignVertical="top"
              value={notes}
            />

            <InfoRow icon="▣" label={dateTimeLabel} />
            <InfoRow icon="◷" label={durationLabel} />

            <Pressable onPress={openWorkoutMediaIntegration} style={({ pressed }) => [styles.mediaButton, pressed && styles.pressed]}>
              <Text style={styles.mediaIcon}>▧</Text>
              <Text style={styles.mediaLabel}>Add Photo/Video</Text>
            </Pressable>
          </View>

          <View style={styles.integrationList}>
            <IntegrationRow
              icon="▴"
              iconStyle={styles.stravaIcon}
              label="Post to Strava"
              value={stravaEnabled}
              onValueChange={(value) => {
                setStravaEnabled(value);
                if (value) {
                  openStravaIntegration();
                }
              }}
            />
            <IntegrationRow
              icon="♥"
              iconStyle={styles.healthIcon}
              label="Apple Health"
              value={appleHealthEnabled}
              onValueChange={(value) => {
                setAppleHealthEnabled(value);
                if (value) {
                  openAppleHealthIntegration();
                }
              }}
            />
          </View>

          <Pressable onPress={discardWorkout} style={({ pressed }) => [styles.discardButton, pressed && styles.pressed]}>
            <Text style={styles.discardLabel}>Discard Workout</Text>
          </Pressable>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.borderSubtle, paddingBottom: insets.bottom + Spacing.two }]}>
        <View style={styles.container}>
          <Pressable disabled={!canSave} onPress={handleSave} style={({ pressed }) => [styles.saveButton, !canSave && styles.saveButtonDisabled, pressed && canSave && styles.pressed]}>
            <Text style={[styles.saveButtonLabel, !canSave && styles.saveButtonLabelDisabled]}>Save</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function InfoRow({ icon, label }: { icon: string; label: string }) {
  const { colors } = useWorkoutTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <Text selectable style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoChevron}>⌄</Text>
    </View>
  );
}

function IntegrationRow({
  icon,
  iconStyle,
  label,
  onValueChange,
  value,
}: {
  icon: string;
  iconStyle: object;
  label: string;
  onValueChange: (value: boolean) => void;
  value: boolean;
}) {
  const { colors } = useWorkoutTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.integrationRow}>
      <View style={[styles.integrationIcon, iconStyle]}>
        <Text style={styles.integrationIconLabel}>{icon}</Text>
      </View>
      <Text style={styles.integrationLabel}>{label}</Text>
      <Switch style={styles.switchControl} value={value} onValueChange={onValueChange} trackColor={{ false: colors.surfaceSecondary, true: colors.accent }} thumbColor="#FFFFFF" />
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    clearButton: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 999,
      height: 22,
      justifyContent: 'center',
      width: 22,
    },
    clearLabel: {
      color: colors.textMuted,
      fontSize: 18,
      fontWeight: '900',
      lineHeight: 20,
    },
    container: {
      maxWidth: MaxContentWidth,
      width: '100%',
    },
    content: {
      alignItems: 'center',
      paddingHorizontal: Spacing.three,
    },
    discardButton: {
      alignItems: 'center',
      borderTopColor: colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
      minHeight: 50,
      justifyContent: 'center',
    },
    discardLabel: {
      color: colors.error,
      fontSize: 15,
      fontWeight: '700',
    },
    footer: {
      alignItems: 'center',
      borderTopWidth: StyleSheet.hairlineWidth,
      bottom: 0,
      left: 0,
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.two,
      position: 'absolute',
      right: 0,
    },
    formStack: {
      gap: Spacing.two,
      paddingTop: Spacing.three,
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      minHeight: 44,
    },
    headerSpacer: {
      flex: 1,
    },
    healthIcon: {
      backgroundColor: '#FFFFFF',
    },
    infoChevron: {
      color: colors.textPrimary,
      fontSize: 20,
      lineHeight: 20,
    },
    infoIcon: {
      color: colors.textPrimary,
      fontSize: 21,
      lineHeight: 22,
      width: 30,
    },
    infoLabel: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: 16,
      lineHeight: 21,
    },
    infoRow: {
      alignItems: 'center',
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: 8,
      borderWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: Spacing.two,
      minHeight: 56,
      paddingHorizontal: Spacing.two,
    },
    integrationIcon: {
      alignItems: 'center',
      borderCurve: 'continuous',
      borderRadius: 6,
      height: 32,
      justifyContent: 'center',
      width: 32,
    },
    integrationIconLabel: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '900',
    },
    integrationLabel: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: 16,
      lineHeight: 21,
    },
    integrationList: {
      borderTopColor: colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
      marginTop: Spacing.three,
    },
    integrationRow: {
      alignItems: 'center',
      borderBottomColor: colors.borderSubtle,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: Spacing.two,
      minHeight: 56,
    },
    loadingLabel: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '700',
    },
    loadingState: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: Spacing.three,
    },
    mediaButton: {
      alignItems: 'center',
      borderColor: colors.accent,
      borderCurve: 'continuous',
      borderRadius: 8,
      borderStyle: 'dashed',
      borderWidth: 1.5,
      gap: Spacing.one,
      height: 154,
      justifyContent: 'center',
      width: 154,
    },
    mediaIcon: {
      color: colors.textPrimary,
      fontSize: 25,
      lineHeight: 27,
    },
    mediaLabel: {
      color: colors.textPrimary,
      fontSize: 14,
      lineHeight: 18,
    },
    notesInput: {
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: 8,
      borderWidth: StyleSheet.hairlineWidth,
      color: colors.textPrimary,
      fontSize: 15,
      minHeight: 76,
      padding: Spacing.two,
    },
    pressed: {
      opacity: 0.72,
    },
    resumeButton: {
      alignItems: 'center',
      flex: 1,
      flexDirection: 'row',
      minHeight: 36,
    },
    resumeChevron: {
      color: colors.textPrimary,
      fontSize: 30,
      fontWeight: '300',
      lineHeight: 30,
      marginLeft: -6,
    },
    resumeLabel: {
      color: colors.textPrimary,
      fontSize: 15,
      lineHeight: 20,
    },
    saveButton: {
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderCurve: 'continuous',
      borderRadius: 999,
      minHeight: 58,
      justifyContent: 'center',
    },
    saveButtonDisabled: {
      opacity: 0.45,
    },
    saveButtonLabel: {
      color: '#000000',
      fontSize: 18,
      fontWeight: '900',
    },
    saveButtonLabelDisabled: {
      color: colors.textMuted,
    },
    screen: {
      backgroundColor: colors.background,
      flex: 1,
    },
    singleLineField: {
      alignItems: 'center',
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: 8,
      borderWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      minHeight: 56,
      paddingHorizontal: Spacing.two,
    },
    stravaIcon: {
      backgroundColor: '#FC4C02',
    },
    title: {
      color: colors.textPrimary,
      flex: 2,
      fontSize: 18,
      fontWeight: '700',
      textAlign: 'center',
    },
    titleInput: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: 16,
      lineHeight: 21,
      paddingVertical: Spacing.one,
    },
    switchControl: {
      transform: [{ scaleX: 0.86 }, { scaleY: 0.86 }],
    },
  });
