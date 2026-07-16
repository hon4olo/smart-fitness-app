import { describe, expect, it } from 'vitest';

import { getTabAccessibilityState, TAB_DEFINITIONS } from '@/components/ui/tab-definitions';
import { resolveButtonState } from '@/components/ui/button-state';
import { getProfileSectionDescriptors, PROFILE_SECTION_ORDER } from '@/components/profile/profile-sections';

describe('consumer design foundation', () => {
  it('uses the approved bottom tab labels', () => {
    expect(TAB_DEFINITIONS.map((tab) => tab.label)).toEqual(['Home', 'Workouts', 'Nutrition', 'Progress', 'Profile']);
  });

  it('marks tab selection state deterministically', () => {
    expect(getTabAccessibilityState(true)).toEqual({ selected: true });
    expect(getTabAccessibilityState(false)).toEqual({ selected: false });
  });

  it('keeps profile section order stable', () => {
    expect(PROFILE_SECTION_ORDER).toEqual(['account', 'goals', 'sync', 'preferences', 'developer']);
  });

  it('keeps developer settings collapsed by default and exposes them when expanded', () => {
    const collapsed = getProfileSectionDescriptors(
      {
        account: { title: 'Account', subtitle: undefined, content: null },
        goals: { title: 'Goals', subtitle: undefined, content: null },
        sync: { title: 'Sync & Backup', subtitle: undefined, content: null },
        preferences: { title: 'Preferences', subtitle: undefined, content: null },
        developer: { title: 'Developer Settings', subtitle: undefined, content: 'tools' },
      },
      { developerExpanded: false }
    );

    const expanded = getProfileSectionDescriptors(
      {
        account: { title: 'Account', subtitle: undefined, content: null },
        goals: { title: 'Goals', subtitle: undefined, content: null },
        sync: { title: 'Sync & Backup', subtitle: undefined, content: null },
        preferences: { title: 'Preferences', subtitle: undefined, content: null },
        developer: { title: 'Developer Settings', subtitle: undefined, content: 'tools' },
      },
      { developerExpanded: true }
    );

    const collapsedDeveloper = collapsed[collapsed.length - 1];
    const expandedDeveloper = expanded[expanded.length - 1];

    expect(collapsedDeveloper?.collapsed).toBe(true);
    expect(expandedDeveloper?.collapsed).toBe(false);
    expect(expandedDeveloper?.content).toBe('tools');
  });

  it('resolves button loading and disabled state consistently', () => {
    expect(resolveButtonState({ loading: true })).toEqual({
      disabled: true,
      loading: true,
      accessibilityState: { busy: true, disabled: true },
    });

    expect(resolveButtonState({ disabled: true })).toEqual({
      disabled: true,
      loading: false,
      accessibilityState: { disabled: true, busy: undefined },
    });
  });
});
