export const SOCIAL_CAPABILITIES_SCHEMA_VERSION = 1 as const;
export const SOCIAL_TEXT_MODERATION_CAPABILITY_SCHEMA_VERSION = 1 as const;

export type SocialTextModerationCapability = {
  schemaVersion: typeof SOCIAL_TEXT_MODERATION_CAPABILITY_SCHEMA_VERSION;
  enforcementRequired: boolean;
  reviewRequiredBehavior: 'not_public';
};

export type SocialCapabilitiesDto = {
  schemaVersion: typeof SOCIAL_CAPABILITIES_SCHEMA_VERSION;
  textModeration: SocialTextModerationCapability;
};
