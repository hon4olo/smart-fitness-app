import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing } from '@/constants/theme';

type IntelligenceTileProps = {
  detail: string;
  label: string;
  tone?: 'neutral' | 'positive' | 'warning';
  value: string;
};

function IntelligenceTile({ detail, label, tone = 'neutral', value }: IntelligenceTileProps) {
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

type HomeIntelligenceCardProps = {
  motivation: string;
  nutritionDetail: string;
  nutritionStatus: string;
  primaryRecommendation: string;
  recoveryDetail: string;
  recoveryStatus: string;
  trainingFocus: string;
};

export function HomeIntelligenceCard({ motivation, nutritionDetail, nutritionStatus, primaryRecommendation, recoveryDetail, recoveryStatus, trainingFocus }: HomeIntelligenceCardProps) {
  return (
    <AppCard>
      <View style={styles.header}>
        <Text selectable style={styles.title}>
          Fitness Intelligence
        </Text>
        <Text selectable style={styles.subtitle}>
          Deterministic local recommendations from training, recovery, and nutrition data.
        </Text>
      </View>

      <View style={styles.primaryRecommendation}>
        <Text selectable style={styles.primaryLabel}>
          Today&apos;s recommendation
        </Text>
        <Text selectable style={styles.primaryValue}>
          {primaryRecommendation}
        </Text>
      </View>

      <View style={styles.grid}>
        <IntelligenceTile detail={recoveryDetail} label="Recovery status" tone={recoveryStatus === 'Overloaded' || recoveryStatus === 'Recovery Delayed' ? 'warning' : 'positive'} value={recoveryStatus} />
        <IntelligenceTile detail={nutritionDetail} label="Nutrition status" tone={nutritionStatus === 'Over-eating' ? 'warning' : nutritionStatus === 'Under-eating' || nutritionStatus === 'Protein short' ? 'warning' : 'positive'} value={nutritionStatus} />
        <IntelligenceTile detail="Primary focus from the current local rules." label="Training focus" tone="neutral" value={trainingFocus} />
        <IntelligenceTile detail={motivation} label="Motivation insight" tone="positive" value={motivation} />
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
  primaryLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  primaryRecommendation: {
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
    marginBottom: Spacing.two,
    padding: Spacing.three,
  },
  primaryValue: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 21,
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
