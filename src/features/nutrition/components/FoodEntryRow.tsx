import { Pressable, Text, View } from 'react-native';

import { getServingInfo } from '@/lib';
import { formatNumber } from '@/lib/nutrition';
import type { getNutritionDiaryCopy } from '@/localization/nutritionDiaryCopy';
import type { FoodEntry } from '@/types';
import { formatEnergyValue, type EnergyUnit } from '@/units';

import { NutritionSummaryGrid } from './NutritionSummaryGrid';

type FoodEntryRowProps = {
  copy: ReturnType<typeof getNutritionDiaryCopy>;
  energyUnit: EnergyUnit;
  entry: FoodEntry;
  index: number;
  nutritionTargetCalories: number;
  onEdit: (entry: FoodEntry) => void;
  styles: Record<string, any>;
};

export function FoodEntryRow({
  copy,
  energyUnit,
  entry,
  index,
  nutritionTargetCalories,
  onEdit,
  styles,
}: FoodEntryRowProps) {
  const foodTargetPercent =
    nutritionTargetCalories > 0
      ? Math.round((entry.calories / nutritionTargetCalories) * 100)
      : 0;
  const foodTargetPercentLabel = nutritionTargetCalories > 0 ? `${foodTargetPercent}%` : '--';
  const foodMetadata = [entry.brandName, getServingInfo(entry)].filter(Boolean).join(' · ');
  const foodAccessibilityLabel = copy.editFoodLabel(
    entry.name,
    foodMetadata || copy.noMetadata,
    formatNumber(entry.fats),
    formatNumber(entry.carbs),
    formatNumber(entry.protein),
    foodTargetPercentLabel,
    formatEnergyValue(entry.calories, energyUnit),
    energyUnit,
  );

  return (
    <Pressable
      accessibilityHint={copy.editFoodHint}
      accessibilityLabel={foodAccessibilityLabel}
      hitSlop={10}
      onPress={() => onEdit(entry)}
      style={[styles.foodRow, index > 0 && styles.foodRowDivider]}>
      <View style={styles.foodRowTop}>
        <View style={styles.foodRowCopy}>
          <Text selectable numberOfLines={1} ellipsizeMode="tail" style={styles.foodRowTitle}>
            {entry.name}
          </Text>
          <Text selectable numberOfLines={1} ellipsizeMode="tail" style={styles.foodRowDetail}>
            {foodMetadata || '—'}
          </Text>
        </View>
      </View>

      <NutritionSummaryGrid
        nested
        styles={styles}
        values={{
          fats: formatNumber(entry.fats),
          carbs: formatNumber(entry.carbs),
          protein: formatNumber(entry.protein),
          target: foodTargetPercentLabel,
          calories: formatEnergyValue(entry.calories, energyUnit),
        }}
      />
    </Pressable>
  );
}
