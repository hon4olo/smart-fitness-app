export const SOCIAL_REPORT_RECEIPT_SCHEMA_VERSION = 1 as const;

export const SOCIAL_REPORT_REASON_CODES = [
  'spam',
  'harassment',
  'hate_speech',
  'violence',
  'sexual_content',
  'self_harm',
  'privacy',
  'impersonation',
  'other',
] as const;

export type SocialReportReasonCode =
  (typeof SOCIAL_REPORT_REASON_CODES)[number];

export type CreateSocialReportInput = {
  reason: SocialReportReasonCode;
};

export type SocialReportReceiptDto = {
  schemaVersion: typeof SOCIAL_REPORT_RECEIPT_SCHEMA_VERSION;
  received: true;
};
