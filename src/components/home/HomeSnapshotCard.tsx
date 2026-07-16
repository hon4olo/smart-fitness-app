import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { Colors, Radii, Spacing, Typography } from '@/constants/theme';
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
    gap: 4,
    marginBottom: Spacing.two,
  },
  subtitle: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.callout.fontSize,
    lineHeight: Typography.callout.lineHeight,
  },
  tile: {
    backgroundColor: Colors.dark.surfaceSecondary,
    borderColor: Colors.dark.borderSubtle,
    borderCurve: 'continuous',
    borderRadius: Radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flexGrow: 1,
    gap: 2,
    minWidth: 150,
    padding: Spacing.three,
  },
  tileDetail: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
  },
  tileLabel: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.label.fontWeight,
    textTransform: 'uppercase',
  },
  tilePositive: {
    backgroundColor: Colors.dark.successSoft,
    borderColor: Colors.dark.success,
  },
  tileValue: {
    color: Colors.dark.textPrimary,
    fontSize: Typography.bodyEmphasized.fontSize,
    fontWeight: Typography.bodyEmphasized.fontWeight,
    lineHeight: Typography.bodyEmphasized.lineHeight,
  },
  tileWarning: {
    backgroundColor: Colors.dark.warningSoft,
    borderColor: Colors.dark.warning,
  },
  title: {
    color: Colors.dark.textPrimary,
    fontSize: Typography.cardTitle.fontSize,
    fontWeight: Typography.cardTitle.fontWeight,
    lineHeight: Typography.cardTitle.lineHeight,
  },
});
