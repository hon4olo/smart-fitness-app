import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WorkoutBuilderCard } from '@/components/workouts/WorkoutBuilderCard';
import type { DraftWorkoutExercise } from '@/components/workouts/workout-builder-types';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { BottomTabInset, Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import {
  getWorkoutTemplateById,
  getWorkoutTemplateSummary,
  isWorkoutTemplateFavorite,
  parseWorkoutPlanDescription,
  startWorkoutSessionDraft,
  toggleWorkoutTemplateFavorite,
} from '@/lib/workouts';

const createDraftExercise = (name = '', overrides: Partial<DraftWorkoutExercise> = {}): DraftWorkoutExercise => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name,
  notes: '',
  restSeconds: '90',
  targetReps: '8',
  targetSets: '3',
  ...overrides,
});

const toPositiveInteger = (value: string, fallback: number) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const toPlanExercise = (exercise: DraftWorkoutExercise) => ({
  name: exercise.name.trim(),
  notes: exercise.notes.trim() || undefined,
  restSeconds: toPositiveInteger(exercise.restSeconds, 90),
  targetReps: toPositiveInteger(exercise.targetReps, 8),
  targetSets: toPositiveInteger(exercise.targetSets, 3),
});

type ParsedPlanExercise = {
  name: string;
  notes?: string;
  restSeconds?: number;
  targetReps?: number;
  targetSets?: number;
};

