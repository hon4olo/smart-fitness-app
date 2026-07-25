export type CoachSourceRevision = {
  entityType: 'nutrition_target' | 'workout_session';
  entityId: string;
  revision: number;
};

export type CoachAppliedEntityRevision = {
  entityType: 'nutrition_target' | 'workout_template';
  entityId: string;
  revision: number;
};

export type CoachApplicationProvenance = {
  applicationKey: string;
  schemaVersion: 1;
  sourceFingerprint: string;
  sources: CoachSourceRevision[];
  appliedEntity: CoachAppliedEntityRevision;
};

const SOURCE_ENTITY_TYPES = new Set<CoachSourceRevision['entityType']>([
  'nutrition_target',
  'workout_session',
]);
const APPLIED_ENTITY_TYPES = new Set<CoachAppliedEntityRevision['entityType']>([
  'nutrition_target',
  'workout_template',
]);
const FINGERPRINT_PATTERN = /^sha256:[a-f0-9]{64}$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readBoundedString = (
  value: unknown,
  field: string,
  maximumLength = 200,
): string => {
  if (
    typeof value !== 'string' ||
    !value.trim() ||
    value.trim().length > maximumLength
  ) {
    throw new Error(`Invalid Coach application provenance: ${field}`);
  }
  return value.trim();
};

const readRevision = (value: unknown, field: string): number => {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(`Invalid Coach application provenance: ${field}`);
  }
  return value;
};

const parseSource = (value: unknown): CoachSourceRevision => {
  if (!isRecord(value) || !SOURCE_ENTITY_TYPES.has(value.entityType as CoachSourceRevision['entityType'])) {
    throw new Error('Invalid Coach application provenance: source entity type');
  }
  return {
    entityType: value.entityType as CoachSourceRevision['entityType'],
    entityId: readBoundedString(value.entityId, 'source entity id'),
    revision: readRevision(value.revision, 'source revision'),
  };
};

const parseAppliedEntity = (value: unknown): CoachAppliedEntityRevision => {
  if (
    !isRecord(value) ||
    !APPLIED_ENTITY_TYPES.has(
      value.entityType as CoachAppliedEntityRevision['entityType'],
    )
  ) {
    throw new Error('Invalid Coach application provenance: applied entity type');
  }
  return {
    entityType: value.entityType as CoachAppliedEntityRevision['entityType'],
    entityId: readBoundedString(value.entityId, 'applied entity id'),
    revision: readRevision(value.revision, 'applied revision'),
  };
};

const parseProvenance = (
  applicationKey: string,
  value: unknown,
): CoachApplicationProvenance => {
  if (!isRecord(value) || value.schemaVersion !== 1) {
    throw new Error('Invalid Coach application provenance: schema version');
  }
  if (
    typeof value.sourceFingerprint !== 'string' ||
    !FINGERPRINT_PATTERN.test(value.sourceFingerprint)
  ) {
    throw new Error('Invalid Coach application provenance: source fingerprint');
  }
  if (
    !Array.isArray(value.sources) ||
    value.sources.length < 1 ||
    value.sources.length > 20
  ) {
    throw new Error('Invalid Coach application provenance: sources');
  }
  const sources = value.sources.map(parseSource);
  const identities = new Set<string>();
  for (const source of sources) {
    const identity = `${source.entityType}:${source.entityId}`;
    if (identities.has(identity)) {
      throw new Error('Invalid Coach application provenance: duplicate source');
    }
    identities.add(identity);
  }
  return {
    applicationKey: readBoundedString(applicationKey, 'application key', 80),
    schemaVersion: 1,
    sourceFingerprint: value.sourceFingerprint,
    sources,
    appliedEntity: parseAppliedEntity(value.appliedEntity),
  };
};

export const parseCoachApplicationProvenance = (
  result: unknown,
): CoachApplicationProvenance[] => {
  if (result === null || result === undefined) return [];
  if (!isRecord(result)) {
    throw new Error('Invalid Coach application provenance result');
  }

  const parsed: CoachApplicationProvenance[] = [];
  if (result.provenance !== undefined) {
    parsed.push(parseProvenance('proposal', result.provenance));
  }

  if (result.applications !== undefined) {
    if (!isRecord(result.applications)) {
      throw new Error('Invalid Coach application provenance applications');
    }
    for (const [applicationKey, application] of Object.entries(
      result.applications,
    ).sort(([left], [right]) => left.localeCompare(right))) {
      if (!isRecord(application) || application.provenance === undefined) {
        continue;
      }
      parsed.push(parseProvenance(applicationKey, application.provenance));
    }
  }

  return parsed;
};
