import { describe, expect, test } from 'vitest';

declare const __dirname: string;
declare const require: any;

const { readFileSync } = require('fs') as {
  readFileSync: (path: string, encoding: string) => string;
};
const { resolve } = require('path') as { resolve: (...parts: string[]) => string };

const projectRoot = resolve(__dirname, '..');
const readSource = (relativePath: string) =>
  readFileSync(resolve(projectRoot, relativePath), 'utf8');

describe('persistence operation matrix', () => {
  test('keeps AppState persistence centralized and ordered before outbox work', () => {
    const source = readSource('src/context/appContext/useAppMutationQueue.ts');
    const localPersistenceIndex = source.indexOf("stage: 'local_persistence'");
    const saveStateIndex = source.indexOf('repository.saveState(nextState)');
    const outboxIndex = source.indexOf("stage: 'outbox', run: outbox");

    expect(localPersistenceIndex).toBeGreaterThanOrEqual(0);
    expect(saveStateIndex).toBeGreaterThan(localPersistenceIndex);
    expect(outboxIndex).toBeGreaterThan(saveStateIndex);
  });

  test('keeps active workout drafts on their dedicated revision-aware storage path', () => {
    const source = readSource('src/features/workouts/storage.ts');

    expect(source).toContain('activeWorkoutSessionDraftRevision += 1');
    expect(source).toContain('revision !== activeWorkoutSessionDraftRevision');
    expect(source).toContain('AsyncStorage.setItem(ACTIVE_WORKOUT_SESSION_DRAFT_STORAGE_KEY');
    expect(source).not.toContain('repository.saveState');
  });

  test('keeps weight mutations and onboarding completion outbox-bearing', () => {
    const weightSource = readSource('src/context/appContext/useWeightHistoryActions.ts');
    const providerSource = readSource('src/context/AppContext.tsx');

    for (const label of ['Save weight entry', 'Update weight entry', 'Delete weight entry']) {
      expect(weightSource).toContain(`label: '${label}'`);
    }
    expect(weightSource).toContain("createWeightHistoryOutboxStep('create', entry)");
    expect(weightSource).toContain("createWeightHistoryOutboxStep('update', entry)");
    expect(weightSource).toContain("createWeightHistoryOutboxStep('delete', entry)");
    expect(providerSource).toContain("label: 'Complete onboarding'");
    expect(providerSource).toContain("createWeightHistoryOutboxStep('create', initialWeightEntry)");
  });

  test('documents all four target flows and prohibits generic mutation-queue debounce', () => {
    const source = readSource('docs/architecture/persistence-operation-matrix.md');

    for (const requiredText of [
      'Active workout',
      'Nutrition',
      'Weight',
      'Profile',
      'No evidence currently justifies a generic debounce around `AppMutationQueue`.',
    ]) {
      expect(source).toContain(requiredText);
    }
  });
});