export default function WorkoutTemplateDetailRoute() {
  const { workoutId } = useLocalSearchParams<{ workoutId?: string }>();
  const { workouts, workoutSessions, addWorkoutTemplate, deleteWorkoutTemplate, updateWorkoutTemplate } = useAppContext();
  const resolvedWorkoutId = Array.isArray(workoutId) ? workoutId[0] : workoutId;
  const workout = useMemo(() => (resolvedWorkoutId ? getWorkoutTemplateById(resolvedWorkoutId, workouts) : null), [resolvedWorkoutId, workouts]);
  const summary = useMemo(() => (workout ? getWorkoutTemplateSummary(workout, workoutSessions) : null), [workout, workoutSessions]);
  const plan = useMemo(() => (workout ? parseWorkoutPlanDescription(workout.description) : { baseDescription: '', exercises: [] as ParsedPlanExercise[] }), [workout]);
  const planExercises: ParsedPlanExercise[] = workout
    ? plan.exercises.length > 0
      ? (plan.exercises as ParsedPlanExercise[])
      : workout.exercises.map((exercise) => ({ name: exercise.name, targetSets: 3, targetReps: 8, restSeconds: 90 }))
    : [];
  const [isEditing, setIsEditing] = useState(true);
  const [workoutTitle, setWorkoutTitle] = useState(workout?.title ?? '');
  const [workoutDescription, setWorkoutDescription] = useState(plan.baseDescription);
  const [draftExerciseName, setDraftExerciseName] = useState('');
  const [draftExercises, setDraftExercises] = useState<DraftWorkoutExercise[]>(
    workout
      ? (planExercises.length > 0
          ? planExercises.map((exercise) =>
              createDraftExercise(exercise.name, {
                notes: exercise.notes ?? '',
                restSeconds: `${exercise.restSeconds ?? 90}`,
                targetReps: `${exercise.targetReps ?? 8}`,
                targetSets: `${exercise.targetSets ?? 3}`,
              }),
            )
          : workout.exercises.map((exercise) => createDraftExercise(exercise.name)))
      : [],
  );
  const insets = useSafeAreaInsets();

  if (!workout || !summary) {
    return (
      <View style={styles.screen}>
        <EmptyState compact message="This workout template no longer exists." title="Template not found" />
      </View>
    );
  }

  const handleStart = () => {
    startWorkoutSessionDraft(workout);
    router.push({ pathname: '/workout-session', params: { workoutId: workout.id } });
  };

  const handleSave = () => {
    const nextExercises = draftExercises.filter((exercise) => exercise.name.trim().length > 0).map(toPlanExercise);
    const nextTitle = workoutTitle.trim();

    if (nextTitle.length === 0 || nextExercises.length === 0) {
      return;
    }

    const description = workoutDescription.trim();
    const nextPayload = {
      title: nextTitle,
      description: description || undefined,
      exercises: nextExercises.map((exercise) => exercise.name),
    };

    if (workout.isCustom) {
      updateWorkoutTemplate(workout.id, nextPayload);
    } else {
      addWorkoutTemplate({
        createdAt: new Date().toISOString(),
        description: nextPayload.description,
        exercises: nextPayload.exercises,
        id: `${workout.id}-copy-${Date.now()}`,
        title: `${nextTitle} Copy`,
      });
    }

    router.back();
  };

  const handleDelete = () => {
    if (!workout.isCustom) {
      return;
    }

    Alert.alert('Delete template?', 'This removes the workout template only. Completed sessions stay in history.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteWorkoutTemplate(workout.id);
          router.back();
        },
      },
    ]);
  };

  const handleDuplicate = () => {
    addWorkoutTemplate({
      createdAt: new Date().toISOString(),
      description: workoutDescription || workout.description,
      exercises: draftExercises.map((exercise) => exercise.name),
      id: `${workout.id}-copy-${Date.now()}`,
      title: `${workout.title} Copy`,
    });
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + BottomTabInset + 120 }]} style={styles.scrollView}>
        <View style={styles.container}>
          <SectionHeader subtitle={summary.subtitle} title={workout.title} />

          <AppCard style={styles.heroCard}>
            <Text selectable style={styles.heroMeta}>
              {summary.estimatedDuration} · {summary.exerciseCount} exercises
            </Text>
            <Text selectable style={styles.heroDescription}>
              {workout.description ?? 'Workout template details and editing controls.'}
            </Text>
            {summary.lastUsedLabel ? <Text selectable style={styles.heroMetaSecondary}>Last completed: {summary.lastUsedLabel}</Text> : null}
            <AppButton label="Start Workout" onPress={handleStart} />
            <AppButton label="Edit Template" onPress={() => setIsEditing((current) => !current)} variant="secondary" />
          </AppCard>

          <AppCard>
            <Text selectable style={styles.sectionTitle}>
              Ordered exercises
            </Text>
            <View style={styles.exerciseList}>
              {planExercises.map((exercise, index) => (
                <View key={`${exercise.name}-${index}`} style={styles.exerciseRow}>
                  <Text style={styles.exerciseIndex}>{index + 1}</Text>
                  <View style={styles.exerciseCopy}>
                    <Text selectable style={styles.exerciseName}>
                      {exercise.name}
                    </Text>
                    <Text selectable style={styles.exerciseMeta}>
                      {exercise.targetSets ?? 3} sets · {exercise.targetReps ?? 8} reps · {exercise.restSeconds ?? 90}s rest
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </AppCard>

          <AppCard>
            <Text selectable style={styles.sectionTitle}>
              Template actions
            </Text>
            <View style={styles.actionStack}>
              <AppButton label={isWorkoutTemplateFavorite(workout.id) ? 'Unfavorite' : 'Favorite'} onPress={() => toggleWorkoutTemplateFavorite(workout.id)} variant="secondary" />
              <AppButton label="Add to Program" onPress={() => router.push('/workouts/builder')} variant="secondary" />
              <AppButton label="Duplicate" onPress={handleDuplicate} variant="secondary" />
              {workout.isCustom ? <AppButton label="Delete" onPress={handleDelete} variant="secondary" /> : null}
            </View>
          </AppCard>

          {isEditing ? (
            <WorkoutBuilderCard
              draftExerciseName={draftExerciseName}
              draftExercises={draftExercises}
              editingWorkoutId={workout.id}
              isExpanded
              isSaveWorkoutDisabled={workoutTitle.trim().length === 0 || draftExercises.length === 0}
              onAddExercise={() => {
                const next = draftExerciseName.trim();
                if (!next) {
                  return;
                }
                setDraftExercises((current) => [...current, createDraftExercise(next)]);
                setDraftExerciseName('');
              }}
              onCancelEdit={() => router.back()}
              onDraftExerciseNameChange={setDraftExerciseName}
              onDuplicateExercise={(exerciseId) => {
                setDraftExercises((current) => {
                  const index = current.findIndex((exercise) => exercise.id === exerciseId);
                  if (index === -1) {
                    return current;
                  }

                  const next = [...current];
                  next.splice(index + 1, 0, createDraftExercise(current[index].name, { notes: current[index].notes, restSeconds: current[index].restSeconds, targetReps: current[index].targetReps, targetSets: current[index].targetSets }));
                  return next;
                });
              }}
              onExerciseChange={(exerciseId, patch) => setDraftExercises((current) => current.map((exercise) => (exercise.id === exerciseId ? { ...exercise, ...patch } : exercise)))}
              onMoveExercise={(exerciseId, direction) => setDraftExercises((current) => {
                const sourceIndex = current.findIndex((exercise) => exercise.id === exerciseId);
                const targetIndex = sourceIndex + direction;
                if (sourceIndex === -1 || targetIndex < 0 || targetIndex >= current.length) {
                  return current;
                }
                const next = [...current];
                const [moved] = next.splice(sourceIndex, 1);
                next.splice(targetIndex, 0, moved);
                return next;
              })}
              onRemoveDraftExercise={(exerciseId) => setDraftExercises((current) => current.filter((exercise) => exercise.id !== exerciseId))}
              onSaveWorkout={handleSave}
              onToggleExpanded={() => setIsEditing((current) => !current)}
              onWorkoutDescriptionChange={setWorkoutDescription}
              onWorkoutTitleChange={setWorkoutTitle}
              workoutDescription={workoutDescription}
              workoutTitle={workoutTitle}
            />
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  actionStack: {
    gap: Spacing.two,
  },
  container: {
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    width: '100%',
  },
  content: {
    alignItems: 'center',
    padding: Spacing.three,
  },
  exerciseCopy: {
    flex: 1,
    gap: 4,
  },
  exerciseIndex: {
    color: Colors.dark.accent,
    fontSize: 13,
    fontWeight: '900',
    width: 22,
  },
  exerciseList: {
    gap: Spacing.two,
  },
  exerciseMeta: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
  },
  exerciseName: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '800',
  },
  exerciseRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.two,
  },
  heroCard: {
    gap: Spacing.two,
  },
  heroDescription: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  heroMeta: {
    color: Colors.dark.accent,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  heroMetaSecondary: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  screen: {
    backgroundColor: Colors.dark.background,
    flex: 1,
  },
  scrollView: {
    backgroundColor: Colors.dark.background,
    flex: 1,
  },
  sectionTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '900',
  },
});
