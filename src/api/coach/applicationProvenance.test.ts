import { describe, expect, it } from 'vitest';

import { parseCoachApplicationProvenance } from './applicationProvenance';

const targetId = '11111111-1111-4111-8111-111111111111';
const validProvenance = {
  schemaVersion: 1,
  sourceFingerprint: `sha256:${'a'.repeat(64)}`,
  sources: [
    {
      entityType: 'nutrition_target',
      entityId: targetId,
      revision: 4,
    },
  ],
  appliedEntity: {
    entityType: 'nutrition_target',
    entityId: targetId,
    revision: 12,
  },
};

describe('Coach application provenance parser', () => {
  it('parses bounded Combined application provenance', () => {
    expect(
      parseCoachApplicationProvenance({
        applications: {
          effectiveStrength: { applied: true },
          nutrition: { applied: true, provenance: validProvenance },
        },
      }),
    ).toEqual([
      {
        applicationKey: 'nutrition',
        ...validProvenance,
      },
    ]);
  });

  it('keeps legacy run records without provenance compatible', () => {
    expect(
      parseCoachApplicationProvenance({
        applications: { nutrition: { applied: true, targetId } },
      }),
    ).toEqual([]);
  });

  it('fails closed for unsupported schemas and malformed fingerprints', () => {
    expect(() =>
      parseCoachApplicationProvenance({
        applications: {
          nutrition: {
            provenance: { ...validProvenance, schemaVersion: 2 },
          },
        },
      }),
    ).toThrow('schema version');
    expect(() =>
      parseCoachApplicationProvenance({
        applications: {
          nutrition: {
            provenance: { ...validProvenance, sourceFingerprint: 'raw-hash' },
          },
        },
      }),
    ).toThrow('source fingerprint');
  });

  it('fails closed for duplicate source identities or unsafe revisions', () => {
    expect(() =>
      parseCoachApplicationProvenance({
        applications: {
          nutrition: {
            provenance: {
              ...validProvenance,
              sources: [
                validProvenance.sources[0],
                { ...validProvenance.sources[0], revision: 5 },
              ],
            },
          },
        },
      }),
    ).toThrow('duplicate source');
    expect(() =>
      parseCoachApplicationProvenance({
        applications: {
          nutrition: {
            provenance: {
              ...validProvenance,
              appliedEntity: {
                ...validProvenance.appliedEntity,
                revision: -1,
              },
            },
          },
        },
      }),
    ).toThrow('applied revision');
  });
});
