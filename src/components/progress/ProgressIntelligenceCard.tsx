import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing } from '@/constants/theme';

type BulletListProps = {
  items: string[];
  emptyLabel: string;
};

function BulletList({ emptyLabel, items }: BulletListProps) {
  if (items.length === 0) {
    return <Text style={styles.empty}>{emptyLabel}</Text>;
  }

  return (
    <View style={styles.list}>
      {items.map((item) => (
        <View key={item} style={styles.row}>
          <Text style={styles.bullet}>•</Text>
          <Text selectable style={styles.text}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

type ProgressIntelligenceCardProps = {
  actionableRecommendations: string[];
  improvementOpportunities: string[];
  recoverySummary: string;
  trainingWarnings: string[];
};

export function ProgressIntelligenceCard({ actionableRecommendations, improvementOpportunities, recoverySummary, trainingWarnings }: ProgressIntelligenceCardProps) {
  return (
    <AppCard>
      <View style={styles.header}>
        <Text selectable style={styles.title}>
          Intelligence summary
        </Text>
        <Text selectable style={styles.subtitle}>
          Local rules distilled into clear actions.
        </Text>
      </View>

      <View style={styles.block}>
        <Text selectable style={styles.blockTitle}>
          Actionable recommendations
        </Text>
        <BulletList emptyLabel="No actionable recommendation yet." items={actionableRecommendations} />
      </View>

      <View style={styles.block}>
        <Text selectable style={styles.blockTitle}>
          Recovery summary
        </Text>
        <Text selectable style={styles.text}>
          {recoverySummary}
        </Text>
      </View>

      <View style={styles.block}>
        <Text selectable style={styles.blockTitle}>
          Training warnings
        </Text>
        <BulletList emptyLabel="No training warnings." items={trainingWarnings} />
      </View>

      <View style={styles.block}>
        <Text selectable style={styles.blockTitle}>
          Improvement opportunities
        </Text>
        <BulletList emptyLabel="No improvement opportunities yet." items={improvementOpportunities} />
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
  blockTitle: {
    color: Colors.dark.text,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  bullet: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    width: 12,
  },
  empty: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  header: {
    gap: 2,
  },
  list: {
    gap: 6,
  },
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
  },
  subtitle: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  text: {
    color: Colors.dark.text,
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '800',
  },
});
