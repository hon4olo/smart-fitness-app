import { describe, expect, it } from 'vitest';

import { parseCoachNutritionAppliedChanges } from './nutritionAppliedChangeSummary';

const summary = {
  schemaVersion: 1,
  kind: 'nutrition_targets',
  before: { calories: 2200, protein: 150, carbs: 250, fats: 65 },
  after: { calories: 2350, protein: 160, carbs: 270, fats: 70 },
  rationaleCodes: ['training_support', 'recovery_support'],
  policyReferences: ['nutrition-strategy-v2', 'nutrition-guardrail-v1'],
};

describe('Nutrition applied change summary parser', () => {
  it('returns no items when a run has no applied change summary', () => {
    expect(parseCoachNutritionAppliedChanges({ applied: false })).toEqual([]);
  });

  it('parses a standalone Nutrition confirmation summary', () => {
    expect(
      parseCoachNutritionAppliedChanges({
        applied: true,
        changeSummary: summary,
      }),
    ).toEqual([
      {
        applicationKey: 'proposal',
        summary,
      },
    ]);
  });

  it('parses a Combined Nutrition application summary', () => {
    expect(
      parseCoachNutritionAppliedChanges({
        applications: {
          effectiveStrength: { applied: true },
          nutrition: { applied: true, changeSummary: summary },
        },
      }),
    ).toEqual([
      {
        applicationKey: 'nutrition',
        summary,
      },
    ]);
  });

  it.each([
    { ...summary, schemaVersion: 2 },
    { ...summary, before: { ...summary.before, calories: 0 } },
    { ...summary, rationaleCodes: ['provider_free_text'] },
    { ...summary, rationaleCodes: [] },
    { ...summary, policyReferences: [] },
    { ...summary, policyReferences: ['x', 'x'] },
  ])('fails closed for malformed summaries', (malformed) => {
    expect(() =>
      parseCoachNutritionAppliedChanges({ changeSummary: malformed }),
    ).toThrow();
  });

  it('does not parse unrelated or raw result fields', () => {
    const parsed = parseCoachNutritionAppliedChanges({
      changeSummary: summary,
      contextSnapshot: { email: 'hidden@example.com' },
      providerOutput: 'raw model text',
    });

    expect(JSON.stringify(parsed)).not.toContain('hidden@example.com');
    expect(JSON.stringify(parsed)).not.toContain('raw model text');
  });
});
