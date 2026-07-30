import { describe, expect, it } from 'vitest';

import { parseCoachRunInputSummary } from './inputSummary';

describe('Coach input summary parser', () => {
  it('parses bounded Nutrition, Strength, and Safety coverage', () => {
    expect(
      parseCoachRunInputSummary({
        schemaVersion: 1,
        sources: [
          {
            domain: 'strength',
            available: true,
            requestedSpecificSession: true,
            requestedHistoryLimit: 8,
            sessionCount: 4,
            completedSetCount: 20,
            distinctExerciseCount: 6,
            setsWithActualRpeCount: 12,
            hasLatestWeight: true,
          },
          {
            domain: 'nutrition',
            available: true,
            lookbackDays: 14,
            foodEntryCount: 42,
            loggedDayCount: 12,
            weightEntryCount: 3,
            hasLatestWeight: true,
            hasActiveTarget: true,
            hasFitnessProfile: true,
          },
          {
            domain: 'safety_recovery',
            available: true,
            lookbackDays: 7,
            activeLimitationCount: 2,
            pauseTrainingCount: 0,
            avoidMovementCount: 1,
            reduceLoadCount: 1,
            recoveryCheckInCount: 4,
            limitationNotesPresentCount: 1,
            checkInNotesPresentCount: 2,
          },
        ],
      }),
    ).toEqual({
      schemaVersion: 1,
      sources: [
        {
          domain: 'strength',
          available: true,
          requestedSpecificSession: true,
          requestedHistoryLimit: 8,
          sessionCount: 4,
          completedSetCount: 20,
          distinctExerciseCount: 6,
          setsWithActualRpeCount: 12,
          hasLatestWeight: true,
        },
        {
          domain: 'nutrition',
          available: true,
          lookbackDays: 14,
          foodEntryCount: 42,
          loggedDayCount: 12,
          weightEntryCount: 3,
          hasLatestWeight: true,
          hasActiveTarget: true,
          hasFitnessProfile: true,
        },
        {
          domain: 'safety_recovery',
          available: true,
          lookbackDays: 7,
          activeLimitationCount: 2,
          pauseTrainingCount: 0,
          avoidMovementCount: 1,
          reduceLoadCount: 1,
          recoveryCheckInCount: 4,
          limitationNotesPresentCount: 1,
          checkInNotesPresentCount: 2,
        },
      ],
    });
  });

  it('supports unavailable legacy coverage with bounded zero counts', () => {
    expect(
      parseCoachRunInputSummary({
        schemaVersion: 1,
        sources: [
          {
            domain: 'nutrition',
            available: false,
            lookbackDays: null,
            foodEntryCount: 0,
            loggedDayCount: 0,
            weightEntryCount: 0,
            hasLatestWeight: false,
            hasActiveTarget: false,
            hasFitnessProfile: false,
          },
        ],
      }),
    ).toMatchObject({ sources: [{ domain: 'nutrition', available: false }] });
  });

  it('rejects duplicate domains, unsupported schemas, unsafe counts, and raw fields', () => {
    const nutrition = {
      domain: 'nutrition',
      available: true,
      lookbackDays: 14,
      foodEntryCount: 1,
      loggedDayCount: 1,
      weightEntryCount: 1,
      hasLatestWeight: true,
      hasActiveTarget: true,
      hasFitnessProfile: true,
    };
    expect(() =>
      parseCoachRunInputSummary({
        schemaVersion: 1,
        sources: [nutrition, nutrition],
      }),
    ).toThrow('duplicate');
    expect(() =>
      parseCoachRunInputSummary({ schemaVersion: 2, sources: [] }),
    ).toThrow('Invalid Coach input summary');
    expect(() =>
      parseCoachRunInputSummary({
        schemaVersion: 1,
        sources: [{ ...nutrition, foodEntryCount: -1 }],
      }),
    ).toThrow('foodEntryCount');
    expect(() =>
      parseCoachRunInputSummary({
        schemaVersion: 1,
        sources: [{ ...nutrition, contextSnapshot: { private: true } }],
      }),
    ).toThrow('fields');
  });
});
