import { Pressable, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { ListRow } from '@/components/ui/ListRow';
import type { NutritionLibraryFood } from '@/features/nutrition/nutritionFoodLibrary';
import { formatFoodMacros, formatFoodServing, formatNumber } from '@/lib/nutrition';
import type { FoodCatalogItem } from '@/types';

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
  const hasFoods = foods.length > 0 || libraryFoods.length > 0;

  return (
    <AppCard>
      <View style={styles.sectionHeader}>
        <Text selectable style={styles.sectionTitle}>Favorites &amp; my foods</Text>
      </View>
      {hasFoods ? (
        <View style={styles.listGap}>
          {libraryFoods.map((food) => (
            <ListRow
              key={food.libraryId}
              accessibilityHint="Tap to set a portion before adding"
              badge={food.kind === 'custom' ? 'My food' : 'Favorite'}
              detail={`${formatNumber(food.servingSize)} ${food.servingUnit} · ${formatNumber(food.protein)}P · ${formatNumber(food.carbs)}C · ${formatNumber(food.fats)}F`}
              onPress={() => onOpenLibraryFood(food)}
              title={food.name}
              trailing={
                <View style={styles.rowActions}>
                  <Pressable
                    accessibilityLabel={`Remove ${food.name} from food library`}
                    hitSlop={10}
                    onPress={() => onRemoveLibraryFood(food.libraryId)}
                    style={styles.iconButton}>
                    <Text style={styles.iconButtonText}>★</Text>
                  </Pressable>
                  <Pressable
                    accessibilityLabel={`Quick add ${food.name} to ${selectedMealLabel}`}
                    hitSlop={10}
                    onPress={() => onQuickAddLibraryFood(food)}
                    style={styles.iconButton}>
                    <Text style={styles.iconButtonText}>+</Text>
                  </Pressable>
                </View>
              }
              value={`${formatNumber(food.calories)} kcal`}
            />
          ))}

          {foods.map((food) => (
            <ListRow
              key={food.id}
              accessibilityHint="Tap to set a portion before adding"
              detail={`${formatFoodServing(food)} · ${formatFoodMacros(food)}`}
              onPress={() => onOpenFood(food)}
              title={food.name}
              trailing={
                <View style={styles.rowActions}>
                  <Pressable
                    accessibilityLabel={`Remove ${food.name} from favorites`}
                    hitSlop={10}
                    onPress={() => onToggleFavorite(food.id)}
                    style={styles.iconButton}>
                    <Text style={styles.iconButtonText}>★</Text>
                  </Pressable>
                  <Pressable
                    accessibilityLabel={`Quick add ${food.name} to ${selectedMealLabel}`}
                    hitSlop={10}
                    onPress={() => onQuickAdd(food)}
                    style={styles.iconButton}>
                    <Text style={styles.iconButtonText}>+</Text>
                  </Pressable>
                </View>
              }
              value={`${formatNumber(food.calories)} kcal`}
            />
          ))}
        </View>
      ) : (
        <View style={styles.emptyBlock}>
          <Text selectable style={styles.emptyStateText}>
            No favorites or custom foods yet. Add foods with the star button or create your own food.
          </Text>
          <AppButton label="Search food" onPress={onSearchFood} variant="secondary" />
        </View>
      )}
    </AppCard>
  );
}
