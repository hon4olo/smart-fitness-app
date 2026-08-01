import type { AppState } from '@/types';

export type AppPersistenceMeasurement = {
  durationMs: number;
  hasOutbox: boolean;
  label: string;
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
  const serializedCharacters = JSON.stringify(input.nextState).length;

  try {
    await input.save();
    appendMeasurement({
      durationMs: Date.now() - startedAt,
      hasOutbox: input.hasOutbox,
      label: input.label,
      outcome: 'success',
      recordedAt: new Date().toISOString(),
      serializedCharacters,
    });
  } catch (error) {
    appendMeasurement({
      durationMs: Date.now() - startedAt,
      hasOutbox: input.hasOutbox,
      label: input.label,
      outcome: 'failure',
      recordedAt: new Date().toISOString(),
      serializedCharacters,
    });
    throw error;
  }
}
