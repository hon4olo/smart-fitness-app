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
    readSource('src/features/workouts/screens/ProgramDetailScreen.tsx'),
    readSource('src/features/workouts/screens/NewRoutineScreen.tsx'),
    readSource('src/features/workouts/components/NewRoutineModals.tsx'),
  ].join('\n');

describe('program and routine localization', () => {
  it('provides English and Russian copy for program detail and routine creation', () => {
    const source = presentationSource();
    const copy = readSource('src/localization/programRoutineCopy.ts');

    expect(source).toContain('getProgramRoutineCopy');
    expect(copy).toContain('Загрузка программы…');
    expect(copy).toContain('Добавить тренировку в программу');
    expect(copy).toContain('Новая тренировка');
    expect(copy).toContain('Удалить упражнение?');
    expect(copy).toContain('Loading program…');
    expect(copy).toContain('Add routine to program');
    expect(copy).toContain('New Routine');
    expect(copy).toContain('Delete exercise?');
  });

  it('uses locale, stable title mapping and selected weight-unit boundaries', () => {
    const program = readSource(
      'src/features/workouts/screens/ProgramDetailScreen.tsx',
    );
    const routine = readSource(
      'src/features/workouts/screens/NewRoutineScreen.tsx',
    );
    const source = presentationSource();

    expect(program).toContain('getWorkoutsHubProgramTitle');
    expect(program).toContain('getWorkoutsHubWorkoutTitle');
    expect(program).toContain('formatNumber');
    expect(routine).toContain('useUnitPreferences');
    expect(routine).toContain('{weight}');
    expect(routine).toContain('copy.emptySetLine');
    expect(source).not.toContain('new Intl.');
    expect(source).not.toContain('toLocaleString');
    expect(source).not.toMatch(/['"`]\s*kg\b/);
    expect(source).not.toContain('>kg<');
  });

  it('preserves program favorite, removal, deletion and navigation contracts', () => {
    const program = readSource(
      'src/features/workouts/screens/ProgramDetailScreen.tsx',
    );

    expect(program).toContain('saveTrainingProgram');
    expect(program).toContain('deleteTrainingProgram(program.id)');
    expect(program).toContain('favorite: !Boolean(program.metadata?.favorite)');
    expect(program).toContain('workoutTemplateId: undefined');
    expect(program).toContain('workoutTemplateName: undefined');
    expect(program).toContain("pathname: '/workouts/routine/new'");
    expect(program).toContain("pathname: '/workouts/template/[workoutId]'");
    expect(program).not.toContain('deleteWorkoutSession');
  });

  it('preserves routine template creation and program attachment contracts', () => {
    const routine = readSource(
      'src/features/workouts/screens/NewRoutineScreen.tsx',
    );

    expect(routine).toContain('formatWorkoutPlanDescription');
    expect(routine).toContain('addWorkoutTemplate({');
    expect(routine).toContain('attachWorkoutsToProgramDraft');
    expect(routine).toContain('saveTrainingProgram(');
    expect(routine).toContain("pathname: '/workouts/program/[programId]'");
    expect(routine).toContain("savedWorkout: '1'");
    expect(routine).toContain('id: workoutId');
    expect(routine).toContain('createdAt: now');
  });

  it('localizes accessibility and removes hard-coded user controls', () => {
    const source = presentationSource();

    expect(source).toContain('accessibilityLabel={copy.addRoutine}');
    expect(source).toContain('accessibilityState={{ disabled: !canSave }}');
    expect(source).toContain('accessibilityState={{ expanded }}');
    expect(source).toContain('accessibilityLabel={copy.addExercises}');
    expect(source).not.toContain('>Add routine to program<');
    expect(source).not.toContain('>New Routine<');
    expect(source).not.toContain('placeholder="Routine name"');
    expect(source).not.toContain('>Replace exercise<');
    expect(source).not.toContain("Alert.alert('Delete exercise?'");
  });
});
