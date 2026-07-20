import { Text, View } from 'react-native';

import { formatNumber } from '@/lib/nutrition';

type NutritionDetailsSectionProps = {
  styles: Record<string, any>;
  totalFiber: number;
};

export function NutritionDetailsSection({ styles, totalFiber }: NutritionDetailsSectionProps) {
  return (
    <View style={styles.detailsSection}>
      <View style={styles.sectionHeader}>
        <Text selectable style={styles.sectionTitle}>
          Nutrition details
        </Text>
      </View>
      <View style={styles.detailRow}>
        <Text selectable style={styles.detailLabel}>
          Fiber
        </Text>
        <Text selectable style={styles.detailValue}>
          {formatNumber(totalFiber)} g
        </Text>
      </View>
    </View>
  );
}
