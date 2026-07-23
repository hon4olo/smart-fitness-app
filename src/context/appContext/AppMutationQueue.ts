import type { AppMutationFailure, AppMutationStage } from '@/types';

export type AppMutationStep = {
  stage: AppMutationStage;
  run(): Promise<void>;
};

export type AppMutationTask = {
  label: string;
  steps: AppMutationStep[];
};

export type AppMutationQueueSnapshot = {
  pendingCount: number;
  failure: AppMutationFailure | null;
};

type Listener = () => void;

const getErrorMessage = (error: unknown): string =>
  error instanceof Error && error.message.trim() ? error.message : 'The local mutation failed.';

export class AppMutationQueue {
  private failureSequence = 0;
  private failedTask: AppMutationTask | null = null;
  private listeners = new Set<Listener>();
  private snapshot: AppMutationQueueSnapshot = { pendingCount: 0, failure: null };
  private tail: Promise<void> = Promise.resolve();

  getSnapshot = (): AppMutationQueueSnapshot => this.snapshot;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  enqueue = (task: AppMutationTask): Promise<void> => this.schedule(task, false);

  retryFailure = (): Promise<void> => {
    const task = this.failedTask;
    return task ? this.schedule(task, true) : Promise.resolve();
  };

  dismissFailure = (): void => {
    this.failedTask = null;
    this.updateSnapshot({ failure: null });
  };

  private schedule(task: AppMutationTask, retrying: boolean): Promise<void> {
    if (retrying && this.failedTask === task) {
      this.updateSnapshot({ failure: null });
    }

    this.updateSnapshot({ pendingCount: this.snapshot.pendingCount + 1 });
    const queuedRun = this.tail.then(() => this.runTask(task));
    this.tail = queuedRun.catch(() => undefined);

    return queuedRun.finally(() => {
      this.updateSnapshot({ pendingCount: Math.max(0, this.snapshot.pendingCount - 1) });
    });
  }

  private async runTask(task: AppMutationTask): Promise<void> {
    let stage: AppMutationStage = 'local_persistence';

    try {
      for (const step of task.steps) {
        stage = step.stage;
        await step.run();
      }
    } catch (error) {
      this.failureSequence += 1;
      this.failedTask = task;
      this.updateSnapshot({
        failure: {
          id: `app-mutation-${Date.now()}-${this.failureSequence}`,
          label: task.label,
          message: getErrorMessage(error),
          occurredAt: new Date().toISOString(),
          stage,
        },
      });
      throw error;
    }

    if (this.failedTask === task) {
      this.failedTask = null;
      this.updateSnapshot({ failure: null });
    }
  }

  private updateSnapshot(update: Partial<AppMutationQueueSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...update };
    for (const listener of this.listeners) listener();
  }
}
