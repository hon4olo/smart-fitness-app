import { StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing, Typography } from '@/constants/theme';

type StatChipProps = {
  detail?: string;
  label: string;
  tone?: 'neutral' | 'positive' | 'warning';
  value: string;
};

export function StatChip({ detail, label, tone = 'neutral', value }: StatChipProps) {
  return (
    <View style={[styles.chip, tone === 'positive' && styles.chipPositive, tone === 'warning' && styles.chipWarning]}>
      <Text selectable style={styles.label}>
        {label}
      </Text>
      <Text selectable style={styles.value}>
        {value}
      </Text>
      {detail ? (
        <Text selectable style={styles.detail}>
          {detail}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: Colors.dark.surfaceSecondary,
    borderColor: Colors.dark.borderSubtle,
    borderCurve: 'continuous',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    gap: 4,
    minWidth: 148,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  chipPositive: {
    backgroundColor: Colors.dark.successSoft,
    borderColor: Colors.dark.success,
  },
  chipWarning: {
    backgroundColor: Colors.dark.warningSoft,
    borderColor: Colors.dark.warning,
  },
  detail: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
  },
  label: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.label.fontWeight,
    textTransform: 'uppercase',
  },
  value: {
    color: Colors.dark.textPrimary,
    fontSize: Typography.bodyEmphasized.fontSize,
    fontWeight: Typography.bodyEmphasized.fontWeight,
    lineHeight: Typography.bodyEmphasized.lineHeight,
  },
});
