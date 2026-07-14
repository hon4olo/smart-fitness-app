import { StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';

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
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    gap: 2,
    minWidth: 148,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  chipPositive: {
    borderColor: '#295E3E',
  },
  chipWarning: {
    borderColor: '#63322A',
  },
  detail: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  label: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  value: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 21,
  },
});
