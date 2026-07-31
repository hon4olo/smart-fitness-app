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

const invalidResponse = (): Error =>
  new Error('Invalid Social capabilities response');

export const parseSocialCapabilitiesResponse = (
  value: unknown,
): SocialCapabilitiesDto => {
  if (!isRecord(value)) throw invalidResponse();
  const root = value;
  if (!hasExactKeys(root, ['capabilities'])) throw invalidResponse();

  const capabilitiesValue = root.capabilities;
  if (!isRecord(capabilitiesValue)) throw invalidResponse();
  const capabilities = capabilitiesValue;
  if (!hasExactKeys(capabilities, ['schemaVersion', 'textModeration'])) {
    throw invalidResponse();
  }
  if (capabilities.schemaVersion !== SOCIAL_CAPABILITIES_SCHEMA_VERSION) {
    throw invalidResponse();
  }

  const textModerationValue = capabilities.textModeration;
  if (!isRecord(textModerationValue)) throw invalidResponse();
  const textModeration = textModerationValue;
  if (
    !hasExactKeys(textModeration, [
      'schemaVersion',
      'enforcementRequired',
      'reviewRequiredBehavior',
    ])
  ) {
    throw invalidResponse();
  }
  if (
    textModeration.schemaVersion !==
      SOCIAL_TEXT_MODERATION_CAPABILITY_SCHEMA_VERSION ||
    typeof textModeration.enforcementRequired !== 'boolean' ||
    textModeration.reviewRequiredBehavior !== 'not_public'
  ) {
    throw invalidResponse();
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
