import type { SafetyRecoveryStatus } from '@/features/coach/safetyRecoveryViewModel';
import type { StorageAdapter } from './StorageAdapter';

export const WORKOUT_SAFETY_ACKNOWLEDGEMENT_STORAGE_KEY =
  '@smart_fitness_workout_safety_acknowledgement_v1';

export type WorkoutSafetyAcknowledgement = {
  schemaVersion: 1;
  draftId: string;
  acknowledgedAt: string;
  reviewRunId: string | null;
  sourceFingerprint: string | null;
  reviewStatus: SafetyRecoveryStatus | null;
};

export type WorkoutSafetyAcknowledgementStore = {
  get(draftId: string): Promise<WorkoutSafetyAcknowledgement | null>;
  set(record: WorkoutSafetyAcknowledgement): Promise<void>;
  clear(): Promise<void>;
};

const STATUSES = new Set<SafetyRecoveryStatus>([
  'ready',
  'needs_input',
  'modify',
  'blocked',
]);

const parseRecord = (value: unknown): WorkoutSafetyAcknowledgement | null => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (
    record.schemaVersion !== 1 ||
    typeof record.draftId !== 'string' ||
    !record.draftId.trim() ||
    typeof record.acknowledgedAt !== 'string' ||
    !Number.isFinite(Date.parse(record.acknowledgedAt)) ||
    (record.reviewRunId !== null && typeof record.reviewRunId !== 'string') ||
    (record.sourceFingerprint !== null && typeof record.sourceFingerprint !== 'string') ||
    (record.reviewStatus !== null &&
      (typeof record.reviewStatus !== 'string' ||
        !STATUSES.has(record.reviewStatus as SafetyRecoveryStatus)))
  ) {
    return null;
  }

  return {
    schemaVersion: 1,
    draftId: record.draftId,
    acknowledgedAt: new Date(record.acknowledgedAt).toISOString(),
    reviewRunId: record.reviewRunId as string | null,
    sourceFingerprint: record.sourceFingerprint as string | null,
    reviewStatus: record.reviewStatus as SafetyRecoveryStatus | null,
  };
};

export const createWorkoutSafetyAcknowledgementStore = (
  storage: StorageAdapter,
): WorkoutSafetyAcknowledgementStore => ({
  async get(draftId) {
    const raw = await storage.read(WORKOUT_SAFETY_ACKNOWLEDGEMENT_STORAGE_KEY);
    if (!raw) return null;
    try {
      const parsed = parseRecord(JSON.parse(raw));
      return parsed?.draftId === draftId ? parsed : null;
    } catch {
      return null;
    }
  },
  async set(record) {
    const normalized = parseRecord(record);
    if (!normalized) throw new Error('Invalid workout safety acknowledgement');
    await storage.write(
      WORKOUT_SAFETY_ACKNOWLEDGEMENT_STORAGE_KEY,
      JSON.stringify(normalized),
    );
  },
  async clear() {
    await storage.remove(WORKOUT_SAFETY_ACKNOWLEDGEMENT_STORAGE_KEY);
  },
});
