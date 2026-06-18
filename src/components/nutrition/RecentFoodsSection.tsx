import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing } from '@/constants/theme';
import type { FoodEntry } from '@/context/AppContext';

type RecentFoodsSectionProps = {
  formatServingInfo: (entry: {
    servingSize?: number;
    servingUnit?: string;
    quantity?: number;
    baseCalories?: number;
    baseProtein?: number;
    baseCarbs?: number;
    baseFats?: number;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    source: FoodEntry['source'];
  }) => string;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onUseRecentFood: (food: FoodEntry) => void;
  recentFoods: FoodEntry[];
};

export function RecentFoodsSection({ formatServingInfo, isExpanded, onToggleExpanded, onUseRecentFood, recentFoods }: RecentFoodsSectionProps) {
  return (
    <AppCard>
      <Pressable onPress={onToggleExpanded} style={styles.collapsibleHeader}>
        <Text selectable style={styles.sectionTitle}>
          {`Recent foods ${isExpanded ? '−' : '+'}`}
        </Text>
      </Pressable>

      {isExpanded ? (
        <>
          <Text selectable style={styles.helperText}>
            Reuse something you logged earlier.
          </Text>
          {recentFoods.length > 0 ? (
            recentFoods.map((food) => (
              <View
                key={`${food.name}-${food.brandName ?? ''}-${food.source}-${food.externalId ?? ''}`}
                style={styles.searchResult}>
                <View style={styles.searchResultContent}>
                  <Text selectable style={styles.foodName}>
                    {food.name}
                  </Text>
                  {food.brandName ? (
                    <Text selectable style={styles.foodBrand}>
                      {food.brandName}
                    </Text>
                  ) : null}
                  {formatServingInfo(food) ? (
                    <Text selectable style={styles.foodServing}>
                      Serving: {formatServingInfo(food)}
                    </Text>
                  ) : null}
                  <Text selectable style={styles.foodMeta}>
                    {food.calories} kcal / {food.protein} g protein / {food.carbs} g carbs /{' '}
                    {food.fats} g fats
                  </Text>
                </View>
                <AppButton label="Use" onPress={() => onUseRecentFood(food)} variant="secondary" />
              </View>
            ))
          ) : (
            <Text selectable style={styles.remainingValue}>
              No recent foods yet.
            </Text>
          )}
        </>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  collapsibleHeader: {
    paddingBottom: Spacing.two,
  },
  helperText: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: Spacing.two,
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
  remainingValue: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    width: '100%',
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