import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { FoodItem } from '@/api/foods';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Spacing } from '@/constants/theme';
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
  getFoodAttributionLabel,
  isMeaningfulFoodText,
  mealTypeLabels,
  type DraftItem,
  type PickerMode,
  type RecentItem,
} from '@/features/nutrition/addFoodModel';
import { BarcodeScannerModal } from '@/features/nutrition/components/BarcodeScannerModal';
import { CreateFoodInlineForm } from '@/features/nutrition/components/CreateFoodInlineForm';
import { FavoriteFoodsModeSection } from '@/features/nutrition/components/FavoriteFoodsModeSection';
import { FoodPortionSheet } from '@/features/nutrition/components/FoodPortionSheet';
import { FoodSearchModeSection } from '@/features/nutrition/components/FoodSearchModeSection';
import { RecentFoodsModeSection } from '@/features/nutrition/components/RecentFoodsModeSection';
import { SavedMealsModeSection } from '@/features/nutrition/components/SavedMealsModeSection';
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
  const selectedDraftMacroTotalsLabel = buildDraftMacroTotalsLabel(selectedDraft);

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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: insets.bottom + Spacing.six,
            paddingTop: insets.top + Spacing.three,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <Pressable
              accessibilityLabel="Cancel"
              hitSlop={10}
              onPress={() => router.back()}
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
            onChange={setMode}
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
              <Text selectable style={styles.summaryCopy}>
                {formatCompactMacroTotals(selectedMealTotals)}
              </Text>
            </View>
            <Text selectable style={styles.summaryCalories}>
              {formatNumber(selectedMealTotals.calories)} kcal
            </Text>
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
              formatProviderLabel={formatProviderLabel}
              foodSuggestions={foodSuggestions}
              getFoodAttributionLabel={getFoodAttributionLabel}
              onClearQuery={() => {
                setQuery('');
                setFoodSuggestions([]);
              }}
              onOpenCatalogFood={openDraftFromCatalog}
              onOpenFoodItem={openDraftFromFoodItem}
              onOpenScanner={() => setScannerOpen(true)}
              onQuickAddCatalogFood={quickAddCatalogFood}
              onQuickAddFoodItem={quickAddFoodItem}
              onSelectSuggestion={(suggestion) => {
                setQuery(suggestion);
                setFoodSuggestions([]);
              }}
              onToggleFavorite={(foodId) =>
                setFavoriteIds((current) =>
                  current.includes(foodId)
                    ? current.filter((item) => item !== foodId)
                    : [foodId, ...current],
                )
              }
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
              onOpenFood={openDraftFromRecent}
              onQuickAdd={quickAddRecent}
              onSearchFood={() => setMode('food')}
              selectedMealLabel={selectedMealLabel}
              styles={styles}
            />
          ) : null}

          {mode === 'favorites' ? (
            <FavoriteFoodsModeSection
              foods={favoriteFoods}
              onOpenFood={openDraftFromCatalog}
              onQuickAdd={quickAddCatalogFood}
              onSearchFood={() => setMode('food')}
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
              onDeleteMealTemplate={deleteMealTemplate}
              onQuickAddMealTemplate={quickAddMealTemplate}
              onSaveMealTemplate={saveMealTemplateFromDiary}
              onToggleCreateMeal={() => setCreateMealOpen((current) => !current)}
              onToggleManageMeals={() => setManageMealsOpen((current) => !current)}
              selectedMealLabel={selectedMealLabel}
              setMealTemplateName={setMealTemplateName}
              styles={styles}
            />
          ) : null}

          <View style={styles.quietActionRow}>
            <Pressable
              accessibilityLabel="Create food"
              hitSlop={10}
              onPress={() => setCreateFoodOpen((current) => !current)}
              style={styles.quietActionButton}>
              <Text style={styles.quietActionText}>
                {createFoodOpen ? 'Hide create food' : 'Create food'}
              </Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Go to meals mode"
              hitSlop={10}
              onPress={() => setMode('meals')}
              style={styles.quietActionButton}>
              <Text style={styles.quietActionText}>Create meal</Text>
            </Pressable>
          </View>

          {createFoodOpen ? (
            <CreateFoodInlineForm
              colors={colors}
              foodBrand={foodBrand}
              foodCalories={foodCalories}
              foodCarbs={foodCarbs}
              foodFats={foodFats}
              foodName={foodName}
              foodProtein={foodProtein}
              foodQuantity={foodQuantity}
              foodServingSize={foodServingSize}
              foodServingUnit={foodServingUnit}
              onSave={saveCustomFood}
              setFoodBrand={setFoodBrand}
              setFoodCalories={setFoodCalories}
              setFoodCarbs={setFoodCarbs}
              setFoodFats={setFoodFats}
              setFoodName={setFoodName}
              setFoodProtein={setFoodProtein}
              setFoodQuantity={setFoodQuantity}
              setFoodServingSize={setFoodServingSize}
              setFoodServingUnit={setFoodServingUnit}
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
          insetsBottom={insets.bottom}
          macroTotalsLabel={selectedDraftMacroTotalsLabel}
          onChangeQuantity={(value) =>
            setSelectedDraft((current) => (current ? { ...current, quantity: value } : current))
          }
          onClose={() => setSelectedDraft(null)}
          onDelete={deleteSelectedDraft}
          onSave={saveDraft}
          selectedDateLabel={selectedDateLabel}
          selectedMealLabel={selectedMealLabel}
          servingLabel={selectedDraftServingLabel}
          submitLabel={selectedDraftSubmitLabel}
          styles={styles}
        />
      ) : null}

      <BarcodeScannerModal
        colors={colors}
        onClose={() => setScannerOpen(false)}
        onFoodFound={(food) => {
          setScannerOpen(false);
          setSelectedDraft(createDraftFromFoodItem(food));
        }}
        onSearchByName={() => {
          setScannerOpen(false);
          setMode('food');
        }}
        styles={styles}
        visible={scannerOpen}
      />
    </KeyboardAvoidingView>
  );
}
