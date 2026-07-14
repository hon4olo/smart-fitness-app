import { StyleSheet, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import type { FoodCatalogItem, FoodBrowserMode, FoodCategory, FoodEntry, MealType } from '@/types';

import { FoodManualEntryForm } from '@/components/nutrition/FoodManualEntryForm';
import { FoodBrowserSection } from '@/components/nutrition/FoodBrowserSection';

type FilterChip = {
  count?: number;
  label: string;
  selected: boolean;
  onPress: () => void;
};

type AddFoodFormSectionProps = {
  calories: string;
  carbs: string;
  categoryChips: FilterChip[];
  currentMealTotalLabel: string;
  editingFoodEntry?: FoodEntry;
  favoriteFoods: FoodCatalogItem[];
  favoriteIds: string[];
  fats: string;
  filteredFoods: FoodCatalogItem[];
  foodSearchQuery: string;
  isExpanded: boolean;
  isBrowserExpanded: boolean;
  isSaveDisabled: boolean;
  isSearchExpanded: boolean;
  mealType: MealType;
  mealTypeLabels: Record<MealType, string>;
  modeChips: FilterChip[];
  name: string;
  onCaloriesChange: (value: string) => void;
  onCarbsChange: (value: string) => void;
  onCancelEdit: () => void;
  onCategoryChange: (value: FoodCategory | 'all') => void;
  onFatsChange: (value: string) => void;
  onFoodSearchQueryChange: (value: string) => void;
  onMealTypeChange: (value: MealType) => void;
  onModeChange: (value: FoodBrowserMode) => void;
  onNameChange: (value: string) => void;
  onOpenFood: (food: FoodCatalogItem) => void;
  onQuickAddFood: (food: FoodCatalogItem, servings?: number) => void;
  onProteinChange: (value: string) => void;
  onQuantityChange: (value: string) => void;
  onSaveFood: () => void;
  onServingSizeChange: (value: string) => void;
  onServingUnitChange: (value: string) => void;
  onToggleBrowserExpanded: () => void;
  onToggleExpanded: () => void;
  onToggleFavorite: (food: FoodCatalogItem) => void;
  popularFoods: FoodCatalogItem[];
  recentFoods: FoodCatalogItem[];
  selectedCategory: FoodCategory | 'all';
  selectedMode: FoodBrowserMode;
  protein: string;
  quantity: string;
  servingSize: string;
  servingUnit: string;
};

export function AddFoodFormSection({
  calories,
  carbs,
  categoryChips,
  currentMealTotalLabel,
  editingFoodEntry,
  favoriteFoods,
  favoriteIds,
  fats,
  filteredFoods,
  foodSearchQuery,
  isBrowserExpanded,
  isExpanded,
  isSaveDisabled,
  isSearchExpanded,
  mealType,
  mealTypeLabels,
  modeChips,
  name,
  onCaloriesChange,
  onCarbsChange,
  onCancelEdit,
  onCategoryChange,
  onFatsChange,
  onFoodSearchQueryChange,
  onMealTypeChange,
  onModeChange,
  onNameChange,
  onOpenFood,
  onQuickAddFood,
  onProteinChange,
  onQuantityChange,
  onSaveFood,
  onServingSizeChange,
  onServingUnitChange,
  onToggleBrowserExpanded,
  onToggleExpanded,
  onToggleFavorite,
  popularFoods,
  recentFoods,
  selectedCategory,
  selectedMode,
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
      servingUnit={servingUnit}>
      {isSearchExpanded ? (
        <View style={styles.searchPanel}>
          <FoodBrowserSection
            categoryChips={categoryChips}
            favoriteFoods={favoriteFoods}
            favoriteIds={favoriteIds}
            filteredFoods={filteredFoods}
            foodSearchQuery={foodSearchQuery}
            isExpanded={isBrowserExpanded}
            modeChips={modeChips}
            onOpenFood={onOpenFood}
            onQuickAddFood={onQuickAddFood}
            onSearchQueryChange={onFoodSearchQueryChange}
            onToggleExpanded={onToggleBrowserExpanded}
            onToggleFavorite={onToggleFavorite}
            popularFoods={popularFoods}
            recentFoods={recentFoods}
            selectedCategory={selectedCategory}
            selectedMode={selectedMode}
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
