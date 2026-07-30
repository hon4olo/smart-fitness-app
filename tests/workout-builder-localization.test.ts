import { describe, expect, it } from 'vitest';

declare const __dirname: string;
declare const require: any;

const { readFileSync } = require('fs') as {
  readFileSync(path: string, encoding: string): string;
};
const { resolve } = require('path') as {
  resolve(...parts: string[]): string;
};

const projectRoot = resolve(__dirname, '..');
const readSource = (relativePath: string) =>
  readFileSync(resolve(projectRoot, relativePath), 'utf8');

const presentationSource = () =>
  [
    readSource('src/features/workouts/screens/WorkoutBuilderScreen.tsx'),
    readSource('src/components/workouts/ProgramWorkoutPickerModal.tsx'),
    readSource('src/components/workouts/ProgramWorkoutEditorModal.tsx'),
    readSource('src/components/workouts/WorkoutBuilderCard.tsx'),
    readSource('src/components/workouts/WorkoutBuilderExerciseRow.tsx'),
  ].join('\n');

describe('workout builder localization', () => {
  it('provides bounded English and Russian builder copy', () => {
    const source = presentationSource();
    const copy = readSource('src/localization/workoutBuilderCopy.ts');

    expect(source).toContain('getWorkoutBuilderCopy');
    expect(copy).toContain('Отменить изменения?');
    expect(copy).toContain('Создать программу');
    expect(copy).toContain('Выбрать существующую тренировку');
    expect(copy).toContain('Конструктор тренировки');
    expect(copy).toContain('Discard changes?');
    expect(copy).toContain('Create program');
    expect(copy).toContain('Choose existing workout');
    expect(copy).toContain('Workout builder');
  });

  it('uses locale-aware counts and stable workout-title mapping', () => {
    const screen = readSource(
      'src/features/workouts/screens/WorkoutBuilderScreen.tsx',
    );
    const picker = readSource(
      'src/components/workouts/ProgramWorkoutPickerModal.tsx',
    );
    const source = presentationSource();

    expect(screen).toContain('getWorkoutsHubWorkoutTitle');
    expect(screen).toContain('formatNumber');
    expect(screen).toContain('copy.exerciseCount');
    expect(picker).toContain('getWorkoutsHubWorkoutTitle');
    expect(picker).toContain('copy.addWorkoutCount');
    expect(source).not.toContain('new Intl.');
    expect(source).not.toContain('toLocaleString');
    expect(source).not.toMatch(/['"`]\s*kg\b/);
  });

  it('preserves builder hydration, discard, save and navigation contracts', () => {
    const screen = readSource(
      'src/features/workouts/screens/WorkoutBuilderScreen.tsx',
    );

    expect(screen).toContain("navigation.addListener('beforeRemove'");
    expect(screen).toContain('serializeProgramDraft');
    expect(screen).toContain('createProgramDraftFromProgram');
    expect(screen).toContain('saveWorkoutProgram({');
    expect(screen).toContain('attachWorkoutsToProgramDraft');
    expect(screen).toContain('removeWorkoutFromProgramDraft');
    expect(screen).toContain('addWorkoutTemplate({');
    expect(screen).toContain('updateWorkoutTemplate(workoutEditorTarget.id, payload)');
    expect(screen).toContain("pathname: '/workouts/program/[programId]'");
    expect(screen).toContain('params: { programId: saved.id }');
  });

  it('preserves picker and editor state transitions', () => {
    const picker = readSource(
      'src/components/workouts/ProgramWorkoutPickerModal.tsx',
    );
    const editor = readSource(
      'src/components/workouts/ProgramWorkoutEditorModal.tsx',
    );

    expect(picker).toContain("useState<'choice' | 'existing'>('choice')");
    expect(picker).toContain('setSelectedIds([])');
    expect(picker).toContain('onAddWorkouts(selectedIds)');
    expect(picker).toContain('toggleWorkout(workout.id)');
    expect(editor).toContain('createWorkoutDraftFromWorkout');
    expect(editor).toContain('setDraftExercises(initialDraft.exercises)');
    expect(editor).toContain('duplicateExercise');
    expect(editor).toContain('moveExercise');
    expect(editor).toContain('onSaveWorkout({');
  });

  it('localizes controls and accessibility without literal English assertions', () => {
    const source = presentationSource();

    expect(source).toContain('accessibilityLabel={copy.save}');
    expect(source).toContain('accessibilityState={{ disabled: saveDisabled }}');
    expect(source).toContain('accessibilityState={{ checked: selected }}');
    expect(source).toContain('accessibilityState={{ expanded: isExpanded }}');
    expect(source).toContain('accessibilityLabel={copy.moveUp}');
    expect(source).not.toContain("Alert.alert('Discard changes?'");
    expect(source).not.toContain('>Create program<');
    expect(source).not.toContain('>Choose existing workout<');
    expect(source).not.toContain('label="Duplicate"');
    expect(source).not.toContain('placeholder="Bench press"');
  });
});
