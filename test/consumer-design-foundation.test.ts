import { describe, expect, it } from 'vitest';

import { APPEARANCE_LABELS, APPEARANCE_MODES, Colors, Theme, resolveAppearance } from '@/constants/theme-data';
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

  it('exposes the approved appearance modes', () => {
    expect(APPEARANCE_MODES.map((mode) => mode.label)).toEqual(['System', 'Light', 'Dark']);
    expect(APPEARANCE_LABELS.system).toBe('System');
    expect(APPEARANCE_LABELS.light).toBe('Light');
    expect(APPEARANCE_LABELS.dark).toBe('Dark');
  });

  it('provides semantic color tokens in both palettes', () => {
    const requiredTokens: Array<keyof typeof Colors.light> = [
      'background',
      'backgroundSecondary',
      'surfacePrimary',
      'surfaceSecondary',
      'surfaceElevated',
      'surfaceAccent',
      'textPrimary',
      'textSecondary',
      'textMuted',
      'textOnAccent',
      'divider',
      'borderSubtle',
      'accent',
      'accentPressed',
      'accentSoft',
      'success',
      'successSoft',
      'warning',
      'warningSoft',
      'error',
      'errorSoft',
      'chartPrimary',
      'chartSecondary',
      'overlay',
      'shadow',
    ];

    requiredTokens.forEach((token) => {
      expect(Colors.light[token]).toBeDefined();
      expect(Colors.dark[token]).toBeDefined();
    });
  });

  it('resolves appearance mode with system support', () => {
    expect(resolveAppearance('system', 'light')).toBe('light');
    expect(resolveAppearance('system', 'dark')).toBe('dark');
    expect(resolveAppearance('light', 'dark')).toBe('light');
    expect(resolveAppearance('dark', 'light')).toBe('dark');
  });

  it('keeps profile section order stable', () => {
    expect(PROFILE_SECTION_ORDER).toEqual(['account', 'goals', 'preferences', 'sync', 'developer']);
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

  it('exposes layout metrics for the redesigned system', () => {
    expect(Theme.layout.screenHorizontalPadding).toBe(16);
    expect(Theme.layout.primaryButtonHeight).toBe(48);
    expect(Theme.typography.heroMetric.fontSize).toBeGreaterThan(Theme.typography.cardTitle.fontSize);
  });
});
