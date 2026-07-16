import { Platform } from 'react-native';

const semanticColors = {
  background: '#090B0F',
  surfacePrimary: '#151922',
  surfaceSecondary: '#202838',
  surfaceElevated: '#232C3D',
  textPrimary: '#F5F7FA',
  textSecondary: '#9CA7B8',
  textMuted: '#718096',
  borderSubtle: '#242B38',
  accent: '#4ADE80',
  success: '#4ADE80',
  warning: '#F59E0B',
  error: '#FF9CA5',
} as const;

const legacyColors = {
  text: semanticColors.textPrimary,
  background: semanticColors.background,
  backgroundElement: semanticColors.surfacePrimary,
  backgroundSelected: semanticColors.surfaceSecondary,
  textSecondary: semanticColors.textSecondary,
  border: semanticColors.borderSubtle,
  accent: semanticColors.accent,
  accentMuted: '#173323',
} as const;

export const Colors = {
  light: {
    ...semanticColors,
    ...legacyColors,
  },
  dark: {
    ...semanticColors,
    ...legacyColors,
  },
} as const;

export const Theme = {
  colors: semanticColors,
  spacing: {
    4: 4,
    8: 8,
    12: 12,
    16: 16,
    24: 24,
    32: 32,
    40: 40,
  },
  radii: {
    small: 10,
    medium: 14,
    large: 18,
    pill: 999,
  },
  typography: {
    display: {
      fontSize: 32,
      lineHeight: 38,
      fontWeight: '800' as const,
      letterSpacing: -0.4,
    },
    screenTitle: {
      fontSize: 24,
      lineHeight: 30,
      fontWeight: '800' as const,
      letterSpacing: -0.2,
    },
    sectionTitle: {
      fontSize: 14,
      lineHeight: 18,
      fontWeight: '800' as const,
      letterSpacing: 0.4,
      textTransform: 'uppercase' as const,
    },
    body: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '400' as const,
    },
    bodyStrong: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '700' as const,
    },
    caption: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '400' as const,
    },
    metricLarge: {
      fontSize: 28,
      lineHeight: 34,
      fontWeight: '800' as const,
    },
    metricSmall: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '700' as const,
      letterSpacing: 0.2,
      textTransform: 'uppercase' as const,
    },
    button: {
      fontSize: 16,
      lineHeight: 20,
      fontWeight: '800' as const,
    },
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
  4: 4,
  8: 8,
  12: 12,
  16: 16,
  24: 24,
  32: 32,
  40: 40,
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radii = Theme.radii;
export const Typography = Theme.typography;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
