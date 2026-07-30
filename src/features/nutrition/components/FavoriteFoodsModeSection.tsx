import { Pressable, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { ListRow } from '@/components/ui/ListRow';
import type { NutritionLibraryFood } from '@/features/nutrition/nutritionFoodLibrary';
import { formatFoodMacros, formatFoodServing, formatNumber } from '@/lib/nutrition';
import { useLocalization } from '@/localization';
import { getNutritionAddFoodCopy } from '@/localization/nutritionAddFoodCopy';
import type { FoodCatalogItem } from '@/types';
import { formatEnergyValue, useUnitPreferences } from '@/units';

type FavoriteFoodsModeSectionProps = {
  foods: FoodCatalogItem[];
  libraryFoods: NutritionLibraryFood[];
  onOpenFood: (food: FoodCatalogItem) => void;
  onOpenLibraryFood: (food: NutritionLibraryFood) => void;
  onQuickAdd: (food: FoodCatalogItem) => void;
  onQuickAddLibraryFood: (food: NutritionLibraryFood) => void;
  onRemoveLibraryFood: (libraryId: string) => void;
  onSearchFood: () => void;
  onToggleFavorite: (foodId: string) => void;
  selectedMealLabel: string;
  styles: Record<string, any>;
};

export function FavoriteFoodsModeSection({
  foods,
  libraryFoods,
  onOpenFood,
  onOpenLibraryFood,
  onQuickAdd,
  onQuickAddLibraryFood,
  onRemoveLibraryFood,
  onSearchFood,
  onToggleFavorite,
  selectedMealLabel,
  styles,
}: FavoriteFoodsModeSectionProps) {
  const { energy } = useUnitPreferences();
  const { locale } = useLocalization();
  const copy = getNutritionAddFoodCopy(locale);
  const hasFoods = foods.length > 0 || libraryFoods.length > 0;

  return (
    <AppCard>
      <View style={styles.sectionHeader}>
        <Text selectable style={styles.sectionTitle}>{copy.favoritesTitle}</Text>
      </View>
      {hasFoods ? (
        <View style={styles.listGap}>
          {libraryFoods.map((food) => (
            <ListRow
              key={food.libraryId}
              accessibilityHint={copy.tapToSetPortion}
              badge={food.kind === 'custom' ? copy.myFood : copy.favorite}
              detail={`${formatNumber(food.servingSize)} ${food.servingUnit} · ${formatNumber(food.protein)}P · ${formatNumber(food.carbs)}C · ${formatNumber(food.fats)}F`}
              onPress={() => onOpenLibraryFood(food)}
              title={food.name}
              trailing={
                <View style={styles.rowActions}>
                  <Pressable
                    accessibilityLabel={copy.removeFromLibrary(food.name)}
                    hitSlop={10}
                    onPress={() => onRemoveLibraryFood(food.libraryId)}
                    style={styles.iconButton}>
                    <Text style={styles.iconButtonText}>★</Text>
                  </Pressable>
                  <Pressable
                    accessibilityLabel={copy.quickAdd(food.name, selectedMealLabel)}
                    hitSlop={10}
                    onPress={() => onQuickAddLibraryFood(food)}
                    style={styles.iconButton}>
                    <Text style={styles.iconButtonText}>+</Text>
                  </Pressable>
                </View>
              }
              value={`${formatEnergyValue(food.calories, energy)} ${energy}`}
            />
          ))}

          {foods.map((food) => (
            <ListRow
              key={food.id}
              accessibilityHint={copy.tapToSetPortion}
              detail={`${formatFoodServing(food)} · ${formatFoodMacros(food)}`}
              onPress={() => onOpenFood(food)}
              title={food.name}
              trailing={
                <View style={styles.rowActions}>
                  <Pressable
                    accessibilityLabel={copy.removeFavorite(food.name)}
                    hitSlop={10}
                    onPress={() => onToggleFavorite(food.id)}
                    style={styles.iconButton}>
                    <Text style={styles.iconButtonText}>★</Text>
                  </Pressable>
                  <Pressable
                    accessibilityLabel={copy.quickAdd(food.name, selectedMealLabel)}
                    hitSlop={10}
                    onPress={() => onQuickAdd(food)}
                    style={styles.iconButton}>
                    <Text style={styles.iconButtonText}>+</Text>
                  </Pressable>
                </View>
              }
              value={`${formatEnergyValue(food.calories, energy)} ${energy}`}
            />
          ))}
        </View>
      ) : (
        <View style={styles.emptyBlock}>
          <Text selectable style={styles.emptyStateText}>
            {copy.noFavorites}
          </Text>
          <AppButton label={copy.searchFood} onPress={onSearchFood} variant="secondary" />
        </View>
      )}
    </AppCard>
  );
}
