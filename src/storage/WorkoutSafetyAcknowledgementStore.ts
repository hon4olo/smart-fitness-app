import { parseWorkoutSafetyMetadata } from '@/features/workouts/workoutSafetySessionMetadata';
import type { WorkoutSafetyMetadata } from '@/types';
import type { StorageAdapter } from './StorageAdapter';

export const WORKOUT_SAFETY_ACKNOWLEDGEMENT_STORAGE_KEY =
  '@smart_fitness_workout_safety_acknowledgement_v2';

export type WorkoutSafetyAcknowledgement = Omit<WorkoutSafetyMetadata, 'schemaVersion'> & {
  schemaVersion: 2;
  draftId: string;
};

export type WorkoutSafetyAcknowledgementStore = {
  get(draftId: string): Promise<WorkoutSafetyAcknowledgement | null>;
  set(record: WorkoutSafetyAcknowledgement): Promise<void>;
  clear(): Promise<void>;
};

const parseRecord = (value: unknown): WorkoutSafetyAcknowledgement | null => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (
    record.schemaVersion !== 2 ||
    typeof record.draftId !== 'string' ||
    !record.draftId.trim()
  ) {
    return null;
  }

  const metadata = parseWorkoutSafetyMetadata({
    ...record,
    schemaVersion: 1,
  });
  if (!metadata) return null;

  return {
    schemaVersion: 2,
    draftId: record.draftId,
    gateKind: metadata.gateKind,
    acknowledgedAt: metadata.acknowledgedAt,
    acknowledgementRequired: metadata.acknowledgementRequired,
    explicitlyAcknowledged: metadata.explicitlyAcknowledged,
    reviewRunId: metadata.reviewRunId,
    reviewStatus: metadata.reviewStatus,
    sourceFingerprint: metadata.sourceFingerprint,
    recommendedLoadMultiplier: metadata.recommendedLoadMultiplier,
    restrictions: metadata.restrictions,
    issues: metadata.issues,
  };
};

export const createWorkoutSafetyMetadataFromAcknowledgement = (
  record: WorkoutSafetyAcknowledgement,
): WorkoutSafetyMetadata | null =>
  parseWorkoutSafetyMetadata({
    ...record,
    schemaVersion: 1,
  });

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
