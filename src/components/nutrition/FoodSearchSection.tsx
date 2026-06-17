import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing } from '@/constants/theme';
import type { FoodEntry } from '@/context/AppContext';

type FoodSearchResult = {
  brandName?: string;
  calories: number;
  carbs: number;
  fats: number;
  name: string;
  protein: number;
  servingSize?: number;
  servingUnit?: string;
  source: FoodEntry['source'];
};

type FoodSearchSectionProps = {
  filteredFoods: FoodSearchResult[];
  foodSearchQuery: string;
  isExpanded: boolean;
  onFoodSearchQueryChange: (value: string) => void;
  onToggleExpanded: () => void;
  onUseFood: (food: FoodSearchResult) => void;
};

export function FoodSearchSection({
  filteredFoods,
  foodSearchQuery,
  isExpanded,
  onFoodSearchQueryChange,
  onToggleExpanded,
  onUseFood,
}: FoodSearchSectionProps) {
  return (
    <AppCard>
      <Pressable onPress={onToggleExpanded} style={styles.collapsibleHeader}>
        <Text selectable style={styles.sectionTitle}>
          {`Search Food ${isExpanded ? '−' : '+'}`}
        </Text>
      </Pressable>

      {isExpanded ? (
        <>
          <View style={styles.inputGroup}>
            <TextInput
              onChangeText={onFoodSearchQueryChange}
              placeholder="Search food database"
              placeholderTextColor={Colors.dark.textSecondary}
              style={styles.input}
              value={foodSearchQuery}
            />
          </View>

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
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  collapsibleHeader: {
    paddingBottom: Spacing.two,
  },
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
  input: {
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: 1,
    color: Colors.dark.text,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: Spacing.two,
  },
  inputGroup: {
    gap: Spacing.one,
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
  sectionTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '800',
  },
});
