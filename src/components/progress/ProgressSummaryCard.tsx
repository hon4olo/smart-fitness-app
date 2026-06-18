import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing } from '@/constants/theme';

type SummaryRow = {
  label: ReactNode;
  value: ReactNode;
};

type ProgressSummaryCardProps = {
  emptyMessage?: string;
  rows: SummaryRow[];
  title: string;
};

export function ProgressSummaryCard({ rows, title, emptyMessage }: ProgressSummaryCardProps) {
  return (
    <AppCard>
      <Text style={styles.sectionTitle}>{title}</Text>
      {rows.length > 0 ? (
        <View style={styles.summary}>
          {rows.map((row, index) => (
            <View key={index} style={styles.row}>
              <Text style={styles.label}>{row.label}</Text>
              <Text style={styles.value}>{row.value}</Text>
            </View>
          ))}
        </View>
      ) : emptyMessage ? (
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  emptyText: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
  },
  label: {
    color: Colors.dark.textSecondary,
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  sectionTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '800',
  },
  summary: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  value: {
    color: Colors.dark.text,
    fontSize: 16,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
  },
});
