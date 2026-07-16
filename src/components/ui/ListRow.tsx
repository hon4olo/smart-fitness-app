import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radii, Spacing, Typography } from '@/constants/theme';

type ListRowProps = {
  accessibilityHint?: string;
  accessibilityLabel?: string;
  detail?: string;
  onPress?: () => void;
  title: string;
  value?: string;
};

export function ListRow({ accessibilityHint, accessibilityLabel, detail, onPress, title, value }: ListRowProps) {
  if (onPress) {
    return (
      <Pressable
        accessibilityHint={accessibilityHint}
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
        <View style={styles.copy}>
          <Text style={styles.title}>{title}</Text>
          {detail ? <Text style={styles.detail}>{detail}</Text> : null}
        </View>
        {value ? <Text style={styles.value}>{value}</Text> : null}
      </Pressable>
    );
  }

  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {detail ? <Text style={styles.detail}>{detail}</Text> : null}
      </View>
      {value ? <Text style={styles.value}>{value}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: Radii.medium,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  detail: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
  },
  pressed: {
    opacity: 0.84,
  },
  title: {
    color: Colors.dark.text,
    fontSize: Typography.body.fontSize,
    fontWeight: '700',
    lineHeight: Typography.body.lineHeight,
  },
  value: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
    textAlign: 'right',
  },
});
