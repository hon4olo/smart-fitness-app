import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { FoodItem } from '@/api/foods';
import { useAppContext } from '@/context/AppContext';
import { foodCatalog } from '@/data/foods';
import {
  buildCustomFoodEntry,
  buildDraftMacroTotalsLabel,
  buildFoodEntryFromDraft,
  buildRecentFoodItems,
  createDraftFromCatalogFood,
  createDraftFromFoodEntry,
  createDraftFromFoodItem,
  formatProviderLabel,
  formatScreenDate,
  isMeaningfulFoodText,
  mealTypeLabels,
  validateCustomFoodValues,
  type CustomFoodValidationErrors,
  type CustomFoodValues,
  type DraftItem,
  type PickerMode,
  type RecentItem,
} from '@/features/nutrition/addFoodModel';
import { NutritionAddFoodView } from '@/features/nutrition/components/NutritionAddFoodView';
import type { NutritionLibraryFood } from '@/features/nutrition/nutritionFoodLibrary';
import { createAddFoodStyles } from '@/features/nutrition/styles/addFoodStyles';
import { useFoodProviderSearch } from '@/features/nutrition/useFoodProviderSearch';
import { useNutritionFavoriteFoods } from '@/features/nutrition/useNutritionFavoriteFoods';
import { useNutritionFoodLibrary } from '@/features/nutrition/useNutritionFoodLibrary';
import { formatLocalDate } from '@/lib';
import {
  buildFoodEntryFromCatalog,
  formatCompactMacroTotals,
  formatFoodServing,
  searchFoodCatalog,
  sumNutritionTotals,
} from '@/lib/nutrition';
import { useAppTheme } from '@/theme/AppThemeProvider';
import type { FoodCatalogItem, MealTemplate, MealType } from '@/types';
import {
  displayEnergyInputToKcal,
  formatEnergyInputValue,
  formatEnergyValue,
  useUnitPreferences,
} from '@/units';

