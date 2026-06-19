import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing } from '@/constants/theme';
import type { MealType } from '@/context/AppContext';
import { formatMacroTotals } from '@/lib';

type MealMenuItem = {
  entries: { id: string }[];
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
  mealTypeLabels: Record<MealType, string>;
  onAddFoodToMeal: (mealType: MealType) => void;
  selectedMealType: MealType;
};

export function MealMenuCard({ entriesByMeal, mealTypeLabels, onAddFoodToMeal, selectedMealType }: MealMenuCardProps) {
  return (
    <AppCard>
      <Text selectable style={styles.title}>
        Meal menu
      </Text>
      <Text selectable style={styles.helperText}>
        Tap a meal to add food directly there. Macros are shown for each meal below.
      </Text>

      <View style={styles.list}>
        {entriesByMeal.map(({ entries, subtotal, type }) => {
          const isSelected = selectedMealType === type;

          return (
            <Pressable key={type} style={[styles.row, isSelected && styles.rowSelected]} onPress={() => onAddFoodToMeal(type)}>
              <View style={styles.rowContent}>
                <View style={styles.rowHeader}>
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
              <AppButton label={isSelected ? 'Selected' : 'Add food'} onPress={() => onAddFoodToMeal(type)} variant={isSelected ? 'primary' : 'secondary'} />
            </Pressable>
          );
        })}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
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
    alignItems: 'center',
    borderColor: Colors.dark.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
    padding: Spacing.two,
  },
  rowContent: {
    flex: 1,
    gap: Spacing.one,
  },
  rowHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  rowSelected: {
    backgroundColor: Colors.dark.backgroundSelected,
    borderColor: Colors.dark.accent,
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