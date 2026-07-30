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

describe('workout template detail localization', () => {
  it('provides English and Russian detail, menu, deletion and start copy', () => {
    const screen = readSource(
      'src/features/workouts/screens/WorkoutTemplateDetailScreen.tsx',
    );
    const copy = readSource('src/localization/workoutTemplateDetailCopy.ts');

    expect(screen).toContain('getWorkoutTemplateDetailCopy');
    expect(copy).toContain('Загрузка тренировки…');
    expect(copy).toContain('Удалить тренировку?');
    expect(copy).toContain('Начать тренировку');
    expect(copy).toContain('Loading workout…');
    expect(copy).toContain('Delete workout?');
    expect(copy).toContain('Start Workout');
  });

  it('uses selected locale, number formatting and stable built-in title mapping', () => {
    const screen = readSource(
      'src/features/workouts/screens/WorkoutTemplateDetailScreen.tsx',
    );

    expect(screen).toContain('useLocalization');
    expect(screen).toContain('formatNumber');
    expect(screen).toContain('getWorkoutsHubWorkoutTitle');
    expect(screen).toContain('copy.setCount');
    expect(screen).not.toContain('new Intl.');
    expect(screen).not.toContain('toLocaleString');
    expect(screen).not.toContain("'Loading workout...'");
    expect(screen).not.toContain('>Start Workout<');
    expect(screen).not.toContain(' Sets<');
  });

  it('preserves hydration, parsing, favorite, deletion and workout-start contracts', () => {
    const screen = readSource(
      'src/features/workouts/screens/WorkoutTemplateDetailScreen.tsx',
    );

    expect(screen).toContain('hydrateActiveWorkoutSessionDraft');
    expect(screen).toContain('getWorkoutTemplateById');
    expect(screen).toContain('parseWorkoutPlanDescription');
    expect(screen).toContain('isWorkoutTemplateFavorite');
    expect(screen).toContain('toggleWorkoutTemplateFavorite');
    expect(screen).toContain('deleteWorkoutTemplate(workout.id)');
    expect(screen).toContain('startWorkoutSession(workout)');
    expect(screen).toContain("pathname: '/workout-session'");
    expect(screen).toContain('params: { workoutId: workout.id }');
  });

  it('keeps completed history intact and localizes accessibility boundaries', () => {
    const screen = readSource(
      'src/features/workouts/screens/WorkoutTemplateDetailScreen.tsx',
    );
    const copy = readSource('src/localization/workoutTemplateDetailCopy.ts');

    expect(copy).toContain('Completed sessions stay in history.');
    expect(copy).toContain('Завершённые тренировки останутся в истории.');
    expect(screen).not.toContain('deleteWorkoutSession');
    expect(screen).toContain('accessibilityLabel={copy.back}');
    expect(screen).toContain('accessibilityLabel={copy.moreOptions}');
    expect(screen).toContain('accessibilityHint={copy.startWorkoutHint}');
    expect(screen).toContain('accessibilityState={{ disabled: true }}');
  });
});
