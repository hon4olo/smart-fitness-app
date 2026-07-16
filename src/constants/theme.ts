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
  background: '#F5F1EA',
  backgroundSecondary: '#EFE9DF',
  surfacePrimary: '#FFFFFF',
  surfaceSecondary: '#F7F4EE',
  surfaceElevated: '#FFFFFF',
  surfaceAccent: '#E4F4EC',
  textPrimary: '#111417',
  textSecondary: '#55606D',
  textMuted: '#808A96',
  textOnAccent: '#FFFFFF',
  divider: '#D8DDD6',
  borderSubtle: '#D9DDD7',
  accent: '#177D54',
  accentPressed: '#136345',
  accentSoft: '#D9F0E5',
  success: '#178D58',
  successSoft: '#DDF4E8',
  warning: '#C27E1F',
  warningSoft: '#F5E1BB',
  error: '#C94C5B',
  errorSoft: '#F8DDE2',
  chartPrimary: '#177D54',
  chartSecondary: '#7E8C98',
  overlay: 'rgba(17, 20, 23, 0.16)',
  shadow: 'rgba(17, 20, 23, 0.08)',
  backgroundElement: '#FFFFFF',
  backgroundSelected: '#F0ECE5',
  border: '#D9DDD7',
  text: '#111417',
  textSecondaryLegacy: '#55606D',
  textMutedLegacy: '#808A96',
  accentMuted: '#D9F0E5',
};

const darkPalette: Palette = {
  background: '#0D1117',
  backgroundSecondary: '#131923',
  surfacePrimary: '#171E28',
  surfaceSecondary: '#1D2633',
  surfaceElevated: '#232D3B',
  surfaceAccent: '#143424',
  textPrimary: '#F4F7F8',
  textSecondary: '#AFBAC7',
  textMuted: '#7F8A97',
  textOnAccent: '#F7FBF8',
  divider: '#24303D',
  borderSubtle: '#2A3645',
  accent: '#56D39A',
  accentPressed: '#3EB57E',
  accentSoft: '#173726',
  success: '#56D39A',
  successSoft: '#173726',
  warning: '#D6A14A',
  warningSoft: '#34261A',
  error: '#F08A95',
  errorSoft: '#35202A',
  chartPrimary: '#56D39A',
  chartSecondary: '#94A4B4',
  overlay: 'rgba(0, 0, 0, 0.46)',
  shadow: 'rgba(0, 0, 0, 0.38)',
  backgroundElement: '#171E28',
  backgroundSelected: '#1D2633',
  border: '#2A3645',
  text: '#F4F7F8',
  textSecondaryLegacy: '#AFBAC7',
  textMutedLegacy: '#7F8A97',
  accentMuted: '#173726',
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
