import type {
  CoachRunTrustState,
  CoachTrustApplication,
  CoachTrustApplicationKey,
  CoachTrustApplicationState,
  CoachTrustSourceEntityType,
} from './contracts';

const APPLICATION_KEYS = new Set<CoachTrustApplicationKey>([
  'proposal',
  'nutrition',
  'effectiveStrength',
]);
const APPLICATION_STATES = new Set<CoachTrustApplicationState>([
  'current',
  'stale',
  'unavailable',
  'applied',
]);
const SOURCE_ENTITY_TYPES = new Set<CoachTrustSourceEntityType>([
  'nutrition_target',
  'workout_session',
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readNullableRevision = (value: unknown, field: string): number | null => {
  if (value === null) return null;
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(`Invalid Coach trust response: ${field}`);
  }
  return value;
};

const parseApplication = (value: unknown): CoachTrustApplication => {
  if (
    !isRecord(value) ||
    !APPLICATION_KEYS.has(value.key as CoachTrustApplicationKey) ||
    !APPLICATION_STATES.has(value.state as CoachTrustApplicationState) ||
    !SOURCE_ENTITY_TYPES.has(
      value.sourceEntityType as CoachTrustSourceEntityType,
    )
  ) {
    throw new Error('Invalid Coach trust response: application');
  }
  const proposalRevision = readNullableRevision(
    value.proposalRevision,
    'proposalRevision',
  );
  const currentRevision = readNullableRevision(
    value.currentRevision,
    'currentRevision',
  );
  const state = value.state as CoachTrustApplicationState;
  if (
    ((state === 'current' || state === 'stale') && currentRevision === null) ||
    ((state === 'applied' || state === 'unavailable') &&
      currentRevision !== null)
  ) {
    throw new Error('Invalid Coach trust response: revision state');
  }
  return {
    key: value.key as CoachTrustApplicationKey,
    state,
    sourceEntityType: value.sourceEntityType as CoachTrustSourceEntityType,
    proposalRevision,
    currentRevision,
  };
};

const deriveOverallState = (
  applications: CoachTrustApplication[],
): CoachRunTrustState['overallState'] => {
  if (applications.length === 0) return 'not_applicable';
  if (applications.some((item) => item.state === 'stale')) return 'stale';
  if (applications.some((item) => item.state === 'unavailable')) {
    return 'unavailable';
  }
  if (applications.some((item) => item.state === 'current')) return 'current';
  return 'applied';
};

export const parseCoachRunTrustState = (value: unknown): CoachRunTrustState => {
  if (
    !isRecord(value) ||
    value.schemaVersion !== 1 ||
    !Array.isArray(value.applications) ||
    value.applications.length > 3
  ) {
    throw new Error('Invalid Coach trust response');
  }
  const applications = value.applications.map(parseApplication);
  const keys = new Set(applications.map((item) => item.key));
  if (keys.size !== applications.length) {
    throw new Error('Invalid Coach trust response: duplicate application');
  }
  const overallState = deriveOverallState(applications);
  if (value.overallState !== overallState) {
    throw new Error('Invalid Coach trust response: overallState');
  }
  return { schemaVersion: 1, overallState, applications };
};
