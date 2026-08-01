import type { ReactElement } from 'react';
import { SectionList, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import type { getNutritionDiaryCopy } from '@/localization/nutritionDiaryCopy';
import type { FoodEntry, MealType } from '@/types';
import type { EnergyUnit } from '@/units';

import { FoodEntryRow } from './FoodEntryRow';
import { MealGroup } from './MealGroup';

type MealSection = {
  mealType: MealType;
  entries: FoodEntry[];
  subtotal: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  data: FoodEntry[];
};

type Props = {
  copy: ReturnType<typeof getNutritionDiaryCopy>;
  energyUnit: EnergyUnit;
  expandedMeals: MealType[];
  footer: ReactElement | null;
  header: ReactElement;
  insetsBottom: number;
  mealIcons: Record<MealType, string>;
  nutritionTargetCalories: number;
  onEditFoodEntry: (entry: FoodEntry) => void;
  onOpenMealPicker: (mealType: MealType) => void;
  onToggleMealExpansion: (mealType: MealType) => void;
  sections: MealSection[];
  styles: Record<string, any>;
};

export function NutritionDiaryList({
  copy,
  energyUnit,
  expandedMeals,
  footer,
  header,
  insetsBottom,
  mealIcons,
  nutritionTargetCalories,
  onEditFoodEntry,
  onOpenMealPicker,
  onToggleMealExpansion,
  sections,
  styles,
}: Props) {
  return (
    <SectionList
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[styles.content, { paddingBottom: insetsBottom + Spacing.six }]}
      keyboardShouldPersistTaps="handled"
      keyExtractor={(entry) => entry.id}
      ListFooterComponent={footer}
      ListHeaderComponent={header}
      renderItem={({ item, index }) => (
        <View style={styles.foodList}>
          <FoodEntryRow
            copy={copy}
            energyUnit={energyUnit}
            entry={item}
            index={index}
            nutritionTargetCalories={nutritionTargetCalories}
            onEdit={onEditFoodEntry}
            styles={styles}
          />
        </View>
      )}
      renderSectionHeader={({ section }) => {
        const expanded = expandedMeals.includes(section.mealType);
        return (
          <MealGroup
            copy={copy}
            energyUnit={energyUnit}
            entries={section.entries}
            expanded={expanded}
            mealIcon={mealIcons[section.mealType]}
            mealLabel={copy.mealLabels[section.mealType]}
            mealType={section.mealType}
            nutritionTargetCalories={nutritionTargetCalories}
            onEditFoodEntry={onEditFoodEntry}
            onOpenMealPicker={onOpenMealPicker}
            onToggleMealExpansion={onToggleMealExpansion}
            renderEntries={false}
            styles={styles}
            subtotal={section.subtotal}
          />
        );
      }}
      sections={sections}
      showsVerticalScrollIndicator={false}
      stickySectionHeadersEnabled={false}
      style={styles.screen}
    />
  );
}
