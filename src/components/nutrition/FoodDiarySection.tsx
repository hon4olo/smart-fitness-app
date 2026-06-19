import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing } from '@/constants/theme';
import type { FoodEntry, MealType } from '@/context/AppContext';
import { formatMacroTotals } from '@/lib';

type FoodDiaryMeal = {
  entries: FoodEntry[];
  subtotal: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  type: MealType;
};

type FoodDiarySectionProps = {
  entriesByMeal: FoodDiaryMeal[];
  formatServingInfo: (entry: FoodEntry) => string;
  mealTypeLabels: Record<MealType, string>;
  onAddFoodToMeal: (mealType: MealType) => void;
  onDeleteFoodEntry: (entryId: string) => void;
  onEditFoodEntry: (entry: FoodEntry) => void;
};

export function FoodDiarySection({
  entriesByMeal,
  formatServingInfo,
  mealTypeLabels,
  onAddFoodToMeal,
  onDeleteFoodEntry,
  onEditFoodEntry,
}: FoodDiarySectionProps) {
  return (
    <AppCard>
      <Text selectable style={styles.sectionTitle}>
        Meal diary
      </Text>
      {entriesByMeal.map(({ entries, subtotal, type }) => {
        if (entries.length === 0) {
          return null;
        }

        return (
          <View key={type} style={styles.mealGroup}>
            <View style={styles.mealHeader}>
              <View style={styles.mealHeaderContent}>
                <Text selectable style={styles.mealTitle}>
                  {mealTypeLabels[type]}
                </Text>
                <Text selectable style={styles.mealSubtotal}>
                  {formatMacroTotals(subtotal)}
                </Text>
              </View>
              <AppButton label="Add food" onPress={() => onAddFoodToMeal(type)} variant="secondary" />
            </View>
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
                <AppButton label="Edit" onPress={() => onEditFoodEntry(entry)} variant="secondary" />
                <AppButton label="Delete" onPress={() => onDeleteFoodEntry(entry.id)} variant="secondary" />
              </View>
            ))}
          </View>
        );
      })}
    </AppCard>
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
  mealGroup: {
    gap: Spacing.two,
    paddingTop: Spacing.two,
  },
  mealHeader: {
    alignItems: 'center',
    borderColor: Colors.dark.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
  },
  mealHeaderContent: {
    flex: 1,
    gap: Spacing.one,
  },
  mealSubtotal: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  mealTitle: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '800',
  },
  sectionTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '800',
  },
});