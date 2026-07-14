import { StyleSheet, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import type { FoodEntry, MealType } from '@/context/AppContext';
import type { FoodSearchResult } from '@/components/nutrition/nutrition-types';
import { FoodManualEntryForm } from '@/components/nutrition/FoodManualEntryForm';
import { FoodSearchPanel } from '@/components/nutrition/FoodSearchPanel';

type AddFoodFormSectionProps = {
  calories: string;
  carbs: string;
  currentMealTotalLabel: string;
  editingFoodEntry?: FoodEntry;
  fats: string;
  filteredFoods: FoodSearchResult[];
  foodSearchQuery: string;
  isExpanded: boolean;
  isSaveDisabled: boolean;
  isSearchExpanded: boolean;
  mealType: MealType;
  mealTypeLabels: Record<MealType, string>;
  name: string;
  onCaloriesChange: (value: string) => void;
  onCarbsChange: (value: string) => void;
  onCancelEdit: () => void;
  onFatsChange: (value: string) => void;
  onFoodSearchQueryChange: (value: string) => void;
  onMealTypeChange: (value: MealType) => void;
  onNameChange: (value: string) => void;
  onProteinChange: (value: string) => void;
  onQuantityChange: (value: string) => void;
  onSaveFood: () => void;
  onServingSizeChange: (value: string) => void;
  onServingUnitChange: (value: string) => void;
  onToggleExpanded: () => void;
  onUseFood: (food: FoodSearchResult) => void;
  protein: string;
  quantity: string;
  servingSize: string;
  servingUnit: string;
};

export function AddFoodFormSection({
  calories,
  carbs,
  currentMealTotalLabel,
  editingFoodEntry,
  fats,
  filteredFoods,
  foodSearchQuery,
  isExpanded,
  isSaveDisabled,
  isSearchExpanded,
  mealType,
  mealTypeLabels,
  name,
  onCaloriesChange,
  onCarbsChange,
  onCancelEdit,
  onFatsChange,
  onFoodSearchQueryChange,
  onMealTypeChange,
  onNameChange,
  onProteinChange,
  onQuantityChange,
  onSaveFood,
  onServingSizeChange,
  onServingUnitChange,
  onToggleExpanded,
  onUseFood,
  protein,
  quantity,
  servingSize,
  servingUnit,
}: AddFoodFormSectionProps) {
  return (
    <FoodManualEntryForm
      calories={calories}
      currentMealTotalLabel={currentMealTotalLabel}
      editingFoodEntry={editingFoodEntry}
      carbs={carbs}
      fats={fats}
      isExpanded={isExpanded}
      isSaveDisabled={isSaveDisabled}
      mealType={mealType}
      mealTypeLabels={mealTypeLabels}
      name={name}
      onCaloriesChange={onCaloriesChange}
      onCarbsChange={onCarbsChange}
      onCancelEdit={onCancelEdit}
      onFatsChange={onFatsChange}
      onMealTypeChange={onMealTypeChange}
      onNameChange={onNameChange}
      onProteinChange={onProteinChange}
      onQuantityChange={onQuantityChange}
      onSaveFood={onSaveFood}
      onServingSizeChange={onServingSizeChange}
      onServingUnitChange={onServingUnitChange}
      onToggleExpanded={onToggleExpanded}
      protein={protein}
      quantity={quantity}
      servingSize={servingSize}
      servingUnit={servingUnit}
    >
      {isSearchExpanded ? (
        <View style={styles.searchPanel}>
          <FoodSearchPanel
            filteredFoods={filteredFoods}
            foodSearchQuery={foodSearchQuery}
            onFoodSearchQueryChange={onFoodSearchQueryChange}
            onUseFood={onUseFood}
          />
        </View>
      ) : null}
    </FoodManualEntryForm>
  );
}

const styles = StyleSheet.create({
  searchPanel: {
    borderColor: Colors.dark.border,
    borderTopWidth: 1,
    gap: Spacing.two,
    marginBottom: Spacing.two,
    paddingTop: Spacing.two,
  },
});
