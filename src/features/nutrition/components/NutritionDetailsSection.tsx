import { Text, View } from 'react-native';

import { formatNumber } from '@/lib/nutrition';
import { useLocalization } from '@/localization';
import { getNutritionDiaryCopy } from '@/localization/nutritionDiaryCopy';

type NutritionDetailsSectionProps = {
  styles: Record<string, any>;
  totalFiber: number;
};

export function NutritionDetailsSection({ styles, totalFiber }: NutritionDetailsSectionProps) {
  const { locale } = useLocalization();
  const copy = getNutritionDiaryCopy(locale);

  return (
    <View style={styles.detailsSection}>
      <View style={styles.sectionHeader}>
        <Text selectable style={styles.sectionTitle}>
          {copy.nutritionDetails}
        </Text>
      </View>
      <View style={styles.detailRow}>
        <Text selectable style={styles.detailLabel}>
          {copy.fiber}
        </Text>
        <Text selectable style={styles.detailValue}>
          {formatNumber(totalFiber)} g
        </Text>
      </View>
    </View>
  );
}
