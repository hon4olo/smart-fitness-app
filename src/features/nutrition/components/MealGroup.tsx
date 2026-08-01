import { Pressable, Text, View } from 'react-native';

import { sumNutritionTotals } from '@/lib';
import { formatNumber as formatNutritionNumber } from '@/lib/nutrition';
import { useLocalization } from '@/localization';
import type { getNutritionDiaryCopy } from '@/localization/nutritionDiaryCopy';
import type { FoodEntry, MealType } from '@/types';
import { formatEnergyValue, type EnergyUnit } from '@/units';

import { FoodEntryRow } from './FoodEntryRow';
import { NutritionSummaryGrid } from './NutritionSummaryGrid';

type MealGroupProps = {
  copy: ReturnType<typeof getNutritionDiaryCopy>;
  energyUnit: EnergyUnit;
  entries: FoodEntry[];
  expanded: boolean;
  mealIcon: string;
  mealLabel: string;
  mealType: MealType;
  nutritionTargetCalories: number;
  onEditFoodEntry: (entry: FoodEntry) => void;
  onOpenMealPicker: (mealType: MealType) => void;
  onToggleMealExpansion: (mealType: MealType) => void;
  renderEntries?: boolean;
  styles: Record<string, any>;
  subtotal: ReturnType<typeof sumNutritionTotals>;
};

export function MealGroup({
  copy,
  energyUnit,
  entries,
  expanded,
  mealIcon,
  mealLabel,
  mealType,
  nutritionTargetCalories,
  onEditFoodEntry,
  onOpenMealPicker,
  onToggleMealExpansion,
  renderEntries = true,
  styles,
  subtotal,
}: MealGroupProps) {
  const { formatNumber } = useLocalization();
  const itemCount = entries.length;
  const itemCountLabel = copy.itemCount(
    itemCount,
    formatNumber(itemCount, { maximumFractionDigits: 0 }),
  );
  const mealTargetPercent =
    nutritionTargetCalories > 0
      ? Math.round((subtotal.calories / nutritionTargetCalories) * 100)
      : 0;
  const mealTargetPercentLabel = nutritionTargetCalories > 0 ? `${mealTargetPercent}%` : '--';

  return (
    <View style={styles.mealGroup}>
      <Pressable
        accessibilityLabel={copy.mealAccessibility(mealLabel)}
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
              {itemCountLabel}
            </Text>
          </View>
        </View>

        <View style={styles.mealHeaderActions}>
          <Pressable
            accessibilityLabel={copy.addFoodToMeal(mealLabel)}
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
            fats: formatNutritionNumber(subtotal.fats),
            carbs: formatNutritionNumber(subtotal.carbs),
            protein: formatNutritionNumber(subtotal.protein),
            target: mealTargetPercentLabel,
            calories: formatEnergyValue(subtotal.calories, energyUnit),
          }}
        />
      </View>

      {expanded && renderEntries ? (
        <View style={styles.foodList}>
          {entries.map((entry, index) => (
            <FoodEntryRow
              key={entry.id}
              copy={copy}
              energyUnit={energyUnit}
              entry={entry}
              index={index}
              nutritionTargetCalories={nutritionTargetCalories}
              onEdit={onEditFoodEntry}
              styles={styles}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
