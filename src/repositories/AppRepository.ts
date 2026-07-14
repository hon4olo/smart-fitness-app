import type { AppState } from '@/types';

export type AppRepository = {
  loadState(): Promise<AppState | null>;
  saveState(state: AppState): Promise<void>;
  clearState(): Promise<void>;
};
