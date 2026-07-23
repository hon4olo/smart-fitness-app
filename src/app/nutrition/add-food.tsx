import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
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
  type DraftItem,
  type PickerMode,
  type RecentItem,
} from '@/features/nutrition/addFoodModel';
import { NutritionAddFoodView } from '@/features/nutrition/components/NutritionAddFoodView';
import { createAddFoodStyles } from '@/features/nutrition/styles/addFoodStyles';
import { useFoodProviderSearch } from '@/features/nutrition/useFoodProviderSearch';
import {
  buildFoodEntryFromCatalog,
  formatCompactMacroTotals,
  formatFoodServing,
  formatNumber,
  searchFoodCatalog,
  sumNutritionTotals,
} from '@/lib/nutrition';
import { useAppTheme } from '@/theme/AppThemeProvider';
import type { FoodCatalogItem, MealTemplate, MealType } from '@/types';

export default function NutritionAddFoodScreen() {
  const { colors } = useAppTheme();
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
  const selectedDate =
    typeof params.date === 'string' && params.date.length > 0
      ? params.date
      : new Date().toISOString().slice(0, 10);
  const selectedMeal: MealType =
    params.meal === 'lunch' || params.meal === 'dinner' || params.meal === 'snack'
      ? params.meal
      : 'breakfast';
  const entryId =
    typeof params.entryId === 'string' && params.entryId.length > 0
      ? params.entryId
      : undefined;

  const selectedDateEntries = useMemo(
    () => foodEntries.filter((entry) => entry.date === selectedDate),
    [foodEntries, selectedDate],
  );
  const selectedMealEntries = useMemo(
    () => selectedDateEntries.filter((entry) => entry.mealType === selectedMeal),
    [selectedDateEntries, selectedMeal],
  );
  const selectedMealTotals = useMemo(
    () => sumNutritionTotals(selectedMealEntries),
    [selectedMealEntries],
  );
  const recentItems = useMemo(() => buildRecentFoodItems(foodEntries), [foodEntries]);
  const recentCatalogIds = useMemo(
    () => recentItems.map((item) => item.catalogFood?.id).filter(Boolean) as string[],
    [recentItems],
  );
  const favoriteSeedIds = useMemo(() => recentCatalogIds.slice(0, 6), [recentCatalogIds]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
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
  const [scannerOpen, setScannerOpen] = useState(false);
  const {
    backendFoodResults,
    backendFoodSearchStatus,
    foodSuggestions,
    setFoodSuggestions,
  } = useFoodProviderSearch(mode, query);

  const editingEntry = useMemo(
    () => foodEntries.find((entry) => entry.id === entryId),
    [entryId, foodEntries],
  );
  const defaultCatalogResults = useMemo(
    () =>
      searchFoodCatalog(foodCatalog, query, {
        favoriteIds: favoriteIds.length > 0 ? favoriteIds : favoriteSeedIds,
        recentIds: recentCatalogIds,
      }),
    [favoriteIds, favoriteSeedIds, query, recentCatalogIds],
  );
  const favoriteFoods = useMemo(
    () =>
      foodCatalog.filter(
        (food) => favoriteIds.includes(food.id) || favoriteSeedIds.includes(food.id),
      ),
    [favoriteIds, favoriteSeedIds],
  );
  const searchResults = useMemo(
    () => (mode === 'food' ? defaultCatalogResults.slice(0, 18) : []),
    [defaultCatalogResults, mode],
  );
  const selectedMealLabel = mealTypeLabels[selectedMeal];
  const selectedDateLabel = formatScreenDate(selectedDate);
  const selectedMealCountLabel = `${selectedMealEntries.length} item${
    selectedMealEntries.length === 1 ? '' : 's'
  }`;
  const selectedDraftSubmitLabel = selectedDraft?.originalEntryId
    ? 'Save changes'
    : `Add to ${selectedMealLabel}`;
  const selectedDraftServingLabel = selectedDraft
    ? formatFoodServing({
        servingSize: selectedDraft.servingSize,
        servingUnit: selectedDraft.servingUnit,
      })
    : '';
  const selectedDraftAttributionLabel =
    selectedDraft && (selectedDraft.attribution || selectedDraft.source === 'fatsecret')
      ? selectedDraft.source === 'fatsecret'
        ? 'Food data provided by FatSecret'
        : selectedDraft.attribution?.text ??
          `Source: ${formatProviderLabel(selectedDraft.source)}`
      : undefined;

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

  const returnToDiary = () =>
    router.replace({
      pathname: '/nutrition',
      params: { date: selectedDate, openMeal: selectedMeal },
    });

  const openDraftFromCatalog = (food: FoodCatalogItem, quantity = food.servingSize) =>
    setSelectedDraft(createDraftFromCatalogFood(food, quantity));

  const openDraftFromFoodItem = (food: FoodItem) =>
    setSelectedDraft(createDraftFromFoodItem(food));

  const quickAddFoodItem = (food: FoodItem) => {
    const draft = createDraftFromFoodItem(food);
    const entry = buildFoodEntryFromDraft({
      createdAt: new Date().toISOString(),
      date: selectedDate,
      draft,
      mealType: selectedMeal,
    });
    if (!entry) return;
    addFoodEntry({ ...entry, id: `${draft.externalId ?? draft.name}-${Date.now()}` });
    setMessage(`Added ${draft.name} to ${selectedMealLabel}`);
  };

  const quickAddCatalogFood = (food: FoodCatalogItem, servings = 1) => {
    addFoodEntry(
      buildFoodEntryFromCatalog(food, { date: selectedDate, mealType: selectedMeal, servings }),
    );
    setMessage(`Added ${food.name} to ${selectedMealLabel}`);
  };

  const quickAddRecent = (item: RecentItem) => {
    if (item.catalogFood) {
      const servings =
        (item.entry.quantity ?? item.entry.servingSize ?? item.catalogFood.servingSize) /
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

  const openDraftFromRecent = (item: RecentItem) =>
    item.catalogFood
      ? openDraftFromCatalog(
          item.catalogFood,
          item.entry.quantity ?? item.catalogFood.servingSize,
        )
      : setSelectedDraft(createDraftFromFoodEntry(item.entry));

  const quickAddMealTemplate = (template: MealTemplate) => {
    addFoodEntries(
      template.items.map((entry) => ({
        ...entry,
        id: `${entry.id}-${Date.now()}`,
        date: selectedDate,
        mealType: selectedMeal,
        createdAt: new Date().toISOString(),
      })),
    );
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

    if (selectedDraft.originalEntryId) {
      updateFoodEntry(selectedDraft.originalEntryId, nextEntry);
      setMessage(`Saved ${selectedDraft.name} to ${selectedMealLabel}`);
    } else {
      addFoodEntry(nextEntry);
      setMessage(`Added ${selectedDraft.name} to ${selectedMealLabel}`);
    }
    setSelectedDraft(null);
    returnToDiary();
  };

  const deleteSelectedDraft = () => {
    if (!selectedDraft?.originalEntryId) return;
    deleteFoodEntry(selectedDraft.originalEntryId);
    setSelectedDraft(null);
    returnToDiary();
  };

  const saveCustomFood = () => {
    if (!isMeaningfulFoodText(foodName)) {
      setMessage('Enter a food name.');
      return;
    }
    const entry = buildCustomFoodEntry({
      date: selectedDate,
      mealType: selectedMeal,
      values: {
        brand: foodBrand,
        calories: foodCalories,
        carbs: foodCarbs,
        fats: foodFats,
        name: foodName,
        protein: foodProtein,
        quantity: foodQuantity,
        servingSize: foodServingSize,
        servingUnit: foodServingUnit,
      },
    });
    addFoodEntry(entry);
    setMessage(`Added ${entry.name} to ${selectedMealLabel}`);
    setCreateFoodOpen(false);
    setFoodName('');
    setFoodBrand('');
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
    addMealTemplate({
      id: `${mealTemplateName.trim()}-${Date.now()}`,
      name: mealTemplateName.trim(),
      items: selectedMealEntries.map((entry) => ({ ...entry })),
      createdAt: new Date().toISOString(),
    });
    setMessage(`Saved ${mealTemplateName.trim()}`);
    setCreateMealOpen(false);
    setMealTemplateName('');
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
        brand: { value: foodBrand, setValue: setFoodBrand },
        calories: { value: foodCalories, setValue: setFoodCalories },
        carbs: { value: foodCarbs, setValue: setFoodCarbs },
        fats: { value: foodFats, setValue: setFoodFats },
        name: { value: foodName, setValue: setFoodName },
        protein: { value: foodProtein, setValue: setFoodProtein },
        quantity: { value: foodQuantity, setValue: setFoodQuantity },
        servingSize: { value: foodServingSize, setValue: setFoodServingSize },
        servingUnit: { value: foodServingUnit, setValue: setFoodServingUnit },
      }}
      favoriteFoods={favoriteFoods}
      favoriteIds={favoriteIds}
      favoriteSeedIds={favoriteSeedIds}
      foodSuggestions={foodSuggestions}
      macroSummaryLabel={formatCompactMacroTotals(selectedMealTotals)}
      manageMealsOpen={manageMealsOpen}
      mealTemplateName={mealTemplateName}
      mealTemplates={mealTemplates}
      message={message}
      mode={mode}
      onBack={() => router.back()}
      onChangeDraftQuantity={(value) =>
        setSelectedDraft((current) => (current ? { ...current, quantity: value } : current))
      }
      onClearQuery={() => {
        setQuery('');
        setFoodSuggestions([]);
      }}
      onCloseDraft={() => setSelectedDraft(null)}
      onCloseScanner={() => setScannerOpen(false)}
      onDeleteDraft={deleteSelectedDraft}
      onDeleteMealTemplate={deleteMealTemplate}
      onFoodFound={(food) => {
        setScannerOpen(false);
        setSelectedDraft(createDraftFromFoodItem(food));
      }}
      onModeChange={setMode}
      onOpenCatalogFood={openDraftFromCatalog}
      onOpenFoodItem={openDraftFromFoodItem}
      onOpenRecentFood={openDraftFromRecent}
      onOpenScanner={() => setScannerOpen(true)}
      onQuickAddCatalogFood={quickAddCatalogFood}
      onQuickAddFoodItem={quickAddFoodItem}
      onQuickAddMealTemplate={quickAddMealTemplate}
      onQuickAddRecent={quickAddRecent}
      onSaveCustomFood={saveCustomFood}
      onSaveDraft={saveDraft}
      onSaveMealTemplate={saveMealTemplateFromDiary}
      onSearchByName={() => {
        setScannerOpen(false);
        setMode('food');
      }}
      onSelectSuggestion={(suggestion) => {
        setQuery(suggestion);
        setFoodSuggestions([]);
      }}
      onToggleCreateFood={() => setCreateFoodOpen((current) => !current)}
      onToggleCreateMeal={() => setCreateMealOpen((current) => !current)}
      onToggleFavorite={(foodId) =>
        setFavoriteIds((current) =>
          current.includes(foodId)
            ? current.filter((item) => item !== foodId)
            : [foodId, ...current],
        )
      }
      onToggleManageMeals={() => setManageMealsOpen((current) => !current)}
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
      selectedMealCaloriesLabel={`${formatNumber(selectedMealTotals.calories)} kcal`}
      selectedMealCountLabel={selectedMealCountLabel}
      selectedMealLabel={selectedMealLabel}
      setMealTemplateName={setMealTemplateName}
      setQuery={setQuery}
      styles={styles}
      topInset={insets.top}
    />
  );
}
