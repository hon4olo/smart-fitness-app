import { Pressable, Text, View } from 'react-native';

import { getServingInfo } from '@/lib';
import { formatNumber } from '@/lib/nutrition';
import type { FoodEntry } from '@/types';

import { NutritionSummaryGrid } from './NutritionSummaryGrid';

type FoodEntryRowProps = {
  entry: FoodEntry;
  index: number;
  nutritionTargetCalories: number;
  onEdit: (entry: FoodEntry) => void;
  styles: Record<string, any>;
};

export function FoodEntryRow({ entry, index, nutritionTargetCalories, onEdit, styles }: FoodEntryRowProps) {
  const foodTargetPercent = nutritionTargetCalories > 0 ? Math.round((entry.calories / nutritionTargetCalories) * 100) : 0;
  const foodTargetPercentLabel = nutritionTargetCalories > 0 ? `${foodTargetPercent}%` : '--';
  const foodMetadata = [entry.brandName, getServingInfo(entry)].filter(Boolean).join(' · ');
  const foodAccessibilityLabel = `Edit ${entry.name}, ${foodMetadata || 'no metadata'}, ${formatNumber(entry.fats)} fat, ${formatNumber(entry.carbs)} carbs, ${formatNumber(entry.protein)} protein, ${foodTargetPercentLabel} of target, ${formatNumber(entry.calories)} calories`;

  return (
    <Pressable
      accessibilityHint="Tap to edit this food entry"
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
          calories: formatNumber(entry.calories),
        }}
      />
    </Pressable>
  );
}
