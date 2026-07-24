import { describe, expect, it, vi } from 'vitest';

import {
  asPercent,
  clampNumber,
  evaluateRules,
  getMotivationInsight,
  getNutritionAdvisor,
  getRecoveryAdvisor,
  getTrainingAdvisor,
  pickFirstDefined,
  pickRuleResult,
  safeDivide,
  uniqueValues,
  type Rule,
} from '@/lib/intelligence';
import {
  NOW,
  backWorkout,
  bench,
  chestWorkout,
  makeFoodEntry,
  makeSession,
  rdl,
  rearDeltFly,
  row,
  squat,
} from './intelligenceFixtures';

describe('rule engine', () => {
  it('clamps numbers at the lower bound', () => {
    expect(clampNumber(-5, 0, 10)).toBe(0);
  });

  it('clamps numbers at the upper bound', () => {
    expect(clampNumber(20, 0, 10)).toBe(10);
  });

  it('handles safe division by zero', () => {
    expect(safeDivide(10, 0)).toBe(0);
  });

  it('calculates percentages deterministically', () => {
    expect(asPercent(25, 100)).toBe(25);
  });

  it('deduplicates values while preserving first-seen order', () => {
    expect(uniqueValues(['a', 'b', 'a', 'c', 'b'])).toEqual(['a', 'b', 'c']);
  });

  it('returns the first defined value', () => {
    expect(pickFirstDefined([undefined, null, 'first', 'second'])).toBe('first');
  });

  it('evaluates matching rules in priority order and keeps ties stable', () => {
    const rules: Rule<{ value: number }, string>[] = [
      { id: 'low', priority: 1, when: () => true, then: () => 'low' },
      { id: 'high-a', priority: 10, when: () => true, then: () => 'high-a' },
      { id: 'high-b', priority: 10, when: () => true, then: () => 'high-b' },
    ];

    expect(evaluateRules({ value: 3 }, rules).map((match) => match.result)).toEqual([
      'high-a',
      'high-b',
      'low',
    ]);
  });

  it('returns a fallback when no rule matches', () => {
    const rules: Rule<{ value: number }, string>[] = [
      { id: 'never', priority: 1, when: () => false, then: () => 'hit' },
    ];

    expect(pickRuleResult({ value: 3 }, rules, 'fallback')).toBe('fallback');
  });
});

describe('training advisor', () => {
  it('flags chest overtraining and prioritizes reducing chest volume', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const result = getTrainingAdvisor({
      exercises: [bench, row, squat, rdl, rearDeltFly],
      workoutSessions: [
        makeSession({ hoursAgo: 12, id: 's1', sets: 8, workout: chestWorkout }),
      ],
      workouts: [chestWorkout],
    });

    expect(result.status).toBe('needs-attention');
    expect(result.primaryRecommendation).toBe('Reduce chest volume');
    expect(result.trainingFocus).toBe('Focus on back');
    expect(result.weeklySets).toBe(8);
    expect(result.weeklyVolume).toBe(6400);
    expect(result.warnings.join(' | ')).toContain('Missing muscle groups');

    vi.useRealTimers();
  });

  it('recommends adding rear delts when shoulders are undertrained', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const result = getTrainingAdvisor({
      exercises: [bench, row, squat, rdl, rearDeltFly],
      workoutSessions: [
        makeSession({ hoursAgo: 12, id: 's1', sets: 8, workout: chestWorkout }),
      ],
      workouts: [chestWorkout],
    });

    expect(result.recommendations.map((recommendation) => recommendation.title)).toContain(
      'Add rear delts',
    );

    vi.useRealTimers();
  });

  it('recommends increasing back volume when back is undertrained', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const result = getTrainingAdvisor({
      exercises: [bench, row, squat, rdl, rearDeltFly],
      workoutSessions: [
        makeSession({ hoursAgo: 12, id: 's1', sets: 8, workout: chestWorkout }),
      ],
      workouts: [chestWorkout],
    });

    expect(result.recommendations.map((recommendation) => recommendation.title)).toContain(
      'Increase back volume',
    );
    expect(result.improvementOpportunities).toContain('Increase back volume');

    vi.useRealTimers();
  });

  it('recommends training hamstrings when they are missing', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const result = getTrainingAdvisor({
      exercises: [bench, row, squat, rdl, rearDeltFly],
      workoutSessions: [
        makeSession({ hoursAgo: 12, id: 's1', sets: 8, workout: chestWorkout }),
      ],
      workouts: [chestWorkout],
    });

    expect(result.recommendations.map((recommendation) => recommendation.title)).toContain(
      'Train hamstrings',
    );

    vi.useRealTimers();
  });

  it('recommends considering a deload on extreme weekly volume', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const result = getTrainingAdvisor({
      exercises: [bench, row, squat, rdl, rearDeltFly],
      workoutSessions: [
        makeSession({ hoursAgo: 12, id: 's1', sets: 120, workout: chestWorkout }),
      ],
      workouts: [chestWorkout],
    });

    expect(result.status).toBe('deload');
    expect(result.primaryRecommendation).toBe('Consider deload');

    vi.useRealTimers();
  });

  it('reports muscle summary arrays in a stable shape', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const result = getTrainingAdvisor({
      exercises: [bench, row, squat, rdl, rearDeltFly],
      workoutSessions: [
        makeSession({ hoursAgo: 12, id: 's1', sets: 8, workout: chestWorkout }),
      ],
      workouts: [chestWorkout],
    });

    expect(result.muscleSummary.overtrained).toContain('Chest');
    expect(result.muscleSummary.undertrained).toContain('Back');
    expect(Array.isArray(result.muscleSummary.missing)).toBe(true);

    vi.useRealTimers();
  });

  it('keeps the program-focused recommendation list deterministic', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const result = getTrainingAdvisor({
      exercises: [bench, row, squat, rdl, rearDeltFly],
      workoutSessions: [
        makeSession({ hoursAgo: 12, id: 's1', sets: 8, workout: chestWorkout }),
      ],
      workouts: [chestWorkout],
    });

    expect(result.recommendations[0]?.title).toBe('Reduce chest volume');
    expect(result.recommendations[0]?.tone).toBe('warning');

    vi.useRealTimers();
  });

  it('keeps at least one actionable improvement opportunity', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const result = getTrainingAdvisor({
      exercises: [bench, row, squat, rdl, rearDeltFly],
      workoutSessions: [
        makeSession({ hoursAgo: 12, id: 's1', sets: 8, workout: chestWorkout }),
      ],
      workouts: [chestWorkout],
    });

    expect(result.improvementOpportunities.length).toBeGreaterThan(0);

    vi.useRealTimers();
  });
});

