import { Pressable, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { ListRow } from '@/components/ui/ListRow';
import { formatFoodMacros, formatFoodServing, formatNumber } from '@/lib/nutrition';
import type { FoodCatalogItem } from '@/types';

type FavoriteFoodsModeSectionProps = {
  foods: FoodCatalogItem[];
  onOpenFood: (food: FoodCatalogItem) => void;
  onQuickAdd: (food: FoodCatalogItem) => void;
  onSearchFood: () => void;
  selectedMealLabel: string;
  styles: Record<string, any>;
};

export function FavoriteFoodsModeSection({ foods, onOpenFood, onQuickAdd, onSearchFood, selectedMealLabel, styles }: FavoriteFoodsModeSectionProps) {
  return (
    <AppCard>
      <View style={styles.sectionHeader}>
        <Text selectable style={styles.sectionTitle}>
          Favorites
        </Text>
      </View>
      {foods.length > 0 ? (
        <View style={styles.listGap}>
          {foods.map((food) => (
            <ListRow
              key={food.id}
              accessibilityHint="Tap to set a portion before adding"
              detail={`${formatFoodServing(food)} · ${formatFoodMacros(food)}`}
              onPress={() => onOpenFood(food)}
              title={food.name}
              trailing={
                <Pressable accessibilityLabel={`Quick add ${food.name} to ${selectedMealLabel}`} hitSlop={10} onPress={() => onQuickAdd(food)} style={styles.iconButton}>
                  <Text style={styles.iconButtonText}>+</Text>
                </Pressable>
              }
              value={`${formatNumber(food.calories)} kcal`}
            />
          ))}
        </View>
      ) : (
        <View style={styles.emptyBlock}>
          <Text selectable style={styles.emptyStateText}>
            No favorites yet.
          </Text>
          <AppButton label="Search food" onPress={onSearchFood} variant="secondary" />
        </View>
      )}
    </AppCard>
  );
}
