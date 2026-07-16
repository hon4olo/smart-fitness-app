import type { ReactNode } from 'react';

export type ProfileSectionKey = 'account' | 'goals' | 'sync' | 'preferences' | 'developer';

export type ProfileSectionDescriptor = {
  collapsed?: boolean;
  content: ReactNode;
  key: ProfileSectionKey;
  subtitle?: string;
  title: string;
};

export const PROFILE_SECTION_ORDER: ProfileSectionKey[] = ['account', 'goals', 'preferences', 'sync', 'developer'];

export const getProfileSectionDescriptors = (
  sections: Record<ProfileSectionKey, Omit<ProfileSectionDescriptor, 'key'>>,
  options: { developerExpanded?: boolean } = {}
): ProfileSectionDescriptor[] =>
  PROFILE_SECTION_ORDER.map((key) => ({
    key,
    collapsed: key === 'developer' ? !options.developerExpanded : false,
    ...sections[key],
  }));