describe('recovery advisor', () => {
  it('reports ready when no sessions exist', () => {
    const result = getRecoveryAdvisor({
      exercises: [bench, row],
      workoutSessions: [],
      workouts: [],
    });

    expect(result.status).toBe('Ready');
    expect(result.recommendedWaitTime).toBe('0h');
    expect(result.recommendedNextWorkout).toBe('Any planned workout');
    expect(result.lastWorkoutAt).toBeNull();
  });

  it('reports overloaded for very recent workouts', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const result = getRecoveryAdvisor({
      exercises: [bench, row],
      workoutSessions: [
        makeSession({ hoursAgo: 6, id: 's1', sets: 5, workout: chestWorkout }),
      ],
      workouts: [chestWorkout, backWorkout],
    });

    expect(result.status).toBe('Overloaded');
    expect(result.recommendedWaitTime).toBe('48–72h');

    vi.useRealTimers();
  });

  it('reports recovering for sub-day recovery windows', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const result = getRecoveryAdvisor({
      exercises: [bench, row],
      workoutSessions: [
        makeSession({ hoursAgo: 18, id: 's1', sets: 5, workout: chestWorkout }),
      ],
      workouts: [chestWorkout, backWorkout],
    });

    expect(result.status).toBe('Recovering');
    expect(result.recommendedWaitTime).toBe('6–12h');

    vi.useRealTimers();
  });

  it('reports recovery delayed when weekly load stays high', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const result = getRecoveryAdvisor({
      exercises: [bench, row],
      workoutSessions: [
        makeSession({ hoursAgo: 36, id: 's1', sets: 10, workout: chestWorkout }),
      ],
      workouts: [chestWorkout, backWorkout],
    });

    expect(result.status).toBe('Recovery Delayed');
    expect(result.recommendedWaitTime).toBe('24–48h');

    vi.useRealTimers();
  });

  it('reports fully recovered for older low-volume sessions', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const result = getRecoveryAdvisor({
      exercises: [bench, row],
      workoutSessions: [
        makeSession({ hoursAgo: 60, id: 's1', sets: 5, workout: chestWorkout }),
      ],
      workouts: [chestWorkout, backWorkout],
    });

    expect(result.status).toBe('Fully Recovered');
    expect(result.recommendedWaitTime).toBe('0–12h');

    vi.useRealTimers();
  });

  it('recommends the oldest-idle muscle group next', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const result = getRecoveryAdvisor({
      exercises: [bench, row],
      workoutSessions: [
        makeSession({ hoursAgo: 24, id: 's1', sets: 5, workout: chestWorkout }),
        makeSession({ hoursAgo: 96, id: 's2', sets: 5, workout: backWorkout }),
      ],
      workouts: [chestWorkout, backWorkout],
    });

    expect(result.recommendedNextWorkout.toLowerCase()).toContain('back');
    expect(result.recoveryExplanation).toContain('Last workout was');

    vi.useRealTimers();
  });
});

