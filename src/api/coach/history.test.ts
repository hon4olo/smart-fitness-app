import { describe, expect, it } from 'vitest';

import { parseCoachRunHistory } from './history';

const run = {
  id: '11111111-1111-4111-8111-111111111111',
  domain: 'combined',
  requestType: 'combined_proposal_review',
  status: 'completed',
  policyVersions: { safety: 'v3', nutrition: 'v4' },
  requestedAt: '2026-07-25T10:00:00.000Z',
  startedAt: '2026-07-25T10:00:01.000Z',
  completedAt: '2026-07-25T10:00:02.000Z',
  updatedAt: '2026-07-25T10:00:02.000Z',
};

describe('Coach run history parser', () => {
  it('parses immutable history summaries and policy versions', () => {
    expect(parseCoachRunHistory([run])).toEqual([run]);
  });

  it('fails closed for unsupported status, domain, and malformed dates', () => {
    expect(() => parseCoachRunHistory([{ ...run, status: 'deleted' }])).toThrow();
    expect(() => parseCoachRunHistory([{ ...run, domain: 'medical' }])).toThrow();
    expect(() => parseCoachRunHistory([{ ...run, requestedAt: 'not-a-date' }])).toThrow();
  });

  it('drops non-string policy values instead of exposing arbitrary payloads', () => {
    expect(
      parseCoachRunHistory([{ ...run, policyVersions: { safety: 'v3', raw: { value: 1 } } }])[0]
        .policyVersions,
    ).toEqual({ safety: 'v3' });
  });
});
