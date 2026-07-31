import {
  SOCIAL_REPORT_RECEIPT_SCHEMA_VERSION,
  type SocialReportReceiptDto,
} from './report-contracts';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasExactKeys = (
  value: Record<string, unknown>,
  expectedKeys: readonly string[],
): boolean => {
  const actualKeys = Object.keys(value);
  return (
    actualKeys.length === expectedKeys.length &&
    expectedKeys.every((key) => Object.prototype.hasOwnProperty.call(value, key))
  );
};

export const parseSocialReportReceiptDto = (
  value: unknown,
): SocialReportReceiptDto => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ['schemaVersion', 'received']) ||
    value.schemaVersion !== SOCIAL_REPORT_RECEIPT_SCHEMA_VERSION ||
    value.received !== true
  ) {
    throw new Error('Invalid social report receipt response');
  }

  return {
    schemaVersion: SOCIAL_REPORT_RECEIPT_SCHEMA_VERSION,
    received: true,
  };
};

export const parseSocialReportResponse = (
  value: unknown,
): SocialReportReceiptDto => {
  if (!isRecord(value) || !hasExactKeys(value, ['report'])) {
    throw new Error('Invalid social report response');
  }
  return parseSocialReportReceiptDto(value.report);
};
