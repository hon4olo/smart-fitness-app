import { describe, expect, it } from 'vitest';

import { createUuid, ensureUuid, isUuid } from './ids';

describe('entity UUID helpers', () => {
  it('creates valid UUID values', () => {
    expect(isUuid(createUuid())).toBe(true);
  });

  it('preserves valid IDs and replaces legacy IDs', () => {
    const existing = '33333333-3333-4333-8333-333333333333';

    expect(ensureUuid(existing)).toBe(existing);
    expect(isUuid(ensureUuid('1721640000000'))).toBe(true);
  });
});
