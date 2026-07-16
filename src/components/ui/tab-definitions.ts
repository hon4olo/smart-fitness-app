export type TabDefinition = {
  accessibilityLabel: string;
  label: string;
  name: 'index' | 'labs' | 'track' | 'eat' | 'profile';
};

export const TAB_DEFINITIONS: TabDefinition[] = [
  { name: 'index', label: 'Home', accessibilityLabel: 'Home tab' },
  { name: 'labs', label: 'Workouts', accessibilityLabel: 'Workouts tab' },
  { name: 'track', label: 'Nutrition', accessibilityLabel: 'Nutrition tab' },
  { name: 'eat', label: 'Progress', accessibilityLabel: 'Progress tab' },
  { name: 'profile', label: 'Profile', accessibilityLabel: 'Profile tab' },
];

export const getTabAccessibilityState = (selected: boolean) => ({ selected });
