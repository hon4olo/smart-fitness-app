import { DynamicColorIOS, Platform } from 'react-native';

export type AppearanceMode = 'system' | 'light' | 'dark';
export type ResolvedAppearance = 'light' | 'dark';

export const APPEARANCE_MODES: ReadonlyArray<{ label: string; value: AppearanceMode }> = [
  { label: 'System', value: 'system' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
] as const;

export const APPEARANCE_LABELS: Record<AppearanceMode, string> = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
};

type Palette = Record<string, string>;

const lightPalette: Palette = {
  background: '#F6F8FA',
  backgroundSecondary: '#EEF2F5',
  surfacePrimary: '#FFFFFF',
  surfaceSecondary: '#F3F6F8',
  surfaceElevated: '#FFFFFF',
  surfaceAccent: '#E7F5F1',
  textPrimary: '#111827',
  textSecondary: '#5B6672',
  textMuted: '#7A8591',
  textOnAccent: '#FFFFFF',
  divider: '#E3E8ED',
  borderSubtle: '#DCE3E8',
  accent: '#1B8A7A',
  accentPressed: '#167266',
  accentSoft: '#DDEFEB',
  success: '#16815E',
  successSoft: '#DCEFE8',
  warning: '#A06A1E',
  warningSoft: '#F5E7CB',
  error: '#C94B5C',
  errorSoft: '#F6DDE1',
  chartPrimary: '#1B8A7A',
  chartSecondary: '#7A8591',
  overlay: 'rgba(17, 24, 39, 0.10)',
  shadow: 'rgba(17, 24, 39, 0.08)',
  backgroundElement: '#FFFFFF',
  backgroundSelected: '#E8EEF2',
  border: '#DCE3E8',
  text: '#111827',
  textSecondaryLegacy: '#5B6672',
  textMutedLegacy: '#7A8591',
  accentMuted: '#DDEFEB',
};

const darkPalette: Palette = {
  background: '#000000',
  backgroundSecondary: '#111111',
  surfacePrimary: '#111111',
  surfaceSecondary: '#1C1C1E',
  surfaceElevated: '#282828',
  surfaceAccent: '#0D2D52',
  textPrimary: '#FFFFFF',
  textSecondary: '#B0B0B5',
  textMuted: '#8E8E93',
  textOnAccent: '#FFFFFF',
  divider: '#1C1C1E',
  borderSubtle: '#1C1C1E',
  accent: '#0A84FF',
  accentPressed: '#006EDB',
  accentSoft: '#0D2D52',
  success: '#2ED66F',
  successSoft: '#003D1C',
  warning: '#FFD60A',
  warningSoft: '#332900',
  error: '#FF453A',
  errorSoft: '#3A1111',
  chartPrimary: '#0A84FF',
  chartSecondary: '#8E8E93',
  overlay: 'rgba(0, 0, 0, 0.55)',
  shadow: 'rgba(0, 0, 0, 0.32)',
  backgroundElement: '#111111',
  backgroundSelected: '#282828',
  border: '#1C1C1E',
  text: '#FFFFFF',
  textSecondaryLegacy: '#B0B0B5',
  textMutedLegacy: '#8E8E93',
  accentMuted: '#0D2D52',
};

const adaptive = (light: Palette, dark: Palette): Palette => {
  const next = {} as Palette;

  for (const key of Object.keys(light) as Array<keyof Palette>) {
    next[key] = Platform.OS === 'ios'
      ? ((DynamicColorIOS({ light: light[key] as any, dark: dark[key] as any } as any) as unknown) as string)
      : dark[key];
  }

  return next;
};

export const Colors = {
  light: lightPalette,
  dark: adaptive(lightPalette, darkPalette),
};

export type ThemeColor = keyof typeof Colors.light;

export const Theme = {
  colors: Colors.dark,
  spacing: {
    4: 4,
    8: 8,
    12: 12,
    16: 16,
    20: 20,
    24: 24,
    32: 32,
    40: 40,
    48: 48,
  },
  radii: {
    small: 12,
    medium: 16,
    large: 20,
    xlarge: 28,
    pill: 999,
  },
  typography: {
    largeTitle: {
      fontSize: 34,
      lineHeight: 40,
      fontWeight: '700' as const,
      letterSpacing: -0.4,
    },
    screenTitle: {
      fontSize: 28,
      lineHeight: 34,
      fontWeight: '700' as const,
      letterSpacing: -0.35,
    },
    heroMetric: {
      fontSize: 38,
      lineHeight: 44,
      fontWeight: '800' as const,
      letterSpacing: -0.8,
    },
    sectionTitle: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '700' as const,
      letterSpacing: 0.7,
      textTransform: 'uppercase' as const,
    },
    cardTitle: {
      fontSize: 18,
      lineHeight: 24,
      fontWeight: '700' as const,
      letterSpacing: -0.2,
    },
    body: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '400' as const,
    },
    bodyEmphasized: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '600' as const,
    },
    callout: {
      fontSize: 15,
      lineHeight: 22,
      fontWeight: '500' as const,
    },
    label: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '700' as const,
      letterSpacing: 0.2,
    },
    caption: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '500' as const,
    },
    button: {
      fontSize: 16,
      lineHeight: 20,
      fontWeight: '700' as const,
    },
    display: {
      fontSize: 34,
      lineHeight: 40,
      fontWeight: '700' as const,
      letterSpacing: -0.4,
    },
    bodyStrong: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '600' as const,
    },
    metricLarge: {
      fontSize: 38,
      lineHeight: 44,
      fontWeight: '800' as const,
      letterSpacing: -0.8,
    },
    metricSmall: {
      fontSize: 11,
      lineHeight: 16,
      fontWeight: '700' as const,
      letterSpacing: 0.4,
      textTransform: 'uppercase' as const,
    },
  },
  layout: {
    screenHorizontalPadding: 16,
    screenTopSpacing: 20,
    sectionGap: 24,
    contentGap: 16,
    compactGap: 8,
    rowHeight: 56,
    controlHeight: 44,
    primaryButtonHeight: 48,
    tabBarClearance: 32,
  },
  shadow: {
    card: {
      shadowColor: darkPalette.shadow,
      shadowOpacity: 0.12,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
      elevation: 3,
    },
    elevated: {
      shadowColor: darkPalette.shadow,
      shadowOpacity: 0.16,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 10 },
      elevation: 6,
    },
  },
};

export const Spacing = {
  4: 4,
  8: 8,
  12: 12,
  16: 16,
  20: 20,
  24: 24,
  32: 32,
  40: 40,
  48: 48,
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 20,
  six: 24,
  seven: 32,
  eight: 40,
  nine: 48,
};

export const Radii = Theme.radii;
export const Typography = Theme.typography;
export const Layout = Theme.layout;
export const Shadows = Theme.shadow;

export const BottomTabInset = Platform.select({ ios: 52, android: 84 }) ?? 0;
export const MaxContentWidth = 800;
