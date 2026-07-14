import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing } from '@/constants/theme';
import type { FoodEntry, MealType } from '@/context/AppContext';
import { formatCompactMacroTotals, formatNumber } from '@/lib/nutrition';

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
  onToggleExpandedMeal,
  selectedMealType,
}: MealMenuCardProps) {
  return (
    <AppCard>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text selectable style={styles.title}>
            Meal diary
          </Text>
          <Text selectable style={styles.subtitle}>
            Breakfast, lunch, dinner, and snacks with quick add actions.
          </Text>
        </View>
      </View>

      <View style={styles.list}>
        {entriesByMeal.map(({ entries, subtotal, type }) => {
          const isSelected = selectedMealType === type;
          const isExpanded = expandedMealType === type;
          const subtotalLabel = entries.length > 0 ? formatCompactMacroTotals(subtotal) : 'No food logged yet';

          return (
            <View key={type} style={[styles.mealCard, isSelected && styles.mealCardSelected]}>
              <View style={styles.mealCardHeader}>
                <Pressable onPress={() => onToggleExpandedMeal(type)} style={styles.mealHeaderPressable}>
                  <View style={styles.mealHeaderCopy}>
                    <View style={styles.mealTitleRow}>
                      <Text selectable style={styles.mealTitle}>
                        {mealTypeLabels[type]}
                      </Text>
                      <Text selectable style={styles.mealCount}>
                        {entries.length === 0 ? 'No food yet' : `${entries.length} item${entries.length === 1 ? '' : 's'}`}
                      </Text>
                    </View>
                    <Text selectable style={styles.mealSubtotal}>
                      {subtotalLabel}
                    </Text>
                  </View>
                </Pressable>

                <View style={styles.mealHeaderActions}>
                  <AppButton label="Add Food" onPress={() => onAddFoodToMeal(type)} variant={isSelected ? 'primary' : 'secondary'} />
                  <Text selectable style={styles.chevron}>
                    {isExpanded ? '−' : '+'}
                  </Text>
                </View>
              </View>

              {isExpanded ? (
                <View style={styles.mealContent}>
                  {entries.length === 0 ? (
                    <Text selectable style={styles.emptyState}>
                      Nothing logged for {mealTypeLabels[type].toLowerCase()} yet.
                    </Text>
                  ) : (
                    <View style={styles.entriesList}>
                      {entries.map((entry) => (
                        <View key={entry.id} style={styles.foodRow}>
                          <View style={styles.foodCopy}>
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
                              {formatNumber(entry.calories)} kcal · {formatNumber(entry.protein)}P · {formatNumber(entry.carbs)}C ·{' '}
                              {formatNumber(entry.fats)}F
                            </Text>
                          </View>
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
  entryActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  foodBrand: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  foodCopy: {
    gap: 2,
  },
  foodMeta: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    lineHeight: 18,
  },
  foodName: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 21,
  },
  foodRow: {
    borderColor: Colors.dark.border,
    borderTopWidth: 1,
    gap: Spacing.two,
    paddingTop: Spacing.three,
  },
  foodServing: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  header: {
    gap: 2,
  },
  headerCopy: {
    gap: 2,
  },
  list: {
    gap: Spacing.two,
  },
  mealCard: {
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 12,
    borderWidth: 1,
    gap: Spacing.two,
    padding: Spacing.two,
  },
  mealCardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  mealCardSelected: {
    borderColor: Colors.dark.accent,
  },
  mealContent: {
    borderColor: Colors.dark.border,
    borderTopWidth: 1,
    gap: Spacing.two,
    paddingTop: Spacing.two,
  },
  mealCount: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  mealHeaderActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
  },
  mealHeaderCopy: {
    flex: 1,
    gap: 2,
  },
  mealHeaderPressable: {
    flex: 1,
  },
  mealSubtotal: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  mealTitle: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '800',
  },
  mealTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  subtitle: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '800',
  },
});
