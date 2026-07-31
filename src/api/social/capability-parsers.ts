import {
  SOCIAL_CAPABILITIES_SCHEMA_VERSION,
  SOCIAL_TEXT_MODERATION_CAPABILITY_SCHEMA_VERSION,
  type SocialCapabilitiesDto,
} from './capability-contracts';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasExactKeys = (
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean => {
  const keys = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  return (
    keys.length === sortedExpected.length &&
    keys.every((key, index) => key === sortedExpected[index])
  );
};

const fail = (): never => {
  throw new Error('Invalid Social capabilities response');
};

export const parseSocialCapabilitiesResponse = (
  value: unknown,
): SocialCapabilitiesDto => {
  if (!isRecord(value) || !hasExactKeys(value, ['capabilities'])) fail();
  const capabilities = value.capabilities;
  if (
    !isRecord(capabilities) ||
    !hasExactKeys(capabilities, ['schemaVersion', 'textModeration']) ||
    capabilities.schemaVersion !== SOCIAL_CAPABILITIES_SCHEMA_VERSION
  ) {
    fail();
  }

  const textModeration = capabilities.textModeration;
  if (
    !isRecord(textModeration) ||
    !hasExactKeys(textModeration, [
      'schemaVersion',
      'enforcementRequired',
      'reviewRequiredBehavior',
    ]) ||
    textModeration.schemaVersion !==
      SOCIAL_TEXT_MODERATION_CAPABILITY_SCHEMA_VERSION ||
    typeof textModeration.enforcementRequired !== 'boolean' ||
    textModeration.reviewRequiredBehavior !== 'not_public'
  ) {
    fail();
  }

  return {
    schemaVersion: SOCIAL_CAPABILITIES_SCHEMA_VERSION,
    textModeration: {
      schemaVersion: SOCIAL_TEXT_MODERATION_CAPABILITY_SCHEMA_VERSION,
      enforcementRequired: textModeration.enforcementRequired,
      reviewRequiredBehavior: 'not_public',
    },
  };
};
