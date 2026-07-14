import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing } from '@/constants/theme';
import type { HomeSnapshotItem } from '@/lib/home';

type HomeSnapshotCardProps = {
  items: HomeSnapshotItem[];
};

function SnapshotTile({ detail, label, tone = 'neutral', value }: HomeSnapshotItem) {
  return (
    <View style={[styles.tile, tone === 'positive' && styles.tilePositive, tone === 'warning' && styles.tileWarning]}>
      <Text selectable style={styles.tileLabel}>
        {label}
      </Text>
      <Text selectable style={styles.tileValue}>
        {value}
      </Text>
      <Text selectable style={styles.tileDetail}>
        {detail}
      </Text>
    </View>
  );
}

export function HomeSnapshotCard({ items }: HomeSnapshotCardProps) {
  return (
    <AppCard>
      <View style={styles.header}>
        <Text selectable style={styles.title}>
          Weekly snapshot
        </Text>
        <Text selectable style={styles.subtitle}>
          Workouts, calories, weight, and training volume.
        </Text>
      </View>

      <View style={styles.grid}>
        {items.map((item) => (
          <SnapshotTile key={item.id} {...item} />
        ))}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  header: {
    gap: 2,
    marginBottom: Spacing.two,
  },
  subtitle: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  tile: {
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 12,
    borderWidth: 1,
    flexGrow: 1,
    gap: 2,
    minWidth: 150,
    padding: Spacing.two,
  },
  tileDetail: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  tileLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  tilePositive: {
    borderColor: '#295E3E',
  },
  tileValue: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 21,
  },
  tileWarning: {
    borderColor: '#63322A',
  },
  title: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '800',
  },
});
