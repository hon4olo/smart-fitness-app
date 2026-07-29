import { describe, expect, it } from 'vitest';

import { parseCoachAppliedChanges } from './appliedChangeSummary';

const nutrition = {
  schemaVersion: 1,
  kind: 'nutrition_targets',
  before: { calories: 2200, protein: 150, carbs: 250, fats: 65 },
  after: { calories: 2350, protein: 160, carbs: 270, fats: 70 },
  rationaleCodes: ['training_support', 'recovery_support'],
  policyReferences: ['nutrition-strategy-v2', 'nutrition-guardrail-v1'],
};

const strength = {
  schemaVersion: 1,
  kind: 'strength_template',
  strategy: 'maintain',
  sourceSessionRevision: 7,
  sets: [
    {
      exerciseName: 'Bench Press',
      before: { weight: 80, reps: 8, actualRpe: 9 },
      after: { weight: 80, reps: 8, targetRpe: 8.5 },
      adjustment: 'maintain',
      rationaleCode: 'high_recorded_rpe',
    },
  ],
  rationaleCodes: ['rpe_guided_progression'],
  caveatCodes: ['requires_confirmation'],
  policyReferences: ['strength-strategy-v1', 'strength-strategy-guardrail-v1'],
};

const combinedStrength = {
  schemaVersion: 1,
  kind: 'combined_strength_template',
  sourceSessionRevision: 7,
  status: 'modify',
  loadMultiplier: 0.8,
  sets: [
    {
      exerciseName: 'Bench Press',
      before: { weight: 80, reps: 8, actualRpe: 7.5 },
      after: {
        proposedWeight: 85,
        maximumAllowedWeight: 64,
        effectiveWeight: 64,
        reps: 8,
        targetRpe: 8,
      },
      safetyAdjusted: true,
      rationaleCode: 'safety_load_ceiling_applied',
    },
  ],
  policyReferences: [
    'combined-coach-proposal-v3',
    'combined-effective-strength-v1',
  ],
};

describe('Coach applied change parser', () => {
  it('parses standalone Nutrition and Strength summaries', () => {
    expect(parseCoachAppliedChanges({ changeSummary: nutrition })).toEqual([
      { applicationKey: 'proposal', summary: nutrition },
    ]);
    expect(parseCoachAppliedChanges({ changeSummary: strength })).toEqual([
      { applicationKey: 'proposal', summary: strength },
    ]);
  });

  it('parses Combined Nutrition and effective Strength applications in stable order', () => {
    expect(
      parseCoachAppliedChanges({
        applications: {
          nutrition: { applied: true, changeSummary: nutrition },
          effectiveStrength: { applied: true, changeSummary: combinedStrength },
        },
      }),
    ).toEqual([
      { applicationKey: 'effectiveStrength', summary: combinedStrength },
      { applicationKey: 'nutrition', summary: nutrition },
    ]);
  });

  it.each([
    { ...nutrition, schemaVersion: 2 },
    { ...nutrition, before: { ...nutrition.before, calories: 0 } },
    { ...nutrition, rationaleCodes: ['provider_free_text'] },
    { ...strength, strategy: 'unsafe' },
    { ...strength, sets: [{ ...strength.sets[0], adjustment: 'unknown' }] },
    { ...strength, sets: [{ ...strength.sets[0], rationaleCode: 'provider_text' }] },
    { ...combinedStrength, loadMultiplier: 1.2 },
    {
      ...combinedStrength,
      sets: [{ ...combinedStrength.sets[0], safetyAdjusted: 'yes' }],
    },
    {
      ...combinedStrength,
      policyReferences: ['only-one'],
    },
  ])('fails closed for malformed summaries', (summary) => {
    expect(() => parseCoachAppliedChanges({ changeSummary: summary })).toThrow();
  });

  it('does not retain unrelated raw result fields', () => {
    const parsed = parseCoachAppliedChanges({
      changeSummary: combinedStrength,
      contextSnapshot: { email: 'hidden@example.com' },
      providerOutput: 'raw model text',
      sourceSessionId: 'secret-id',
    });
    const serialized = JSON.stringify(parsed);
    expect(serialized).not.toContain('hidden@example.com');
    expect(serialized).not.toContain('raw model text');
    expect(serialized).not.toContain('secret-id');
  });
});
