import {
  parseSafetyRecoveryReviewSnapshot,
  type SafetyRecoveryReviewSnapshot,
} from '@/features/coach/safetyRecoveryReviewSnapshot';
import type { StorageAdapter } from './StorageAdapter';

export const SAFETY_RECOVERY_REVIEW_STORAGE_KEY =
  '@smart_fitness_safety_recovery_review_snapshot_v1';

type StoredEnvelope = {
  version: 1;
  records: SafetyRecoveryReviewSnapshot[];
  updatedAt: string;
};

export type SafetyRecoveryReviewStore = {
  get(userId: string): Promise<SafetyRecoveryReviewSnapshot | null>;
  set(snapshot: SafetyRecoveryReviewSnapshot): Promise<void>;
  remove(userId: string): Promise<void>;
  clear(): Promise<void>;
};

const parseEnvelope = async (
  storage: StorageAdapter,
): Promise<Map<string, SafetyRecoveryReviewSnapshot>> => {
  const raw = await storage.read(SAFETY_RECOVERY_REVIEW_STORAGE_KEY);
  if (!raw) return new Map();

  try {
    const parsed = JSON.parse(raw) as unknown;
    const source =
      typeof parsed === 'object' &&
      parsed !== null &&
      !Array.isArray(parsed) &&
      Array.isArray((parsed as { records?: unknown }).records)
        ? ((parsed as { records: unknown[] }).records as unknown[])
        : [];
    const snapshots = source
      .map(parseSafetyRecoveryReviewSnapshot)
      .filter((snapshot): snapshot is SafetyRecoveryReviewSnapshot => Boolean(snapshot));
    return new Map(snapshots.map((snapshot) => [snapshot.userId, snapshot]));
  } catch {
    return new Map();
  }
};

const serialize = (records: Map<string, SafetyRecoveryReviewSnapshot>): string =>
  JSON.stringify({
    version: 1,
    records: [...records.values()],
    updatedAt: new Date().toISOString(),
  } satisfies StoredEnvelope);

export const createSafetyRecoveryReviewStore = (
  storage: StorageAdapter,
): SafetyRecoveryReviewStore => ({
  async get(userId) {
    if (!userId.trim()) return null;
    return (await parseEnvelope(storage)).get(userId) ?? null;
  },
  async set(snapshot) {
    const normalized = parseSafetyRecoveryReviewSnapshot(snapshot);
    if (!normalized) {
      throw new Error('Invalid Safety Recovery review snapshot');
    }
    const records = await parseEnvelope(storage);
    records.set(normalized.userId, normalized);
    await storage.write(SAFETY_RECOVERY_REVIEW_STORAGE_KEY, serialize(records));
  },
  async remove(userId) {
    const records = await parseEnvelope(storage);
    records.delete(userId);
    if (records.size === 0) {
      await storage.remove(SAFETY_RECOVERY_REVIEW_STORAGE_KEY);
      return;
    }
    await storage.write(SAFETY_RECOVERY_REVIEW_STORAGE_KEY, serialize(records));
  },
  async clear() {
    await storage.remove(SAFETY_RECOVERY_REVIEW_STORAGE_KEY);
  },
});
