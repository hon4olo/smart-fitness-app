import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing } from '@/constants/theme';

type NutritionSummaryCardProps = {
  calorieLine: string;
  ctaLabel: string;
  detail: string;
  onPress: () => void;
  proteinLine: string;
  title: string;
};

export function NutritionSummaryCard({ calorieLine, ctaLabel, detail, onPress, proteinLine, title }: NutritionSummaryCardProps) {
  return (
    <AppCard>
      <Text selectable style={styles.sectionTitle}>
        Coach insight
      </Text>
      <View style={styles.suggestionSummary}>
        <View style={styles.suggestionSummaryRow}>
          <Text selectable style={styles.suggestionLabel}>
            {title}
          </Text>
          <Text selectable style={styles.suggestionValue}>
            {calorieLine}
          </Text>
        </View>
        <View style={styles.suggestionSummaryRow}>
          <Text selectable style={styles.suggestionLabel}>
            Direction
          </Text>
          <Text selectable style={styles.suggestionValue}>
            {detail}
          </Text>
        </View>
        <View style={styles.suggestionSummaryRow}>
          <Text selectable style={styles.suggestionLabel}>
            Protein
          </Text>
          <Text selectable style={styles.suggestionValue}>
            {proteinLine}
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
  suggestionLabel: {
    color: Colors.dark.textSecondary,
    flex: 1,
    fontSize: 15,
  },
  suggestionSummary: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  suggestionSummaryRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  suggestionValue: {
    color: Colors.dark.text,
    flex: 1,
    fontSize: 15,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
    textAlign: 'right',
  },
});
