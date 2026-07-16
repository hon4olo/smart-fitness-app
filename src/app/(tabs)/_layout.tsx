import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { Colors } from '@/constants/theme';
import { TAB_DEFINITIONS } from '@/components/ui/tab-definitions';

const colors = Colors.dark;
const TAB_ICON_PROPS = {
  index: { md: { default: 'home', selected: 'home' } },
  labs: { md: { default: 'fitness_center', selected: 'fitness_center' } },
  track: { md: { default: 'restaurant', selected: 'restaurant' } },
  eat: { md: { default: 'query_stats', selected: 'query_stats' } },
  profile: { md: { default: 'person', selected: 'person' } },
} as const;

export default function TabsLayout() {
  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.accentMuted}
      iconColor={{ default: colors.textSecondary, selected: colors.accent }}
      labelStyle={{
        default: { color: colors.textSecondary },
        selected: { color: colors.text },
      }}
      tintColor={colors.accent}>
      {TAB_DEFINITIONS.map((tab) => (
        <NativeTabs.Trigger key={tab.name} name={tab.name}>
          <NativeTabs.Trigger.Icon {...((TAB_ICON_PROPS as any)[tab.name])} />
          <NativeTabs.Trigger.Label>{tab.label}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
