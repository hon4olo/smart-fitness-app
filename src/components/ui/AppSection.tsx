import { PropsWithChildren, ReactNode } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing, Typography } from '@/constants/theme';

type AppSectionProps = PropsWithChildren<{
  accessory?: ReactNode;
  bodyStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  subtitle?: string;
  title: string;
}>;

export function AppSection({ accessory, bodyStyle, children, style, subtitle, title }: AppSectionProps) {
  return (
    <AppCard style={style}>
      <View style={styles.header}>
        <View style={styles.copy}>
          <Text selectable style={styles.title}>
            {title}
          </Text>
          {subtitle ? <Text selectable style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {accessory ? <View>{accessory}</View> : null}
      </View>
      <View style={bodyStyle}>{children}</View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  copy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  subtitle: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.callout.fontSize,
    lineHeight: Typography.callout.lineHeight,
  },
  title: {
    color: Colors.dark.textPrimary,
    fontSize: Typography.cardTitle.fontSize,
    fontWeight: Typography.cardTitle.fontWeight,
    lineHeight: Typography.cardTitle.lineHeight,
  },
});
