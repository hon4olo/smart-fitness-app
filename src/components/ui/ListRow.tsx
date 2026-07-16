import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Layout, Radii, Spacing, Typography } from '@/constants/theme';

type ListRowProps = {
  accessibilityHint?: string;
  accessibilityLabel?: string;
  badge?: string;
  detail?: string;
  leading?: ReactNode;
  onPress?: () => void;
  title: string;
  trailing?: ReactNode;
  value?: string;
};

export function ListRow({ accessibilityHint, accessibilityLabel, badge, detail, leading, onPress, title, trailing, value }: ListRowProps) {
  const content = (
    <View style={styles.rowContent}>
      {leading ? <View style={styles.leading}>{leading}</View> : null}
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          {badge ? <Text style={styles.badge}>{badge}</Text> : null}
        </View>
        {detail ? <Text style={styles.detail}>{detail}</Text> : null}
      </View>
      <View style={styles.trailing}>
        {value ? <Text style={styles.value}>{value}</Text> : null}
        {trailing}
      </View>
      {onPress ? <Text style={styles.chevron}>›</Text> : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityHint={accessibilityHint}
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
        {content}
      </Pressable>
    );
  }

  return <View style={styles.row}>{content}</View>;
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: Colors.dark.accentSoft,
    borderRadius: Radii.pill,
    color: Colors.dark.accent,
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.button.fontWeight,
    paddingHorizontal: Spacing.one,
    paddingVertical: 2,
  },
  chevron: {
    color: Colors.dark.textMuted,
    fontSize: 24,
    lineHeight: 24,
    marginLeft: Spacing.one,
  },
  copy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  detail: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
  },
  leading: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.two,
  },
  pressed: {
    backgroundColor: Colors.dark.backgroundSelected,
  },
  row: {
    backgroundColor: Colors.dark.surfacePrimary,
    borderColor: Colors.dark.borderSubtle,
    borderCurve: 'continuous',
    borderRadius: Radii.large,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: Layout.rowHeight,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  rowContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
  },
  title: {
    color: Colors.dark.textPrimary,
    fontSize: Typography.body.fontSize,
    fontWeight: Typography.bodyEmphasized.fontWeight,
    lineHeight: Typography.body.lineHeight,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  trailing: {
    alignItems: 'flex-end',
    gap: 2,
    marginLeft: 'auto',
  },
  value: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
    textAlign: 'right',
  },
});
