import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing } from '@/constants/theme';

type WorkoutCoachInsightCardProps = {
  ctaLabel: string;
  detail: string;
  onPress: () => void;
  summaryLine: string;
  title: string;
};

export function WorkoutCoachInsightCard({ ctaLabel, detail, onPress, summaryLine, title }: WorkoutCoachInsightCardProps) {
  return (
    <AppCard>
      <Text selectable style={styles.sectionTitle}>
        Coach insight
      </Text>
      <View style={styles.insightSummary}>
        <View style={styles.insightSummaryRow}>
          <Text selectable style={styles.insightLabel}>
            {title}
          </Text>
          <Text selectable style={styles.insightValue}>
            {summaryLine}
          </Text>
        </View>
        <View style={styles.insightSummaryRow}>
          <Text selectable style={styles.insightLabel}>
            Next step
          </Text>
          <Text selectable style={styles.insightValue}>
            {detail}
          </Text>
        </View>
      </View>
      <AppButton label={ctaLabel} onPress={onPress} variant="secondary" />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '800',
  },
  insightLabel: {
    color: Colors.dark.textSecondary,
    flex: 1,
    fontSize: 15,
  },
  insightSummary: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  insightSummaryRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  insightValue: {
    color: Colors.dark.text,
    flex: 1,
    fontSize: 15,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
    textAlign: 'right',
  },
});
