import { describe, expect, it } from 'vitest';

import {
  parseSocialReportReceiptDto,
  parseSocialReportResponse,
} from './report-parsers';

const receipt = {
  schemaVersion: 1,
  received: true,
} as const;

describe('social report parsers', () => {
  it('accepts the exact versioned receipt response', () => {
    expect(parseSocialReportReceiptDto(receipt)).toEqual(receipt);
    expect(parseSocialReportResponse({ report: receipt })).toEqual(receipt);
  });

  it.each([
    null,
    {},
    { schemaVersion: 2, received: true },
    { schemaVersion: 1, received: false },
    { schemaVersion: 1, received: true, id: 'private-report-id' },
  ])('rejects malformed or expanded receipts', (value) => {
    expect(() => parseSocialReportReceiptDto(value)).toThrow(
      'Invalid social report receipt response',
    );
  });

  it.each([
    null,
    {},
    { report: receipt, id: 'private-report-id' },
    { report: { ...receipt, targetUserId: 'private-target-id' } },
  ])('rejects malformed or expanded response envelopes', (value) => {
    expect(() => parseSocialReportResponse(value)).toThrow();
  });
});
