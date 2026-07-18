import { describe, expect, it } from 'vitest';

import { defaultState } from '@/data/defaults';
import {
  attachWorkoutsToProgramDraft,
  createProgramDraftFromProgram,
  createWorkoutDraftFromWorkout,
  removeWorkoutFromProgramDraft,
  serializeProgramDraft,
} from '@/features/workouts/programEditorModel';
import { getWorkoutPrograms } from '@/lib/workouts';

const pushWorkout = defaultState.workouts.find((workout) => workout.id === 'push-a') ?? defaultState.workouts[0]!;
const legsWorkout = defaultState.workouts.find((workout) => workout.id === 'legs-a') ?? defaultState.workouts[1]!;
const conditioningWorkout = defaultState.workouts.find((workout) => workout.id === 'conditioning-a') ?? defaultState.workouts[2]!;

describe('program editor flow helpers', () => {
  const primaryProgram = getWorkoutPrograms(defaultState.workouts)[0]!;

  it('attaches existing workouts without duplicating the same template twice', () => {
    const baseProgram = createProgramDraftFromProgram(primaryProgram);
    const withTwoWorkouts = attachWorkoutsToProgramDraft(baseProgram, defaultState.workouts, [pushWorkout.id, legsWorkout.id, pushWorkout.id]);

    const attachedIds = withTwoWorkouts.days.filter((day) => day.workoutTemplateId).map((day) => day.workoutTemplateId);
    expect(attachedIds).toContain(pushWorkout.id);
    expect(attachedIds).toContain(legsWorkout.id);
    expect(attachedIds.filter((id) => id === pushWorkout.id)).toHaveLength(1);
  });

  it('removes a workout from the draft without touching other days', () => {
    const baseProgram = createProgramDraftFromProgram(primaryProgram);
    const withWorkout = attachWorkoutsToProgramDraft(baseProgram, defaultState.workouts, [conditioningWorkout.id]);
    const dayId = withWorkout.days.find((day) => day.workoutTemplateId === conditioningWorkout.id)?.id;
    expect(dayId).toBeDefined();

    const removed = removeWorkoutFromProgramDraft(withWorkout, dayId!);
    expect(removed.days.find((day) => day.id === dayId)?.restDay).toBe(true);
    expect(removed.days.filter((day) => day.workoutTemplateId === conditioningWorkout.id)).toHaveLength(0);
  });

  it('builds a workout draft from a template with editable metadata and ordered exercises', () => {
    const draft = createWorkoutDraftFromWorkout(pushWorkout);

    expect(draft.editingWorkoutId).toBe(pushWorkout.id);
    expect(draft.title).toBe(pushWorkout.title);
    expect(draft.description).toBe(pushWorkout.description ?? '');
    expect(draft.exercises.map((exercise) => exercise.id)).toEqual(pushWorkout.exercises.map((exercise) => exercise.id));
    expect(draft.exercises.length).toBe(pushWorkout.exercises.length);
  });

  it('serializes only the program draft fields that should trigger dirty state', () => {
    const program = createProgramDraftFromProgram(primaryProgram);
    expect(serializeProgramDraft(program)).toContain('days');
    expect(serializeProgramDraft(program)).toContain('name');
  });
});
