import type { AppState } from '@/types';

export type AppPersistenceMeasurement = {
  durationMs: number;
  hasOutbox: boolean;
  label: string;
  operation: 'restore' | 'save';
  outcome: 'failure' | 'success';
  recordedAt: string;
  serializedCharacters: number;
};

const MAX_MEASUREMENTS = 200;
const measurements: AppPersistenceMeasurement[] = [];
let measurementEnabled = process.env.NODE_ENV !== 'production';

export const setAppPersistenceMeasurementEnabled = (enabled: boolean): void => {
  measurementEnabled = enabled;
};

export const clearAppPersistenceMeasurements = (): void => {
  measurements.length = 0;
};

export const getAppPersistenceMeasurements = (): AppPersistenceMeasurement[] =>
  measurements.map((measurement) => ({ ...measurement }));

const appendMeasurement = (measurement: AppPersistenceMeasurement): void => {
  measurements.push(measurement);
  if (measurements.length > MAX_MEASUREMENTS) {
    measurements.splice(0, measurements.length - MAX_MEASUREMENTS);
  }
};

const getSerializedCharacters = (state: AppState | null): number =>
  state === null ? 0 : JSON.stringify(state).length;

export async function measureAppStateRestore(input: {
  load(): Promise<AppState | null>;
}): Promise<AppState | null> {
  if (!measurementEnabled) return input.load();

  const startedAt = Date.now();
  try {
    const state = await input.load();
    appendMeasurement({
      durationMs: Date.now() - startedAt,
      hasOutbox: false,
      label: 'Restore app state',
      operation: 'restore',
      outcome: 'success',
      recordedAt: new Date().toISOString(),
      serializedCharacters: getSerializedCharacters(state),
    });
    return state;
  } catch (error) {
    appendMeasurement({
      durationMs: Date.now() - startedAt,
      hasOutbox: false,
      label: 'Restore app state',
      operation: 'restore',
      outcome: 'failure',
      recordedAt: new Date().toISOString(),
      serializedCharacters: 0,
    });
    throw error;
  }
}

export async function measureAppStatePersistence(input: {
  hasOutbox: boolean;
  label: string;
  nextState: AppState;
  save(): Promise<void>;
}): Promise<void> {
  if (!measurementEnabled) {
    await input.save();
    return;
  }

  const startedAt = Date.now();
  const serializedCharacters = getSerializedCharacters(input.nextState);

  try {
    await input.save();
    appendMeasurement({
      durationMs: Date.now() - startedAt,
      hasOutbox: input.hasOutbox,
      label: input.label,
      operation: 'save',
      outcome: 'success',
      recordedAt: new Date().toISOString(),
      serializedCharacters,
    });
  } catch (error) {
    appendMeasurement({
      durationMs: Date.now() - startedAt,
      hasOutbox: input.hasOutbox,
      label: input.label,
      operation: 'save',
      outcome: 'failure',
      recordedAt: new Date().toISOString(),
      serializedCharacters,
    });
    throw error;
  }
}