describe('nutrition advisor', () => {
  const targets = { calories: 2000, protein: 140, carbs: 180, fats: 70 };

  it('sums consumed macros and remaining targets', () => {
    const result = getNutritionAdvisor({
      entries: [
        makeFoodEntry('breakfast', 600, 40, 50, 20, 'e1'),
        makeFoodEntry('lunch', 700, 50, 60, 25, 'e2'),
      ],
      targets,
      goalType: 'maintain',
    });
    expect(result.consumed).toEqual({ calories: 1300, protein: 90, carbs: 110, fats: 45 });
    expect(result.caloriesRemaining).toBe(700);
    expect(result.proteinRemaining).toBe(50);
  });

  it('flags under-eating when calories are still far below target', () => {
    const result = getNutritionAdvisor({
      entries: [
        makeFoodEntry('breakfast', 500, 46, 40, 15, 'e1'),
        makeFoodEntry('lunch', 500, 46, 40, 15, 'e2'),
        makeFoodEntry('dinner', 500, 46, 40, 15, 'e3'),
      ],
      targets,
      goalType: 'gain_muscle',
    });

    expect(result.status).toBe('Under-eating');
    expect(result.primaryRecommendation).toBe('Under-eating');
    expect(result.recommendations[0]?.detail).toContain('remaining');
  });

  it('flags over-eating when calories exceed target', () => {
    const result = getNutritionAdvisor({
      entries: [
        makeFoodEntry('breakfast', 900, 60, 80, 30, 'e1'),
        makeFoodEntry('lunch', 900, 60, 80, 30, 'e2'),
        makeFoodEntry('dinner', 500, 30, 30, 15, 'e3'),
      ],
      targets,
      goalType: 'maintain',
    });

    expect(result.status).toBe('Over-eating');
    expect(result.primaryRecommendation).toBe('Over-eating');
    expect(result.caloriesRemaining).toBeLessThan(0);
  });

  it('flags protein shortfall when protein remains above the threshold', () => {
    const result = getNutritionAdvisor({
      entries: [
        makeFoodEntry('breakfast', 650, 35, 55, 20, 'e1'),
        makeFoodEntry('lunch', 650, 35, 55, 20, 'e2'),
        makeFoodEntry('dinner', 550, 40, 50, 18, 'e3'),
      ],
      targets,
      goalType: 'maintain',
    });

    expect(result.status).toBe('Protein short');
    expect(result.macroBalance).toBe('Protein is low');
  });

  it('tracks missed meals deterministically', () => {
    const result = getNutritionAdvisor({
      entries: [makeFoodEntry('breakfast', 650, 45, 55, 20, 'e1')],
      targets,
      goalType: 'maintain',
    });

    expect(result.status).toBe('Missed meals');
    expect(result.missedMeals).toEqual(['lunch', 'dinner']);
  });

  it('returns an on-track recommendation when calories and macros are close', () => {
    const result = getNutritionAdvisor({
      entries: [
        makeFoodEntry('breakfast', 650, 45, 55, 20, 'e1'),
        makeFoodEntry('lunch', 650, 45, 55, 20, 'e2'),
        makeFoodEntry('dinner', 700, 50, 70, 30, 'e3'),
      ],
      targets,
      goalType: 'maintain',
    });

    expect(result.status).toBe('On track');
    expect(result.primaryRecommendation).toBe('Macro balance looks good');
  });
});

describe('motivation insight', () => {
  it('prioritizes the weekly workout count insight', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const training = getTrainingAdvisor({
      exercises: [bench, row, squat, rdl, rearDeltFly],
      workoutSessions: [
        makeSession({ hoursAgo: 12, id: 's1', sets: 8, workout: chestWorkout }),
      ],
      workouts: [chestWorkout],
    });
    const recovery = getRecoveryAdvisor({
      exercises: [bench, row],
      workoutSessions: [],
      workouts: [],
    });
    const nutrition = getNutritionAdvisor({
      entries: [],
      targets: { calories: 2000, protein: 140, carbs: 180, fats: 70 },
      goalType: 'maintain',
    });

    expect(
      getMotivationInsight({
        nutrition,
        recovery,
        training,
        weeklyVolumeChangePercent: 12,
        weeklyWorkoutCount: 4,
      }),
    ).toBe('You trained 4 times this week.');

    vi.useRealTimers();
  });
});