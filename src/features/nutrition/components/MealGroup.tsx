import { Pressable, Text, View } from 'react-native';

import { sumNutritionTotals } from '@/lib';
import { formatMealItemCount, formatNumber } from '@/lib/nutrition';
import type { FoodEntry, MealType } from '@/types';

import { FoodEntryRow } from './FoodEntryRow';
import { NutritionSummaryGrid } from './NutritionSummaryGrid';

type MealGroupProps = {
  entries: FoodEntry[];
  expanded: boolean;
  mealIcon: string;
  mealLabel: string;
  mealType: MealType;
  nutritionTargetCalories: number;
  onEditFoodEntry: (entry: FoodEntry) => void;
  onOpenMealPicker: (mealType: MealType) => void;
  onToggleMealExpansion: (mealType: MealType) => void;
  styles: Record<string, any>;
  subtotal: ReturnType<typeof sumNutritionTotals>;
};

export function MealGroup({
  entries,
  expanded,
  mealIcon,
  mealLabel,
  mealType,
  nutritionTargetCalories,
  onEditFoodEntry,
  onOpenMealPicker,
  onToggleMealExpansion,
  styles,
  subtotal,
}: MealGroupProps) {
  const itemCount = entries.length;
  const mealTargetPercent = nutritionTargetCalories > 0 ? Math.round((subtotal.calories / nutritionTargetCalories) * 100) : 0;
  const mealTargetPercentLabel = nutritionTargetCalories > 0 ? `${mealTargetPercent}%` : '--';

  return (
    <View style={styles.mealGroup}>
      <Pressable
        accessibilityLabel={`${mealLabel} meal`}
        accessibilityState={{ expanded }}
        hitSlop={12}
        onPress={() => onToggleMealExpansion(mealType)}
        style={styles.mealHeader}>
        <View style={styles.mealHeaderLeft}>
          <Text style={styles.mealIcon}>{mealIcon}</Text>
          <View style={styles.mealHeaderCopy}>
            <Text selectable style={styles.mealTitle}>
              {mealLabel}
            </Text>
            <Text selectable style={styles.mealHeaderMeta}>
              {formatMealItemCount(itemCount)}
            </Text>
          </View>
        </View>

        <View style={styles.mealHeaderActions}>
          <Pressable
            accessibilityLabel={`Add food to ${mealLabel}`}
            hitSlop={12}
            onPress={(event) => {
              event.stopPropagation();
              onOpenMealPicker(mealType);
            }}
            style={styles.mealActionButton}>
            <Text style={styles.mealActionIcon}>+</Text>
          </Pressable>
          <Text style={styles.chevronText}>{expanded ? '▾' : '▸'}</Text>
        </View>
      </Pressable>

      <View style={styles.mealSummaryStrip}>
        <NutritionSummaryGrid
          styles={styles}
          values={{
            fats: formatNumber(subtotal.fats),
            carbs: formatNumber(subtotal.carbs),
            protein: formatNumber(subtotal.protein),
            target: mealTargetPercentLabel,
            calories: formatNumber(subtotal.calories),
          }}
        />
      </View>

      {expanded ? (
        <View style={styles.foodList}>
          {entries.length > 0
            ? entries.map((entry, index) => (
                <FoodEntryRow
                  key={entry.id}
                  entry={entry}
                  index={index}
                  nutritionTargetCalories={nutritionTargetCalories}
                  onEdit={onEditFoodEntry}
                  styles={styles}
                />
              ))
            : null}
        </View>
      ) : null}
    </View>
  );
}