export default function NutritionAddFoodScreen() {
  const { colors } = useAppTheme();
  const { energy: energyUnit } = useUnitPreferences();
  const styles = useMemo(() => createAddFoodStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const {
    addFoodEntries,
    addFoodEntry,
    addMealTemplate,
    deleteFoodEntry,
    deleteMealTemplate,
    foodEntries,
    mealTemplates,
    updateFoodEntry,
  } = useAppContext();
  const params = useLocalSearchParams<{ date?: string; entryId?: string; meal?: MealType }>();
  const selectedDate = typeof params.date === 'string' && params.date.length > 0
    ? params.date
    : formatLocalDate(new Date());
  const selectedMeal: MealType = params.meal === 'lunch' || params.meal === 'dinner' || params.meal === 'snack'
    ? params.meal
    : 'breakfast';
  const entryId = typeof params.entryId === 'string' && params.entryId.length > 0 ? params.entryId : undefined;
  const selectedDateEntries = useMemo(
    () => foodEntries.filter((entry) => entry.date === selectedDate),
    [foodEntries, selectedDate],
  );
  const selectedMealEntries = useMemo(
    () => selectedDateEntries.filter((entry) => entry.mealType === selectedMeal),
    [selectedDateEntries, selectedMeal],
  );
  const selectedMealTotals = useMemo(() => sumNutritionTotals(selectedMealEntries), [selectedMealEntries]);
  const recentItems = useMemo(() => buildRecentFoodItems(foodEntries), [foodEntries]);
  const recentCatalogIds = useMemo(
    () => recentItems.map((item) => item.catalogFood?.id).filter(Boolean) as string[],
    [recentItems],
  );
  const { error: favoritesError, favoriteIds, toggleFavorite } = useNutritionFavoriteFoods();
  const {
    error: libraryError,
    foods: libraryFoods,
    providerFavorites,
    removeFood: removeLibraryFood,
    saveCustomFood: saveCustomFoodToLibrary,
    toggleProviderFavorite,
  } = useNutritionFoodLibrary();
  const [mode, setMode] = useState<PickerMode>(recentItems.length > 0 ? 'recent' : 'food');
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [selectedDraft, setSelectedDraft] = useState<DraftItem | null>(null);
  const [createFoodOpen, setCreateFoodOpen] = useState(false);
  const [createMealOpen, setCreateMealOpen] = useState(false);
  const [manageMealsOpen, setManageMealsOpen] = useState(false);
  const [mealTemplateName, setMealTemplateName] = useState('');
  const [foodName, setFoodName] = useState('');
  const [foodBrand, setFoodBrand] = useState('');
  const [foodServingSize, setFoodServingSize] = useState('100');
  const [foodServingUnit, setFoodServingUnit] = useState('g');
  const [foodQuantity, setFoodQuantity] = useState('100');
  const [foodCalories, setFoodCalories] = useState('0');
  const [foodProtein, setFoodProtein] = useState('0');
  const [foodCarbs, setFoodCarbs] = useState('0');
  const [foodFats, setFoodFats] = useState('0');
  const [customFoodErrors, setCustomFoodErrors] = useState<CustomFoodValidationErrors>({});
  const [scannerOpen, setScannerOpen] = useState(false);
  const previousEnergyUnitRef = useRef(energyUnit);
  const { backendFoodResults, backendFoodSearchStatus, foodSuggestions, setFoodSuggestions } =
    useFoodProviderSearch(mode, query);
  const editingEntry = useMemo(() => foodEntries.find((entry) => entry.id === entryId), [entryId, foodEntries]);
  const defaultCatalogResults = useMemo(
    () => searchFoodCatalog(foodCatalog, query, { favoriteIds, recentIds: recentCatalogIds }),
    [favoriteIds, query, recentCatalogIds],
  );
  const favoriteFoods = useMemo(
    () => foodCatalog.filter((food) => favoriteIds.includes(food.id)),
    [favoriteIds],
  );
  const searchResults = useMemo(
    () => (mode === 'food' ? defaultCatalogResults.slice(0, 18) : []),
    [defaultCatalogResults, mode],
  );
  const selectedMealLabel = mealTypeLabels[selectedMeal];
  const selectedDateLabel = formatScreenDate(selectedDate);
  const selectedMealCountLabel = `${selectedMealEntries.length} item${selectedMealEntries.length === 1 ? '' : 's'}`;
  const selectedDraftSubmitLabel = selectedDraft?.originalEntryId ? 'Save changes' : `Add to ${selectedMealLabel}`;
  const selectedDraftServingLabel = selectedDraft
    ? formatFoodServing({ servingSize: selectedDraft.servingSize, servingUnit: selectedDraft.servingUnit })
    : '';
  const selectedDraftAttributionLabel = selectedDraft && (selectedDraft.attribution || selectedDraft.source === 'fatsecret')
    ? selectedDraft.source === 'fatsecret'
      ? 'Food data provided by FatSecret'
      : selectedDraft.attribution?.text ?? `Source: ${formatProviderLabel(selectedDraft.source)}`
    : undefined;

  useEffect(() => {
    const previousEnergyUnit = previousEnergyUnitRef.current;
    previousEnergyUnitRef.current = energyUnit;
    if (previousEnergyUnit === energyUnit) return;

    setFoodCalories((current) => {
      if (!current.trim()) return current;
      const canonicalCalories = displayEnergyInputToKcal(current, previousEnergyUnit);
      const parsedCanonicalCalories = Number(canonicalCalories);
      return Number.isFinite(parsedCanonicalCalories)
        ? formatEnergyInputValue(parsedCanonicalCalories, energyUnit)
        : current;
    });
  }, [energyUnit]);

  useEffect(() => {
    if (editingEntry) {
      setSelectedDraft(createDraftFromFoodEntry(editingEntry));
      return;
    }
    if (params.entryId) {
      setMessage('');
      setSelectedDraft(null);
    }
  }, [editingEntry, params.entryId]);
  useEffect(() => {
    if (mode === 'recent' && recentItems.length === 0) setMode('food');
  }, [mode, recentItems.length]);
  useEffect(() => {
    if (favoritesError || libraryError) setMessage(favoritesError ?? libraryError ?? '');
  }, [favoritesError, libraryError]);

  const returnToDiary = () => router.replace({
    pathname: '/nutrition',
    params: { date: selectedDate, openMeal: selectedMeal },
  });
  const openDraftFromCatalog = (food: FoodCatalogItem, quantity = food.servingSize) =>
    setSelectedDraft(createDraftFromCatalogFood(food, quantity));
  const openDraftFromFoodItem = (food: FoodItem) => setSelectedDraft(createDraftFromFoodItem(food));
  const openLibraryFood = (food: NutritionLibraryFood) =>
    setSelectedDraft({ ...food, originalEntryId: undefined });
  const quickAddDraft = (draft: DraftItem) => {
    const entry = buildFoodEntryFromDraft({
      createdAt: new Date().toISOString(), date: selectedDate, draft, mealType: selectedMeal,
    });
    if (!entry) return;
    addFoodEntry({ ...entry, id: `${draft.externalId ?? draft.name}-${Date.now()}` });
    setMessage(`Added ${draft.name} to ${selectedMealLabel}`);
  };
  const quickAddFoodItem = (food: FoodItem) => quickAddDraft(createDraftFromFoodItem(food));
  const quickAddLibraryFood = (food: NutritionLibraryFood) => quickAddDraft({ ...food, originalEntryId: undefined });
  const quickAddCatalogFood = (food: FoodCatalogItem, servings = 1) => {
    addFoodEntry(buildFoodEntryFromCatalog(food, { date: selectedDate, mealType: selectedMeal, servings }));
    setMessage(`Added ${food.name} to ${selectedMealLabel}`);
  };
  const quickAddRecent = (item: RecentItem) => {
    if (item.catalogFood) {
      const servings = (item.entry.quantity ?? item.entry.servingSize ?? item.catalogFood.servingSize) /
        item.catalogFood.servingSize;
      quickAddCatalogFood(item.catalogFood, servings > 0 ? servings : 1);
      return;
    }
    addFoodEntry({
      ...item.entry,
      id: `${item.entry.id}-${Date.now()}`,
      date: selectedDate,
      mealType: selectedMeal,
      createdAt: new Date().toISOString(),
    });
    setMessage(`Added ${item.entry.name} to ${selectedMealLabel}`);
  };
  const openDraftFromRecent = (item: RecentItem) => item.catalogFood
    ? openDraftFromCatalog(item.catalogFood, item.entry.quantity ?? item.catalogFood.servingSize)
    : setSelectedDraft(createDraftFromFoodEntry(item.entry));
  const quickAddMealTemplate = (template: MealTemplate) => {
    const createdAt = new Date().toISOString();
    addFoodEntries(template.items.map((entry, index) => ({
      ...entry,
      id: `${entry.id}-${Date.now()}-${index}`,
      date: selectedDate,
      mealType: selectedMeal,
      createdAt,
    })));
    setMessage(`Added ${template.name} to ${selectedMealLabel}`);
  };
  const saveDraft = () => {
    if (!selectedDraft) return;
    const nextEntry = buildFoodEntryFromDraft({
      createdAt: editingEntry?.createdAt ?? new Date().toISOString(),
      date: selectedDate,
      draft: selectedDraft,
      mealType: selectedMeal,
    });
    if (!nextEntry) {
      setMessage('Enter a valid quantity.');
      return;
    }
    if (selectedDraft.originalEntryId) updateFoodEntry(selectedDraft.originalEntryId, nextEntry);
    else addFoodEntry(nextEntry);
    setSelectedDraft(null);
    returnToDiary();
  };
  const deleteSelectedDraft = () => {
    if (!selectedDraft?.originalEntryId) return;
    const entryIdToDelete = selectedDraft.originalEntryId;
    Alert.alert('Delete food entry?', `${selectedDraft.name} will be removed from this meal.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        deleteFoodEntry(entryIdToDelete);
        setSelectedDraft(null);
        returnToDiary();
      } },
    ]);
  };
  const updateCustomFoodField = (setter: (value: string) => void, value: string) => {
    setter(value);
    if (Object.keys(customFoodErrors).length > 0) setCustomFoodErrors({});
  };
  const resetCustomFoodForm = () => {
    setFoodName(''); setFoodBrand(''); setFoodServingSize('100'); setFoodServingUnit('g');
    setFoodQuantity('100'); setFoodCalories('0'); setFoodProtein('0'); setFoodCarbs('0'); setFoodFats('0');
    setCustomFoodErrors({});
  };
  const saveCustomFood = () => {
    const canonicalCalories = displayEnergyInputToKcal(foodCalories, energyUnit);
    const values: CustomFoodValues = {
      brand: foodBrand, calories: canonicalCalories, carbs: foodCarbs, fats: foodFats, name: foodName,
      protein: foodProtein, quantity: foodQuantity, servingSize: foodServingSize, servingUnit: foodServingUnit,
    };
    setCustomFoodErrors(validateCustomFoodValues(values));
    const entry = buildCustomFoodEntry({ date: selectedDate, mealType: selectedMeal, values });
    if (!entry) {
      setMessage('Check the custom food fields.');
      return;
    }
    addFoodEntry(entry);
    saveCustomFoodToLibrary({ ...createDraftFromFoodEntry(entry), originalEntryId: undefined });
    setMessage(`Added ${entry.name} and saved it to My foods`);
    setCreateFoodOpen(false);
    resetCustomFoodForm();
  };
  const saveMealTemplateFromDiary = () => {
    if (!isMeaningfulFoodText(mealTemplateName)) {
      setMessage('Enter a meal name.');
      return;
    }
    if (selectedMealEntries.length === 0) {
      setMessage('No food logged in this meal yet.');
      return;
    }
    const now = new Date().toISOString();
    addMealTemplate({ id: `${mealTemplateName.trim()}-${Date.now()}`, name: mealTemplateName.trim(), items: selectedMealEntries.map((entry) => ({ ...entry })), createdAt: now, updatedAt: now });
    setMessage(`Saved ${mealTemplateName.trim()}`);
    setCreateMealOpen(false);
    setMealTemplateName('');
  };
  const replaceMealTemplate = (templateId: string, name: string, items: MealTemplate['items']) => {
    const existing = mealTemplates.find((template) => template.id === templateId);
    if (!existing || !name.trim()) return;
    deleteMealTemplate(templateId);
    addMealTemplate({ ...existing, name: name.trim(), items: items.map((item) => ({ ...item })), updatedAt: new Date().toISOString() });
    setMessage(`Updated ${name.trim()}`);
  };
  const confirmDeleteMealTemplate = (templateId: string) => {
    const template = mealTemplates.find((item) => item.id === templateId);
    if (!template) return;
    Alert.alert('Delete saved meal?', `${template.name} will no longer be available.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMealTemplate(templateId) },
    ]);
  };

  return (
    <NutritionAddFoodView
      backendFoodResults={backendFoodResults}
      backendFoodSearchStatus={backendFoodSearchStatus}
      bottomInset={insets.bottom}
      colors={colors}
      createFoodOpen={createFoodOpen}
      createMealOpen={createMealOpen}
      customFood={{
        brand: { value: foodBrand, setValue: (value) => updateCustomFoodField(setFoodBrand, value) },
        calories: { value: foodCalories, setValue: (value) => updateCustomFoodField(setFoodCalories, value) },
        carbs: { value: foodCarbs, setValue: (value) => updateCustomFoodField(setFoodCarbs, value) },
        fats: { value: foodFats, setValue: (value) => updateCustomFoodField(setFoodFats, value) },
        name: { value: foodName, setValue: (value) => updateCustomFoodField(setFoodName, value) },
        protein: { value: foodProtein, setValue: (value) => updateCustomFoodField(setFoodProtein, value) },
        quantity: { value: foodQuantity, setValue: (value) => updateCustomFoodField(setFoodQuantity, value) },
        servingSize: { value: foodServingSize, setValue: (value) => updateCustomFoodField(setFoodServingSize, value) },
        servingUnit: { value: foodServingUnit, setValue: (value) => updateCustomFoodField(setFoodServingUnit, value) },
      }}
      customFoodErrors={customFoodErrors}
      favoriteFoods={favoriteFoods}
      favoriteIds={favoriteIds}
      foodSuggestions={foodSuggestions}
      libraryFoods={libraryFoods}
      macroSummaryLabel={formatCompactMacroTotals(selectedMealTotals)}
      manageMealsOpen={manageMealsOpen}
      mealTemplateName={mealTemplateName}
      mealTemplates={mealTemplates}
      message={message}
      mode={mode}
      onBack={() => router.back()}
      onChangeDraftQuantity={(value) => setSelectedDraft((current) => current ? { ...current, quantity: value } : current)}
      onClearQuery={() => { setQuery(''); setFoodSuggestions([]); }}
      onCloseDraft={() => setSelectedDraft(null)}
      onCloseScanner={() => setScannerOpen(false)}
      onDeleteDraft={deleteSelectedDraft}
      onDeleteMealTemplate={confirmDeleteMealTemplate}
      onFoodFound={(food) => { setScannerOpen(false); setSelectedDraft(createDraftFromFoodItem(food)); }}
      onModeChange={setMode}
      onOpenCatalogFood={openDraftFromCatalog}
      onOpenFoodItem={openDraftFromFoodItem}
      onOpenLibraryFood={openLibraryFood}
      onOpenRecentFood={openDraftFromRecent}
      onOpenScanner={() => setScannerOpen(true)}
      onQuickAddCatalogFood={quickAddCatalogFood}
      onQuickAddFoodItem={quickAddFoodItem}
      onQuickAddLibraryFood={quickAddLibraryFood}
      onQuickAddMealTemplate={quickAddMealTemplate}
      onQuickAddRecent={quickAddRecent}
      onRemoveLibraryFood={removeLibraryFood}
      onRenameMealTemplate={(templateId, name) => {
        const existing = mealTemplates.find((template) => template.id === templateId);
        if (existing) replaceMealTemplate(templateId, name, existing.items);
      }}
      onReplaceMealTemplateItems={(templateId, name) => {
        if (selectedMealEntries.length === 0) {
          setMessage(`No food logged in ${selectedMealLabel.toLowerCase()} to replace this meal.`);
          return;
        }
        replaceMealTemplate(templateId, name, selectedMealEntries);
      }}
      onSaveCustomFood={saveCustomFood}
      onSaveDraft={saveDraft}
      onSaveMealTemplate={saveMealTemplateFromDiary}
      onSearchByName={() => { setScannerOpen(false); setMode('food'); }}
      onSelectSuggestion={(suggestion) => { setQuery(suggestion); setFoodSuggestions([]); }}
      onToggleCreateFood={() => { setCreateFoodOpen((current) => !current); setCustomFoodErrors({}); }}
      onToggleCreateMeal={() => setCreateMealOpen((current) => !current)}
      onToggleFavorite={toggleFavorite}
      onToggleManageMeals={() => setManageMealsOpen((current) => !current)}
      onToggleProviderFavorite={(food) => toggleProviderFavorite(createDraftFromFoodItem(food))}
      providerFavoriteIds={providerFavorites.map((food) => food.libraryId)}
      query={query}
      recentItems={recentItems}
      scannerOpen={scannerOpen}
      searchResults={searchResults}
      selectedDateLabel={selectedDateLabel}
      selectedDraft={selectedDraft}
      selectedDraftAttributionLabel={selectedDraftAttributionLabel}
      selectedDraftMacroTotalsLabel={buildDraftMacroTotalsLabel(selectedDraft)}
      selectedDraftServingLabel={selectedDraftServingLabel}
      selectedDraftSubmitLabel={selectedDraftSubmitLabel}
      selectedMealCaloriesLabel={`${formatEnergyValue(selectedMealTotals.calories, energyUnit)} ${energyUnit}`}
      selectedMealCountLabel={selectedMealCountLabel}
      selectedMealLabel={selectedMealLabel}
      setMealTemplateName={setMealTemplateName}
      setQuery={setQuery}
      styles={styles}
      topInset={insets.top}
    />
  );
}
