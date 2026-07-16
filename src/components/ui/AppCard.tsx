import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { Colors, Radii, Spacing } from '@/constants/theme';

type AppCardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
}>;

export function AppCard({ children, style }: AppCardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dark.backgroundElement,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: Radii.large,
    borderWidth: 1,
    gap: Spacing.two,
    padding: Spacing.three,
  },
});
