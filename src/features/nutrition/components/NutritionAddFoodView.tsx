import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import type { FoodItem } from '@/api/foods';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Colors, Spacing } from '@/constants/theme';
import type {
  DraftItem,
  PickerMode,
  RecentItem,
} from '@/features/nutrition/addFoodModel';
import type { createAddFoodStyles } from '@/features/nutrition/styles/addFoodStyles';
import type { FoodProviderSearchStatus } from '@/features/nutrition/useFoodProviderSearch';
import type { FoodCatalogItem, MealTemplate } from '@/types';

import { BarcodeScannerModal } from './BarcodeScannerModal';
import { CreateFoodInlineForm } from './CreateFoodInlineForm';
import { FavoriteFoodsModeSection } from './FavoriteFoodsModeSection';
import { FoodPortionSheet } from './FoodPortionSheet';
import { FoodSearchModeSection } from './FoodSearchModeSection';
import { RecentFoodsModeSection } from './RecentFoodsModeSection';
import { SavedMealsModeSection } from './SavedMealsModeSection';

type AddFoodStyles = ReturnType<typeof createAddFoodStyles>;

type TextFieldProps = {
  value: string;
  setValue(value: string): void;
};

export type NutritionAddFoodViewProps = {
  backendFoodResults: FoodItem[];
  backendFoodSearchStatus: FoodProviderSearchStatus;
  bottomInset: number;
  colors: typeof Colors.light;
  createFoodOpen: boolean;
  createMealOpen: boolean;
  customFood: {
    brand: TextFieldProps;
    calories: TextFieldProps;
    carbs: TextFieldProps;
    fats: TextFieldProps;
    name: TextFieldProps;
    protein: TextFieldProps;
    quantity: TextFieldProps;
    servingSize: TextFieldProps;
    servingUnit: TextFieldProps;
  };
  favoriteFoods: FoodCatalogItem[];
  favoriteIds: string[];
  favoriteSeedIds: string[];
  foodSuggestions: string[];
  macroSummaryLabel: string;
  manageMealsOpen: boolean;
  mealTemplateName: string;
  mealTemplates: MealTemplate[];
  message: string;
  mode: PickerMode;
  onBack(): void;
  onChangeDraftQuantity(value: string): void;
  onClearQuery(): void;
  onCloseDraft(): void;
  onCloseScanner(): void;
  onDeleteDraft(): void;
  onDeleteMealTemplate(templateId: string): void;
  onFoodFound(food: FoodItem): void;
  onModeChange(mode: PickerMode): void;
  onOpenCatalogFood(food: FoodCatalogItem, quantity?: number): void;
  onOpenFoodItem(food: FoodItem): void;
  onOpenRecentFood(item: RecentItem): void;
  onOpenScanner(): void;
  onQuickAddCatalogFood(food: FoodCatalogItem, servings?: number): void;
  onQuickAddFoodItem(food: FoodItem): void;
  onQuickAddMealTemplate(template: MealTemplate): void;
  onQuickAddRecent(item: RecentItem): void;
  onSaveCustomFood(): void;
  onSaveDraft(): void;
  onSaveMealTemplate(): void;
  onSearchByName(): void;
  onSelectSuggestion(suggestion: string): void;
  onToggleCreateFood(): void;
  onToggleCreateMeal(): void;
  onToggleFavorite(foodId: string): void;
  onToggleManageMeals(): void;
  query: string;
  recentItems: RecentItem[];
  scannerOpen: boolean;
  searchResults: FoodCatalogItem[];
  selectedDateLabel: string;
  selectedDraft: DraftItem | null;
  selectedDraftAttributionLabel?: string;
  selectedDraftMacroTotalsLabel: string;
  selectedDraftServingLabel: string;
  selectedDraftSubmitLabel: string;
  selectedMealCaloriesLabel: string;
  selectedMealCountLabel: string;
  selectedMealLabel: string;
  setMealTemplateName(value: string): void;
  setQuery(value: string): void;
  styles: AddFoodStyles;
  topInset: number;
};

