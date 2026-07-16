import { StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing, Typography } from '@/constants/theme';
import { TertiaryButton } from './TertiaryButton';

type ScreenHeaderProps = {
  actionLabel?: string;
  onActionPress?: () => void;
  subtitle?: string;
  title: string;
};

export function ScreenHeader({ actionLabel, onActionPress, subtitle, title }: ScreenHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      {actionLabel && onActionPress ? <TertiaryButton label={actionLabel} onPress={onActionPress} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.three,
    justifyContent: 'space-between',
  },
  copy: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  subtitle: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.callout.fontSize,
    lineHeight: Typography.callout.lineHeight,
  },
  title: {
    color: Colors.dark.textPrimary,
    fontSize: Typography.largeTitle.fontSize,
    fontWeight: Typography.largeTitle.fontWeight,
    letterSpacing: Typography.largeTitle.letterSpacing,
    lineHeight: Typography.largeTitle.lineHeight,
  },
});
