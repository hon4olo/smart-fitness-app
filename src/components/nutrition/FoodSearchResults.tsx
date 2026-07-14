import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { Colors, Spacing } from '@/constants/theme';
import type { FoodSearchResult } from '@/components/nutrition/nutrition-types';

type FoodSearchResultsProps = {
  filteredFoods: FoodSearchResult[];
  onUseFood: (food: FoodSearchResult) => void;
};

export function FoodSearchResults({ filteredFoods, onUseFood }: FoodSearchResultsProps) {
  return (
    <>
      {filteredFoods.map((food) => (
        <View key={`${food.name}-${food.servingUnit}`} style={styles.searchResult}>
          <View style={styles.searchResultContent}>
            <Text selectable style={styles.foodName}>
              {food.name}
            </Text>
            {food.brandName ? (
              <Text selectable style={styles.foodBrand}>
                {food.brandName}
              </Text>
            ) : null}
            <Text selectable style={styles.foodMeta}>
              {food.calories} kcal / {food.protein} g protein / {food.carbs} g carbs / {food.fats} g fats
            </Text>
            <Text selectable style={styles.foodServing}>
              Serving: {[food.servingSize, food.servingUnit].filter(Boolean).join(' ')}
            </Text>
          </View>
          <AppButton label="Use" onPress={() => onUseFood(food)} variant="secondary" />
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  foodBrand: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  foodMeta: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
    lineHeight: 20,
  },
  foodName: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
    width: '100%',
  },
  foodServing: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  searchResult: {
    borderColor: Colors.dark.border,
    borderTopWidth: 1,
    gap: Spacing.two,
    paddingTop: Spacing.three,
  },
  searchResultContent: {
    gap: Spacing.one,
  },
});
