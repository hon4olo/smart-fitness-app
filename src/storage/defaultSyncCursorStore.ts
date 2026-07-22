import { createAsyncStorageAdapter } from './AsyncStorageAdapter';
import { createSyncCursorStore, type SyncCursorStore } from './SyncCursorStore';

let defaultSyncCursorStore: SyncCursorStore | null = null;

export const getDefaultSyncCursorStore = (): SyncCursorStore => {
  if (!defaultSyncCursorStore) {
    defaultSyncCursorStore = createSyncCursorStore(createAsyncStorageAdapter());
  }

  return defaultSyncCursorStore;
};
