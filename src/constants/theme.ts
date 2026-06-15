import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#F5F7FA',
    background: '#090B0F',
    backgroundElement: '#151922',
    backgroundSelected: '#202838',
    textSecondary: '#9CA7B8',
    border: '#242B38',
    accent: '#4ADE80',
    accentMuted: '#173323',
  },
  dark: {
    text: '#F5F7FA',
    background: '#090B0F',
    backgroundElement: '#151922',
    backgroundSelected: '#202838',
    textSecondary: '#9CA7B8',
    border: '#242B38',
    accent: '#4ADE80',
    accentMuted: '#173323',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
