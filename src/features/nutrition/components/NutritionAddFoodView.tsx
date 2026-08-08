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
  CustomFoodValidationErrors,
  DraftItem,
  PickerMode,
  RecentItem,
} from '@/features/nutrition/addFoodModel';
import type { NutritionLibraryFood } from '@/features/nutrition/nutritionFoodLibrary';
import type { createAddFoodStyles } from '@/features/nutrition/styles/addFoodStyles';
import type { FoodProviderSearchStatus } from '@/features/nutrition/useFoodProviderSearch';
import { useLocalization } from '@/localization';
import { getNutritionAddFoodCopy } from '@/localization/nutritionAddFoodCopy';
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
  customFoodErrors: CustomFoodValidationErrors;
  favoriteFoods: FoodCatalogItem[];
  favoriteIds: string[];
  foodSuggestions: string[];
  libraryFoods: NutritionLibraryFood[];
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
  onOpenLibraryFood(food: NutritionLibraryFood): void;
  onOpenRecentFood(item: RecentItem): void;
  onOpenScanner(): void;
  onQuickAddCatalogFood(food: FoodCatalogItem, servings?: number): void;
  onQuickAddFoodItem(food: FoodItem): void;
  onQuickAddLibraryFood(food: NutritionLibraryFood): void;
  onQuickAddMealTemplate(template: MealTemplate): void;
  onQuickAddRecent(item: RecentItem): void;
  onRemoveLibraryFood(libraryId: string): void;
  onRenameMealTemplate(templateId: string, name: string): void;
  onReplaceMealTemplateItems(templateId: string, name: string): void;
  onSaveCustomFood(): void;
  onSaveDraft(): void;
  onSaveMealTemplate(): void;
  onSearchByName(): void;
  onSelectSuggestion(suggestion: string): void;
  onToggleCreateFood(): void;
  onToggleCreateMeal(): void;
  onToggleFavorite(foodId: string): void;
  onToggleManageMeals(): void;
  onToggleProviderFavorite(food: FoodItem): void;
  providerFavoriteIds: string[];
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

export function NutritionAddFoodView(props: NutritionAddFoodViewProps) {
  const { locale } = useLocalization();
  const copy = getNutritionAddFoodCopy(locale);
  const {
    backendFoodResults,
    backendFoodSearchStatus,
    bottomInset,
    colors,
    createFoodOpen,
    createMealOpen,
    customFood,
    customFoodErrors,
    favoriteFoods,
    favoriteIds,
    foodSuggestions,
    libraryFoods,
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
    onOpenLibraryFood,
    onOpenRecentFood,
    onOpenScanner,
    onQuickAddCatalogFood,
    onQuickAddFoodItem,
    onQuickAddLibraryFood,
    onQuickAddMealTemplate,
    onQuickAddRecent,
    onRemoveLibraryFood,
    onRenameMealTemplate,
    onReplaceMealTemplateItems,
    onSaveCustomFood,
    onSaveDraft,
    onSaveMealTemplate,
    onSearchByName,
    onSelectSuggestion,
    onToggleCreateFood,
    onToggleCreateMeal,
    onToggleFavorite,
    onToggleManageMeals,
    onToggleProviderFavorite,
    providerFavoriteIds,
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
  } = props;

  const formatProviderLabel = (provider: FoodItem['source']['provider']) =>
    copy.providerLabels[provider] ?? provider;
  const getFoodAttributionLabel = (food: Pick<FoodItem, 'attribution' | 'source'>) =>
    food.source.provider === 'fatsecret'
      ? copy.fatSecretAttribution
      : food.attribution?.text ?? copy.source(formatProviderLabel(food.source.provider));

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}>
      <ScrollView
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottomInset + Spacing.six, paddingTop: topInset + Spacing.three },
        ]}
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <Pressable
              accessibilityLabel={copy.cancel}
              hitSlop={10}
              onPress={onBack}
              style={styles.backButton}>
              <Text style={styles.backButtonText}>{copy.cancel}</Text>
            </Pressable>
            <View style={styles.headerCopy}>
              <Text selectable style={styles.title}>{selectedMealLabel}</Text>
              <Text selectable style={styles.subtitle}>{selectedDateLabel}</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>

          <SegmentedControl
            accessibilityLabel={copy.pickerMode}
            onChange={onModeChange}
            options={[
              { label: copy.modes.food, value: 'food' },
              { label: copy.modes.recent, value: 'recent' },
              { label: copy.modes.favorites, value: 'favorites' },
              { label: copy.modes.meals, value: 'meals' },
            ]}
            value={mode}
          />

          <View style={styles.summaryPill}>
            <View style={styles.summaryCopyBlock}>
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
              foodSuggestions={foodSuggestions}
              formatProviderLabel={formatProviderLabel}
              getFoodAttributionLabel={getFoodAttributionLabel}
              onClearQuery={onClearQuery}
              onOpenCatalogFood={onOpenCatalogFood}
              onOpenFoodItem={onOpenFoodItem}
              onOpenScanner={onOpenScanner}
              onQuickAddCatalogFood={onQuickAddCatalogFood}
              onQuickAddFoodItem={onQuickAddFoodItem}
              onSelectSuggestion={onSelectSuggestion}
              onToggleFavorite={onToggleFavorite}
              onToggleProviderFavorite={onToggleProviderFavorite}
              providerFavoriteIds={providerFavoriteIds}
              query={query}
              searchResults={searchResults}
              selectedMealLabel={selectedMealLabel}
              setQuery={setQuery}
              styles={styles}
            />
          ) : null}

          {mode === 'recent' ? (
            <RecentFoodsModeSection
              colors={colors}
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
              colors={colors}
              foods={favoriteFoods}
              libraryFoods={libraryFoods}
              onOpenFood={onOpenCatalogFood}
              onOpenLibraryFood={onOpenLibraryFood}
              onQuickAdd={onQuickAddCatalogFood}
              onQuickAddLibraryFood={onQuickAddLibraryFood}
              onRemoveLibraryFood={onRemoveLibraryFood}
              onSearchFood={() => onModeChange('food')}
              onToggleFavorite={onToggleFavorite}
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
              onRenameMealTemplate={onRenameMealTemplate}
              onReplaceMealTemplateItems={onReplaceMealTemplateItems}
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
              accessibilityLabel={copy.createFood}
              hitSlop={10}
              onPress={onToggleCreateFood}
              style={styles.quietActionButton}>
              <Text style={styles.quietActionText}>
                {createFoodOpen ? copy.hideCreateFood : copy.createFood}
              </Text>
            </Pressable>
            <Pressable
              accessibilityLabel={copy.goToMeals}
              hitSlop={10}
              onPress={() => onModeChange('meals')}
              style={styles.quietActionButton}>
              <Text style={styles.quietActionText}>{copy.createMeal}</Text>
            </Pressable>
          </View>

          {createFoodOpen ? (
            <CreateFoodInlineForm
              colors={colors}
              errors={customFoodErrors}
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
          deleteLabel={copy.deleteEntry}
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