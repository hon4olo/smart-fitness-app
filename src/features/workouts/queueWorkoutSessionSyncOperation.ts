import { AUTH_SESSION_STORAGE_KEY } from '@/auth/createAuthService';
import { createWorkoutSessionQueueOperation, normalizeWorkoutSessionForSync } from '@/cloud/WorkoutSessionSync';
import {
  createAsyncStorageAdapter,
  createAsyncStorageOperationQueueStore,
  createWorkoutSessionSyncMetadataStore,
} from '@/storage';
import type { WorkoutSession } from '@/types';

type StoredAuthIdentity = {
  userId?: string;
  deviceId?: string;
};

const LOCAL_DEVICE_ID = '00000000-0000-4000-8000-000000000000';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const loadStoredAuthIdentity = async (): Promise<StoredAuthIdentity> => {
  const storage = createAsyncStorageAdapter();
  const raw = await storage.read(AUTH_SESSION_STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed) || !isRecord(parsed.user) || !isRecord(parsed.device)) {
      return {};
    }

    return {
      ...(typeof parsed.user.id === 'string' ? { userId: parsed.user.id } : {}),
      ...(typeof parsed.device.id === 'string' ? { deviceId: parsed.device.id } : {}),
    };
  } catch {
    return {};
  }
};

export const enqueueWorkoutSessionSyncOperation = async (
  action: 'create' | 'update' | 'delete',
  inputSession: WorkoutSession,
): Promise<WorkoutSession> => {
  const session = normalizeWorkoutSessionForSync(inputSession);
  const storage = createAsyncStorageAdapter();
  const queueStore = createAsyncStorageOperationQueueStore(storage);
  const metadataStore = createWorkoutSessionSyncMetadataStore(storage);
  const identity = await loadStoredAuthIdentity();
  const metadata = await metadataStore.get(session.id);

  await queueStore.enqueue(
    createWorkoutSessionQueueOperation({
      action,
      session,
      deviceId: identity.deviceId ?? LOCAL_DEVICE_ID,
      baseRevision: metadata?.revision ?? 0,
      actorId: identity.userId,
      previous: metadata,
    }),
  );

  return session;
};
