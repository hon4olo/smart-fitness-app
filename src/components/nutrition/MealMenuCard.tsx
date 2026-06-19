import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing } from '@/constants/theme';
import type { FoodEntry, MealType } from '@/context/AppContext';
import { formatMacroTotals } from '@/lib';

type MealMenuItem = {
  entries: FoodEntry[];
  subtotal: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  type: MealType;
};

type MealMenuCardProps = {
  entriesByMeal: MealMenuItem[];
  expandedMealType: MealType | null;
  formatServingInfo: (entry: FoodEntry) => string;
  mealTypeLabels: Record<MealType, string>;
  onAddFoodToMeal: (mealType: MealType) => void;
  onDeleteFoodEntry: (entryId: string) => void;
  onEditFoodEntry: (entry: FoodEntry) => void;
  onOpenRecentFoods: (mealType: MealType) => void;
  onOpenSavedMeals: (mealType: MealType) => void;
  onToggleExpandedMeal: (mealType: MealType) => void;
  selectedMealType: MealType;
};

export function MealMenuCard({
  entriesByMeal,
  expandedMealType,
  formatServingInfo,
  mealTypeLabels,
  onAddFoodToMeal,
  onDeleteFoodEntry,
  onEditFoodEntry,
  onOpenRecentFoods,
  onOpenSavedMeals,
  onToggleExpandedMeal,
  selectedMealType,
}: MealMenuCardProps) {
  return (
    <AppCard>
      <Text selectable style={styles.title}>
        Meals
      </Text>
      <Text selectable style={styles.helperText}>
        Tap a meal to open Add food, Saved meals, or Recent foods.
      </Text>

      <View style={styles.list}>
        {entriesByMeal.map(({ entries, subtotal, type }) => {
          const isSelected = selectedMealType === type;
          const isExpanded = expandedMealType === type;

          return (
            <View key={type} style={[styles.row, isSelected && styles.rowSelected]}>
              <Pressable onPress={() => onToggleExpandedMeal(type)} style={styles.rowHeaderPressable}>
                <View style={styles.rowHeader}>
                  <View style={styles.rowHeaderContent}>
                    <View style={styles.rowTitleLine}>
                      <Text selectable style={styles.mealTitle}>
                        {mealTypeLabels[type]}
                      </Text>
                      <Text selectable style={styles.mealCount}>
                        {entries.length === 0 ? 'No food yet' : `${entries.length} item${entries.length === 1 ? '' : 's'}`}
                      </Text>
                    </View>
                    <Text selectable style={styles.totals}>
                      {formatMacroTotals(subtotal)}
                    </Text>
                  </View>
                  <Text selectable style={styles.chevron}>
                    {isExpanded ? '−' : '+'}
                  </Text>
                </View>
              </Pressable>

              {isExpanded ? (
                <View style={styles.expandedContent}>
                  <View style={styles.actionRow}>
                    <AppButton label="Add food" onPress={() => onAddFoodToMeal(type)} variant="primary" />
                    <AppButton label="Saved meals" onPress={() => onOpenSavedMeals(type)} variant="secondary" />
                    <AppButton label="Recent foods" onPress={() => onOpenRecentFoods(type)} variant="secondary" />
                  </View>

                  {entries.length === 0 ? (
                    <Text selectable style={styles.emptyState}>
                      No entries yet.
                    </Text>
                  ) : (
                    <View style={styles.entriesList}>
                      {entries.map((entry) => (
                        <View key={entry.id} style={styles.foodRow}>
                          <Text selectable style={styles.foodName}>
                            {entry.name}
                          </Text>
                          {entry.brandName ? (
                            <Text selectable style={styles.foodBrand}>
                              {entry.brandName}
                            </Text>
                          ) : null}
                          {formatServingInfo(entry) ? (
                            <Text selectable style={styles.foodServing}>
                              Serving: {formatServingInfo(entry)}
                            </Text>
                          ) : null}
                          <Text selectable style={styles.foodMeta}>
                            {entry.calories} kcal / {entry.protein} g protein / {entry.carbs} g carbs / {entry.fats} g fats
                          </Text>
                          <View style={styles.entryActions}>
                            <AppButton label="Edit" onPress={() => onEditFoodEntry(entry)} variant="secondary" />
                            <AppButton label="Delete" onPress={() => onDeleteFoodEntry(entry.id)} variant="secondary" />
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chevron: {
    color: Colors.dark.textSecondary,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 18,
  },
  emptyState: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  entriesList: {
    gap: Spacing.two,
  },
  expandedContent: {
    borderColor: Colors.dark.border,
    borderTopWidth: 1,
    gap: Spacing.two,
    paddingTop: Spacing.two,
  },
  entryActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
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
  foodRow: {
    borderColor: Colors.dark.border,
    borderTopWidth: 1,
    gap: Spacing.one,
    paddingTop: Spacing.three,
  },
  foodServing: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  helperText: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: Spacing.two,
  },
  list: {
    gap: Spacing.two,
  },
  mealCount: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  mealTitle: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '800',
  },
  row: {
    borderColor: Colors.dark.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: Spacing.two,
    padding: Spacing.two,
  },
  rowHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  rowHeaderContent: {
    flex: 1,
    gap: Spacing.one,
  },
  rowHeaderPressable: {
    borderRadius: 10,
  },
  rowSelected: {
    backgroundColor: Colors.dark.backgroundSelected,
    borderColor: Colors.dark.accent,
  },
  rowTitleLine: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '800',
  },
  totals: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
});