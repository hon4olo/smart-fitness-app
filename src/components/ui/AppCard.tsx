import { PropsWithChildren, useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { Colors, Radii, Shadows, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/theme/AppThemeProvider';

type AppCardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
}>;

export function AppCard({ children, style }: AppCardProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return <View style={[styles.card, style]}>{children}</View>;
}

const createStyles = (colors: typeof Colors.dark) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      gap: Spacing.four,
      padding: Spacing.four,
      ...Shadows.card,
    },
  });
