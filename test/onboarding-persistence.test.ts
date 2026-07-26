import { describe, expect, it, vi } from 'vitest';

import { completeOnboardingInState } from '@/context/appContext/progressActions';
import { defaultState } from '@/data/defaults';
import { calculateNutritionTargets } from '@/features/profile/profilePlan';
import { hasCompleteOnboardingData } from '@/lib/onboarding';
import {
  APP_STATE_STORAGE_KEY,
  createLocalAppRepository,
} from '@/repositories/LocalAppRepository';
import type { StorageAdapter } from '@/storage/StorageAdapter';
import type { AppState } from '@/types';

declare const __dirname: string;
declare const require: any;

const { readFileSync } = require('fs') as {
  readFileSync: (path: string, encoding: string) => string;
};
const { resolve } = require('path') as { resolve: (...parts: string[]) => string };
const projectRoot = resolve(__dirname, '..');
const readSource = (path: string) => readFileSync(resolve(projectRoot, path), 'utf8');

const makeMemoryStorage = (initial?: string): StorageAdapter => {
  const values = new Map<string, string>();
  if (initial) values.set(APP_STATE_STORAGE_KEY, initial);

  return {
    read: vi.fn(async (key: string) => values.get(key) ?? null),
    write: vi.fn(async (key: string, value: string) => {
      values.set(key, value);
    }),
    remove: vi.fn(async (key: string) => {
      values.delete(key);
    }),
  };
};

const completeState = (): AppState =>
  completeOnboardingInState(
    {
      ...defaultState,
      profile: {
        ...defaultState.profile,
        height: '175',
        trainingExperience: 'intermediate',
      },
    },
    {
      age: 24,
      activityLevel: 'moderate',
      currentWeight: 82.7,
      goalType: 'gain_muscle',
      trainingDaysPerWeek: 4,
    },
    {
      id: 'onboarding-initial-weight',
      date: '26 Jul',
      createdAt: '2026-07-26T12:00:00.000Z',
    },
  ).nextState;

describe('onboarding persistence', () => {
  it('commits profile, weight, nutrition targets, and completion in one state', () => {
    const nextState = completeState();

    expect(nextState.onboardingCompleted).toBe(true);
    expect(nextState.profile).toMatchObject({
      activityLevel: 'moderate',
      dateOfBirth: '2002-01-01',
      goalType: 'gain_muscle',
      targetWeight: 82.7,
      trainingDaysPerWeek: 4,
      trainingExperience: 'intermediate',
      height: '175',
      weight: '82.7 kg',
    });
    expect(nextState.weightHistory[0]?.weight).toBe(82.7);
    expect(nextState.nutritionTargets).toEqual(
      calculateNutritionTargets({
        activityLevel: 'moderate',
        goalType: 'gain_muscle',
        weightKg: 82.7,
      }),
    );
  });

  it('round-trips the completed onboarding state through local storage', async () => {
    const storage = makeMemoryStorage();
    const repository = createLocalAppRepository(storage);

    await repository.saveState(completeState());
    const restored = await repository.loadState();

    expect(restored?.onboardingCompleted).toBe(true);
    expect(restored?.profile.dateOfBirth).toBe('2002-01-01');
    expect(restored?.profile.activityLevel).toBe('moderate');
    expect(restored?.weightHistory[0]?.weight).toBe(82.7);
  });

  it('recovers completion for legacy stored states that predate the completion flag', async () => {
    const legacyState = completeState() as Partial<AppState>;
    delete legacyState.onboardingCompleted;
    const repository = createLocalAppRepository(
      makeMemoryStorage(JSON.stringify(legacyState)),
    );

    await expect(repository.loadState()).resolves.toMatchObject({
      onboardingCompleted: true,
    });
  });

  it('preserves an explicit onboarding reset', async () => {
    const repository = createLocalAppRepository(
      makeMemoryStorage(
        JSON.stringify({
          ...completeState(),
          onboardingCompleted: false,
        }),
      ),
    );

    await expect(repository.loadState()).resolves.toMatchObject({
      onboardingCompleted: false,
    });
  });

  it('rejects failed local writes so the UI cannot navigate as if persistence succeeded', async () => {
    const storage: StorageAdapter = {
      read: vi.fn(async () => null),
      write: vi.fn(async () => {
        throw new Error('storage unavailable');
      }),
      remove: vi.fn(async () => undefined),
    };
    const repository = createLocalAppRepository(storage);

    await expect(repository.saveState(completeState())).rejects.toThrow(
      'storage unavailable',
    );
  });

  it('requires all persisted onboarding inputs before inferring completion', () => {
    const state = completeState();

    expect(
      hasCompleteOnboardingData({
        profile: state.profile,
        weightHistory: state.weightHistory,
      }),
    ).toBe(true);
    expect(
      hasCompleteOnboardingData({
        profile: { ...state.profile, activityLevel: '' },
        weightHistory: state.weightHistory,
      }),
    ).toBe(false);
  });

  it('waits for the mutation queue before leaving onboarding', () => {
    const screen = readSource('src/features/onboarding/OnboardingClientScreen.tsx');
    const action = readSource('src/context/appContext/progressActions.ts');

    expect(screen).toContain('pendingMutationCount > 0');
    expect(screen).toContain("mutationFailure?.label === 'Complete onboarding'");
    expect(screen).not.toContain('updateNutritionTargets(');
    expect(action).toContain('nutritionTargets: calculateNutritionTargets({');
  });
});
