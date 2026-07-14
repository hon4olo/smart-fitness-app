import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing } from '@/constants/theme';
import type { HomeActivityItem } from '@/lib/home';

type HomeActivityCardProps = {
  items: HomeActivityItem[];
};

export function HomeActivityCard({ items }: HomeActivityCardProps) {
  return (
    <AppCard>
      <View style={styles.header}>
        <Text selectable style={styles.title}>
          Recent activity
        </Text>
        <Text selectable style={styles.subtitle}>
          Latest workout, weight, meal, and PR.
        </Text>
      </View>

      {items.length > 0 ? (
        <View style={styles.list}>
          {items.map((item) => (
            <View key={item.id} style={styles.row}>
              <View style={styles.pill}>
                <Text style={styles.pillLabel}>{item.label}</Text>
              </View>
              <View style={styles.copy}>
                <Text selectable style={styles.value}>
                  {item.value}
                </Text>
                <Text selectable style={styles.detail}>
                  {item.detail}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Text selectable style={styles.emptyState}>
          Add a workout, a weigh-in, or a meal and it will show up here.
        </Text>
      )}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  copy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  detail: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  emptyState: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  header: {
    gap: 2,
  },
  list: {
    gap: Spacing.two,
  },
  pill: {
    alignItems: 'center',
    backgroundColor: Colors.dark.backgroundSelected,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 999,
    borderWidth: 1,
    minWidth: 90,
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
  },
  pillLabel: {
    color: Colors.dark.text,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  row: {
    alignItems: 'flex-start',
    borderColor: Colors.dark.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    paddingTop: Spacing.two,
  },
  subtitle: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '800',
  },
  value: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '800',
  },
});
