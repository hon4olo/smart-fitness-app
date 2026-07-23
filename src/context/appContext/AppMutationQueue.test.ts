import { describe, expect, it, vi } from 'vitest';

import { AppMutationQueue } from './AppMutationQueue';

const deferred = () => {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });
  return { promise, reject, resolve };
};

describe('AppMutationQueue', () => {
  it('runs persistence and outbox steps in strict enqueue order', async () => {
    const firstSave = deferred();
    const calls: string[] = [];
    const queue = new AppMutationQueue();

    const first = queue.enqueue({
      label: 'First mutation',
      steps: [
        {
          stage: 'local_persistence',
          run: async () => {
            calls.push('first-save-start');
            await firstSave.promise;
            calls.push('first-save-end');
          },
        },
        {
          stage: 'outbox',
          run: async () => {
            calls.push('first-outbox');
          },
        },
      ],
    });
    const second = queue.enqueue({
      label: 'Second mutation',
      steps: [
        {
          stage: 'local_persistence',
          run: async () => {
            calls.push('second-save');
          },
        },
      ],
    });

    await Promise.resolve();
    expect(calls).toEqual(['first-save-start']);
    expect(queue.getSnapshot().pendingCount).toBe(2);

    firstSave.resolve();
    await Promise.all([first, second]);

    expect(calls).toEqual([
      'first-save-start',
      'first-save-end',
      'first-outbox',
      'second-save',
    ]);
    expect(queue.getSnapshot()).toEqual({ pendingCount: 0, failure: null });
  });

  it('captures the exact failed stage and continues later queued work', async () => {
    const calls: string[] = [];
    const queue = new AppMutationQueue();

    const failed = queue.enqueue({
      label: 'Save weight entry',
      steps: [
        {
          stage: 'local_persistence',
          run: async () => {
            calls.push('saved');
          },
        },
        {
          stage: 'outbox',
          run: async () => {
            throw new Error('Queue unavailable');
          },
        },
      ],
    });
    const later = queue.enqueue({
      label: 'Save profile',
      steps: [
        {
          stage: 'local_persistence',
          run: async () => {
            calls.push('later-saved');
          },
        },
      ],
    });

    await expect(failed).rejects.toThrow('Queue unavailable');
    await expect(later).resolves.toBeUndefined();

    expect(calls).toEqual(['saved', 'later-saved']);
    expect(queue.getSnapshot().failure).toMatchObject({
      label: 'Save weight entry',
      message: 'Queue unavailable',
      stage: 'outbox',
    });
  });

  it('retries the retained failed task and clears the failure after success', async () => {
    const outbox = vi.fn().mockRejectedValueOnce(new Error('Temporary failure'));
    outbox.mockResolvedValueOnce(undefined);
    const queue = new AppMutationQueue();
    const task = {
      label: 'Save weight entry',
      steps: [
        { stage: 'local_persistence' as const, run: vi.fn().mockResolvedValue(undefined) },
        { stage: 'outbox' as const, run: outbox },
      ],
    };

    await expect(queue.enqueue(task)).rejects.toThrow('Temporary failure');
    expect(queue.getSnapshot().failure?.stage).toBe('outbox');

    await expect(queue.retryFailure()).resolves.toBeUndefined();

    expect(task.steps[0].run).toHaveBeenCalledTimes(2);
    expect(outbox).toHaveBeenCalledTimes(2);
    expect(queue.getSnapshot()).toEqual({ pendingCount: 0, failure: null });
  });

  it('dismisses a retained failure so retry becomes a no-op', async () => {
    const queue = new AppMutationQueue();
    const run = vi.fn().mockRejectedValue(new Error('Permanent failure'));

    await expect(
      queue.enqueue({
        label: 'Save data',
        steps: [{ stage: 'local_persistence', run }],
      }),
    ).rejects.toThrow('Permanent failure');

    queue.dismissFailure();
    await queue.retryFailure();

    expect(run).toHaveBeenCalledTimes(1);
    expect(queue.getSnapshot().failure).toBeNull();
  });
});
