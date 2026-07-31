import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { getShareWorkoutCopy } from '@/features/social/shareWorkoutCopy';
import { openAppleHealthIntegration } from '@/features/workouts/integrations/appleHealth';
import { openStravaIntegration } from '@/features/workouts/integrations/strava';
import { openWorkoutMediaIntegration } from '@/features/workouts/integrations/workoutMedia';
import {
  buildCompletedWorkoutSessionSnapshotFromDraft,
  getWorkoutSessionCompletedSetCount,
} from '@/features/workouts/sessionScreenModel';
import { useWorkoutTheme } from '@/features/workouts/workoutTheme';
import { useLocalization } from '@/localization';
import {
  clearActiveWorkoutSessionDraft,
  getActiveWorkoutSessionDraft,
  hydrateActiveWorkoutSessionDraft,
  markActiveWorkoutSessionCompleted,
  markActiveWorkoutSessionFinishing,
} from '@/lib/workouts';
import { createWorkoutSessionFinishStyles } from './workoutSessionFinishScreen.styles';

const getSessionTitleKey = () => {
  const hour = new Date().getHours();

  if (hour < 12) {
    return 'workouts.finish.morning' as const;
  }

  if (hour < 18) {
    return 'workouts.finish.afternoon' as const;
  }

  return 'workouts.finish.evening' as const;
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
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

const formatDateTimeLabel = (value: string, formatDate: ReturnType<typeof useLocalization>['formatDate'], todayAt: (time: string) => string) => {
  const date = new Date(value);
  const time = formatDate(date, { hour: '2-digit', minute: '2-digit' });

  if (isSameCalendarDay(date, new Date())) {
    return todayAt(time);
  }

  return formatDate(date, {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  });
};

export default function WorkoutSessionFinishScreen() {
  const { isRestoringState, saveWorkoutSession } = useAppContext();
  const { colors } = useWorkoutTheme();
  const { formatDate, locale, t } = useLocalization();
  const shareCopy = getShareWorkoutCopy(locale);
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createWorkoutSessionFinishStyles(colors), [colors]);
  const [draft, setDraft] = useState<ReturnType<typeof getActiveWorkoutSessionDraft> | undefined>(
    undefined,
  );
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
      setTitle(t(getSessionTitleKey()));
    }
  }, [draft, t, title.length]);

  useEffect(() => {
    if (!isRestoringState && draft === null) {
      router.replace('/workouts');
    }
  }, [draft, isRestoringState]);

  if (isRestoringState || draft === undefined) {
    return (
      <View style={[styles.screen, styles.loadingState]}>
        <Text style={styles.loadingLabel}>{t('workouts.session.loading')}</Text>
      </View>
    );
  }

  if (draft === null) {
    return null;
  }

  const completedSetCount = getWorkoutSessionCompletedSetCount(draft);
  const canSave = completedSetCount > 0;
  const dateTimeLabel = formatDateTimeLabel(new Date().toISOString(), formatDate, (time) => t('workouts.finish.todayAt', { time }));
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

  const completeWorkout = () => {
    if (!canSave || saveGuard.current) {
      return null;
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
    return completedSnapshot;
  };

  const handleSave = () => {
    if (completeWorkout()) {
      router.replace('/workouts');
    }
  };

  const handleSaveAndShare = () => {
    const completedSnapshot = completeWorkout();
    if (!completedSnapshot) return;
    router.replace({
      pathname: '/social/share-workout/[sessionId]',
      params: { sessionId: completedSnapshot.id },
    });
  };

  const discardWorkout = () => {
    Alert.alert(t('workouts.session.discardTitle'), t('workouts.session.discardDescription'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('workouts.session.discard'),
        style: 'destructive',
        onPress: discardActiveWorkoutAndReturn,
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 4, paddingBottom: insets.bottom + 176 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.back()}
              style={({ pressed }) => [styles.resumeButton, pressed && styles.pressed]}>
              <Text style={styles.resumeChevron}>‹</Text>
              <Text style={styles.resumeLabel}>{t('workouts.finish.resume')}</Text>
            </Pressable>
            <Text style={styles.title}>{t('workouts.finish.title')}</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.formStack}>
            <View style={styles.singleLineField}>
              <TextInput
                autoCapitalize="words"
                placeholder={t('workouts.finish.workoutName')}
                placeholderTextColor={colors.textMuted}
                selectionColor={colors.accent}
                style={styles.titleInput}
                value={title}
                onChangeText={setTitle}
              />
              {title.length > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setTitle('')}
                  style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}>
                  <Text style={styles.clearLabel}>×</Text>
                </Pressable>
              ) : null}
            </View>

            <TextInput
              multiline
              onChangeText={setNotes}
              placeholder={t('workouts.finish.notesPlaceholder')}
              placeholderTextColor={colors.textMuted}
              selectionColor={colors.accent}
              style={styles.notesInput}
              textAlignVertical="top"
              value={notes}
            />

            <InfoRow icon="▣" label={dateTimeLabel} />
            <InfoRow icon="◷" label={durationLabel} />

            <Pressable
              onPress={openWorkoutMediaIntegration}
              style={({ pressed }) => [styles.mediaButton, pressed && styles.pressed]}>
              <Text style={styles.mediaIcon}>▧</Text>
              <Text style={styles.mediaLabel}>{t('workouts.finish.addMedia')}</Text>
            </Pressable>
          </View>

          <View style={styles.integrationList}>
            <IntegrationRow
              icon="▴"
              iconStyle={styles.stravaIcon}
              label={t('workouts.finish.postStrava')}
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
              label={t('workouts.finish.appleHealth')}
              value={appleHealthEnabled}
              onValueChange={(value) => {
                setAppleHealthEnabled(value);
                if (value) {
                  openAppleHealthIntegration();
                }
              }}
            />
          </View>

          <Pressable
            onPress={discardWorkout}
            style={({ pressed }) => [styles.discardButton, pressed && styles.pressed]}>
            <Text style={styles.discardLabel}>{t('workouts.session.discard')}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.borderSubtle,
            paddingBottom: insets.bottom + Spacing.two,
          },
        ]}>
        <View style={[styles.container, styles.footerStack]}>
          <Pressable
            accessibilityRole="button"
            disabled={!canSave}
            onPress={handleSaveAndShare}
            style={({ pressed }) => [
              styles.shareButton,
              !canSave && styles.shareButtonDisabled,
              pressed && canSave && styles.pressed,
            ]}>
            <Text style={styles.shareButtonLabel}>{shareCopy.title}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={!canSave}
            onPress={handleSave}
            style={({ pressed }) => [
              styles.saveButton,
              !canSave && styles.saveButtonDisabled,
              pressed && canSave && styles.pressed,
            ]}>
            <Text style={[styles.saveButtonLabel, !canSave && styles.saveButtonLabelDisabled]}>
              {t('workouts.finish.save')}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function InfoRow({ icon, label }: { icon: string; label: string }) {
  const { colors } = useWorkoutTheme();
  const styles = useMemo(() => createWorkoutSessionFinishStyles(colors), [colors]);

  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <Text selectable style={styles.infoLabel}>
        {label}
      </Text>
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
  const styles = useMemo(() => createWorkoutSessionFinishStyles(colors), [colors]);

  return (
    <View style={styles.integrationRow}>
      <View style={[styles.integrationIcon, iconStyle]}>
        <Text style={styles.integrationIconLabel}>{icon}</Text>
      </View>
      <Text style={styles.integrationLabel}>{label}</Text>
      <View style={styles.switchSlot}>
        <Switch
          style={styles.switchControl}
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: colors.surfaceSecondary, true: colors.accent }}
          thumbColor="#FFFFFF"
        />
      </View>
    </View>
  );
}