export function NutritionAddFoodView({
  backendFoodResults,
  backendFoodSearchStatus,
  bottomInset,
  colors,
  createFoodOpen,
  createMealOpen,
  customFood,
  favoriteFoods,
  favoriteIds,
  favoriteSeedIds,
  foodSuggestions,
  macroSummaryLabel,
  manageMealsOpen,
  mealTemplateName,
  mealTemplates,
  message,
  mode,
  onBack,
  onChangeDraftQuantity,
  onClearQuery,
  onCloseDraft,
  onCloseScanner,
  onDeleteDraft,
  onDeleteMealTemplate,
  onFoodFound,
  onModeChange,
  onOpenCatalogFood,
  onOpenFoodItem,
  onOpenRecentFood,
  onOpenScanner,
  onQuickAddCatalogFood,
  onQuickAddFoodItem,
  onQuickAddMealTemplate,
  onQuickAddRecent,
  onSaveCustomFood,
  onSaveDraft,
  onSaveMealTemplate,
  onSearchByName,
  onSelectSuggestion,
  onToggleCreateFood,
  onToggleCreateMeal,
  onToggleFavorite,
  onToggleManageMeals,
  query,
  recentItems,
  scannerOpen,
  searchResults,
  selectedDateLabel,
  selectedDraft,
  selectedDraftAttributionLabel,
  selectedDraftMacroTotalsLabel,
  selectedDraftServingLabel,
  selectedDraftSubmitLabel,
  selectedMealCaloriesLabel,
  selectedMealCountLabel,
  selectedMealLabel,
  setMealTemplateName,
  setQuery,
  styles,
  topInset,
}: NutritionAddFoodViewProps) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: bottomInset + Spacing.six,
            paddingTop: topInset + Spacing.three,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <Pressable
              accessibilityLabel="Cancel"
              hitSlop={10}
              onPress={onBack}
              style={styles.backButton}>
              <Text style={styles.backButtonText}>Cancel</Text>
            </Pressable>
            <View style={styles.headerCopy}>
              <Text selectable style={styles.title}>{selectedMealLabel}</Text>
              <Text selectable style={styles.subtitle}>{selectedDateLabel}</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>

          <SegmentedControl
            accessibilityLabel="Food picker mode"
            onChange={onModeChange}
            options={[
              { label: 'Food', value: 'food' },
              { label: 'Recent', value: 'recent' },
              { label: 'Favorites', value: 'favorites' },
              { label: 'Meals', value: 'meals' },
            ]}
            value={mode}
          />

          <View style={styles.summaryPill}>
            <View>
              <Text selectable style={styles.summaryTitle}>{selectedMealCountLabel}</Text>
              <Text selectable style={styles.summaryCopy}>{macroSummaryLabel}</Text>
            </View>
            <Text selectable style={styles.summaryCalories}>{selectedMealCaloriesLabel}</Text>
          </View>

          {message ? (
            <View style={styles.messageBanner}>
              <Text selectable style={styles.messageText}>{message}</Text>
            </View>
          ) : null}

          {mode === 'food' ? (
            <FoodSearchModeSection
              backendFoodResults={backendFoodResults}
              backendFoodSearchStatus={backendFoodSearchStatus}
              colors={colors}
              favoriteIds={favoriteIds}
              favoriteSeedIds={favoriteSeedIds}
              formatProviderLabel={(provider) =>
                provider === 'fatsecret'
                  ? 'FatSecret'
                  : provider === 'openfoodfacts'
                    ? 'OpenFoodFacts'
                    : provider === 'custom'
                      ? 'Custom'
                      : 'Local'
              }
              foodSuggestions={foodSuggestions}
              getFoodAttributionLabel={(food) =>
                food.source.provider === 'fatsecret'
                  ? 'Food data provided by FatSecret'
                  : food.attribution?.text ?? `Source: ${food.source.provider}`
              }
              onClearQuery={onClearQuery}
              onOpenCatalogFood={onOpenCatalogFood}
              onOpenFoodItem={onOpenFoodItem}
              onOpenScanner={onOpenScanner}
              onQuickAddCatalogFood={onQuickAddCatalogFood}
              onQuickAddFoodItem={onQuickAddFoodItem}
              onSelectSuggestion={onSelectSuggestion}
              onToggleFavorite={onToggleFavorite}
              query={query}
              searchResults={searchResults}
              selectedMealLabel={selectedMealLabel}
              setQuery={setQuery}
              styles={styles}
            />
          ) : null}

          {mode === 'recent' ? (
            <RecentFoodsModeSection
              items={recentItems}
              onOpenFood={onOpenRecentFood}
              onQuickAdd={onQuickAddRecent}
              onSearchFood={() => onModeChange('food')}
              selectedMealLabel={selectedMealLabel}
              styles={styles}
            />
          ) : null}

          {mode === 'favorites' ? (
            <FavoriteFoodsModeSection
              foods={favoriteFoods}
              onOpenFood={onOpenCatalogFood}
              onQuickAdd={onQuickAddCatalogFood}
              onSearchFood={() => onModeChange('food')}
              selectedMealLabel={selectedMealLabel}
              styles={styles}
            />
          ) : null}

          {mode === 'meals' ? (
            <SavedMealsModeSection
              colors={colors}
              createMealOpen={createMealOpen}
              manageMealsOpen={manageMealsOpen}
              mealTemplateName={mealTemplateName}
              mealTemplates={mealTemplates}
              onDeleteMealTemplate={onDeleteMealTemplate}
              onQuickAddMealTemplate={onQuickAddMealTemplate}
              onSaveMealTemplate={onSaveMealTemplate}
              onToggleCreateMeal={onToggleCreateMeal}
              onToggleManageMeals={onToggleManageMeals}
              selectedMealLabel={selectedMealLabel}
              setMealTemplateName={setMealTemplateName}
              styles={styles}
            />
          ) : null}

          <View style={styles.quietActionRow}>
            <Pressable
              accessibilityLabel="Create food"
              hitSlop={10}
              onPress={onToggleCreateFood}
              style={styles.quietActionButton}>
              <Text style={styles.quietActionText}>
                {createFoodOpen ? 'Hide create food' : 'Create food'}
              </Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Go to meals mode"
              hitSlop={10}
              onPress={() => onModeChange('meals')}
              style={styles.quietActionButton}>
              <Text style={styles.quietActionText}>Create meal</Text>
            </Pressable>
          </View>

          {createFoodOpen ? (
            <CreateFoodInlineForm
              colors={colors}
              foodBrand={customFood.brand.value}
              foodCalories={customFood.calories.value}
              foodCarbs={customFood.carbs.value}
              foodFats={customFood.fats.value}
              foodName={customFood.name.value}
              foodProtein={customFood.protein.value}
              foodQuantity={customFood.quantity.value}
              foodServingSize={customFood.servingSize.value}
              foodServingUnit={customFood.servingUnit.value}
              onSave={onSaveCustomFood}
              setFoodBrand={customFood.brand.setValue}
              setFoodCalories={customFood.calories.setValue}
              setFoodCarbs={customFood.carbs.setValue}
              setFoodFats={customFood.fats.setValue}
              setFoodName={customFood.name.setValue}
              setFoodProtein={customFood.protein.setValue}
              setFoodQuantity={customFood.quantity.setValue}
              setFoodServingSize={customFood.servingSize.setValue}
              setFoodServingUnit={customFood.servingUnit.setValue}
              styles={styles}
            />
          ) : null}
        </View>
      </ScrollView>

      {selectedDraft ? (
        <FoodPortionSheet
          attributionLabel={selectedDraftAttributionLabel}
          colors={colors}
          deleteLabel="Delete entry"
          draft={selectedDraft}
          insetsBottom={bottomInset}
          macroTotalsLabel={selectedDraftMacroTotalsLabel}
          onChangeQuantity={onChangeDraftQuantity}
          onClose={onCloseDraft}
          onDelete={onDeleteDraft}
          onSave={onSaveDraft}
          selectedDateLabel={selectedDateLabel}
          selectedMealLabel={selectedMealLabel}
          servingLabel={selectedDraftServingLabel}
          submitLabel={selectedDraftSubmitLabel}
          styles={styles}
        />
      ) : null}

      <BarcodeScannerModal
        colors={colors}
        onClose={onCloseScanner}
        onFoodFound={onFoodFound}
        onSearchByName={onSearchByName}
        styles={styles}
        visible={scannerOpen}
      />
    </KeyboardAvoidingView>
  );
}
