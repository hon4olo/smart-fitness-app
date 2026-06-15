import { StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import { AppCard } from '@/components/ui/AppCard';

type MetricCardProps = {
  label: string;
  value: string;
  detail?: string;
};

export function MetricCard({ label, value, detail }: MetricCardProps) {
  return (
    <AppCard style={styles.card}>
      <Text selectable style={styles.label}>
        {label}
      </Text>
      <View style={styles.valueRow}>
        <Text selectable style={styles.value}>
          {value}
        </Text>
      </View>
      {detail ? (
        <Text selectable style={styles.detail}>
          {detail}
        </Text>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 148,
  },
  detail: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
  },
  label: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  value: {
    color: Colors.dark.text,
    fontSize: 24,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
  },
  valueRow: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
});
