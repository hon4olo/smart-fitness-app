import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { isFoodApiConfigured, searchFoods, type FoodItem } from '@/api/foods';
import { Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { foodCatalog } from '@/data/foods';
import { CreateFoodInlineForm } from '@/features/nutrition/components/CreateFoodInlineForm';
import { FavoriteFoodsModeSection } from '@/features/nutrition/components/FavoriteFoodsModeSection';
import { FoodSearchModeSection } from '@/features/nutrition/components/FoodSearchModeSection';
import { FoodPortionSheet } from '@/features/nutrition/components/FoodPortionSheet';
import { RecentFoodsModeSection } from '@/features/nutrition/components/RecentFoodsModeSection';
import { SavedMealsModeSection } from '@/features/nutrition/components/SavedMealsModeSection';
import { createAddFoodStyles } from '@/features/nutrition/styles/addFoodStyles';
import {
  buildFoodEntryFromCatalog,
  formatCompactMacroTotals,
  formatFoodServing,
  formatNumber,
  resolveFoodCatalogItem,
  searchFoodCatalog,
  sumNutritionTotals,
} from '@/lib/nutrition';
import type { FoodAttribution, FoodCatalogItem, FoodEntry, MealTemplate, MealType } from '@/types';
import { useAppTheme } from '@/theme/AppThemeProvider';

const mealTypeLabels: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snacks',
};

type PickerMode = 'food' | 'recent' | 'favorites' | 'meals';

type DraftItem = {
  brandName?: string;
  attribution?: FoodAttribution;
  calories: number;
  carbs: number;
  externalId?: string;
  fats: number;
  name: string;
  originalEntryId?: string;
  protein: number;
  servingSize: number;
  servingUnit: string;
  source: FoodEntry['source'];
  quantity: string;
};

type RecentItem = {
  entry: FoodEntry;
  key: string;
  label: string;
  portionLabel: string;
  caloriesLabel: string;
  catalogFood?: FoodCatalogItem;
};

const formatScreenDate = (dateLabel: string) => {
  const parsedDate = new Date(`${dateLabel}T12:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return dateLabel;
  }

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
  }).format(parsedDate);
};

const parseNumber = (value: string, fallback = 0) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const isMeaningful = (value: string) => value.trim().length > 0;
const quickAddLabel = 'Quick add';

const providerLabels: Record<FoodItem['source']['provider'] | 'manual' | 'usda', string> = {
  custom: 'Custom',
  fatsecret: 'FatSecret',
  local: 'Local',
  manual: 'Manual',
  openfoodfacts: 'OpenFoodFacts',
  usda: 'Local',
};

const formatProviderLabel = (provider: FoodItem['source']['provider'] | FoodEntry['source']) => providerLabels[provider] ?? provider;

const getFoodAttributionLabel = (food: Pick<FoodItem, 'attribution' | 'source'>) =>
  food.attribution?.text ?? `Source: ${formatProviderLabel(food.source.provider)}`;

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
  const selectedDate = typeof params.date === 'string' && params.date.length > 0 ? params.date : new Date().toISOString().slice(0, 10);
  const selectedMeal: MealType = params.meal === 'lunch' || params.meal === 'dinner' || params.meal === 'snack' ? params.meal : 'breakfast';
  const entryId = typeof params.entryId === 'string' && params.entryId.length > 0 ? params.entryId : undefined;

  const selectedDateEntries = useMemo(() => foodEntries.filter((entry) => entry.date === selectedDate), [foodEntries, selectedDate]);
  const selectedMealEntries = useMemo(() => selectedDateEntries.filter((entry) => entry.mealType === selectedMeal), [selectedDateEntries, selectedMeal]);
  const selectedMealTotals = useMemo(() => sumNutritionTotals(selectedMealEntries), [selectedMealEntries]);

  const recentItems = useMemo<RecentItem[]>(() => {
    const sortedEntries = [...foodEntries].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
    const seen = new Set<string>();
    const items: RecentItem[] = [];

    for (const entry of sortedEntries) {
      const catalogFood = resolveFoodCatalogItem(entry);
      const key = catalogFood?.id ?? `${entry.name.toLowerCase()}|${entry.brandName ?? ''}`;

      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      items.push({
        catalogFood: catalogFood ?? undefined,
        caloriesLabel: `${formatNumber(entry.calories)} kcal`,
        entry,
        key,
        label: entry.name,
        portionLabel: `${formatNumber(entry.quantity ?? entry.servingSize ?? 1)} ${entry.servingUnit ?? 'unit'}`,
      });
    }

    return items.slice(0, 20);
  }, [foodEntries]);

  const recentCatalogIds = useMemo(() => recentItems.map((item) => item.catalogFood?.id).filter(Boolean) as string[], [recentItems]);
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
  const [backendFoodResults, setBackendFoodResults] = useState<FoodItem[]>([]);
  const [backendFoodSearchStatus, setBackendFoodSearchStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  const editingEntry = useMemo(() => foodEntries.find((entry) => entry.id === entryId), [entryId, foodEntries]);
  const defaultCatalogResults = useMemo(() => searchFoodCatalog(foodCatalog, query, { favoriteIds: favoriteIds.length > 0 ? favoriteIds : favoriteSeedIds, recentIds: recentCatalogIds }), [favoriteIds, favoriteSeedIds, query, recentCatalogIds]);
  const favoriteFoods = useMemo(() => foodCatalog.filter((food) => favoriteIds.includes(food.id) || favoriteSeedIds.includes(food.id)), [favoriteIds, favoriteSeedIds]);
  const selectedMealLabel = mealTypeLabels[selectedMeal];
  const selectedMealCountLabel = `${selectedMealEntries.length} item${selectedMealEntries.length === 1 ? '' : 's'}`;
  const selectedDateLabel = formatScreenDate(selectedDate);
  const deleteEntryLabel = 'Delete entry';
  const selectedDraftSubmitLabel = selectedDraft?.originalEntryId ? `Save changes` : `Add to ${selectedMealLabel}`;
  const selectedDraftServingLabel = selectedDraft ? formatFoodServing({ servingSize: selectedDraft.servingSize, servingUnit: selectedDraft.servingUnit }) : '';
  const selectedDraftAttributionLabel =
    selectedDraft && (selectedDraft.attribution || selectedDraft.source === 'fatsecret')
      ? selectedDraft.attribution?.text ?? `Source: ${formatProviderLabel(selectedDraft.source)}`
      : undefined;
  const selectedDraftMacroTotalsLabel = selectedDraft
    ? formatCompactMacroTotals({
        calories: Math.round(selectedDraft.calories * (parseNumber(selectedDraft.quantity, selectedDraft.servingSize) / selectedDraft.servingSize) * 10) / 10,
        carbs: Math.round(selectedDraft.carbs * (parseNumber(selectedDraft.quantity, selectedDraft.servingSize) / selectedDraft.servingSize) * 10) / 10,
        fats: Math.round(selectedDraft.fats * (parseNumber(selectedDraft.quantity, selectedDraft.servingSize) / selectedDraft.servingSize) * 10) / 10,
        protein: Math.round(selectedDraft.protein * (parseNumber(selectedDraft.quantity, selectedDraft.servingSize) / selectedDraft.servingSize) * 10) / 10,
      })
    : '';

  useEffect(() => {
    if (editingEntry) {
      const catalogFood = resolveFoodCatalogItem(editingEntry);
      const servingSize = editingEntry.servingSize ?? catalogFood?.servingSize ?? editingEntry.quantity ?? 1;
      const servingUnit = editingEntry.servingUnit ?? catalogFood?.servingUnit ?? 'unit';
      setSelectedDraft({
        brandName: editingEntry.brandName,
        attribution: editingEntry.attribution,
        calories: editingEntry.baseCalories ?? editingEntry.calories,
        carbs: editingEntry.baseCarbs ?? editingEntry.carbs,
        externalId: editingEntry.externalId,
        fats: editingEntry.baseFats ?? editingEntry.fats,
        name: editingEntry.name,
        originalEntryId: editingEntry.id,
        protein: editingEntry.baseProtein ?? editingEntry.protein,
        servingSize,
        servingUnit,
        source: editingEntry.source,
        quantity: String(editingEntry.quantity ?? servingSize),
      });
      return;
    }

    if (params.entryId) {
      setMessage('');
      setSelectedDraft(null);
    }
  }, [editingEntry, params.entryId]);

  const openDraftFromCatalog = (food: FoodCatalogItem, quantity = food.servingSize) => {
    setSelectedDraft({
      brandName: undefined,
      attribution: undefined,
      calories: food.calories,
      carbs: food.carbs,
      externalId: food.id,
      fats: food.fat,
      name: food.name,
      protein: food.protein,
      servingSize: food.servingSize,
      servingUnit: food.servingUnit,
      source: 'usda',
      quantity: String(quantity),
    });
  };

  const createDraftFromFoodItem = (food: FoodItem): DraftItem => {
    const nutrients = food.nutrientsPer100g ?? food.nutrientsPer100ml ?? { calories: 0, protein: 0, carbs: 0, fat: 0 };
    const defaultUnit = food.servingBase === '100ml' ? 'ml' : 'g';
    const serving = food.servings[0];
    const servingSize = serving?.quantity && serving.quantity > 0 ? serving.quantity : 100;
    const servingUnit = serving?.unit || defaultUnit;
    const baseMultiplier = servingSize / 100;

    return {
      brandName: food.brand,
      attribution: food.attribution,
      calories: Math.round(nutrients.calories * baseMultiplier * 10) / 10,
      carbs: Math.round(nutrients.carbs * baseMultiplier * 10) / 10,
      externalId: food.id,
      fats: Math.round(nutrients.fat * baseMultiplier * 10) / 10,
      name: food.name,
      protein: Math.round(nutrients.protein * baseMultiplier * 10) / 10,
      servingSize,
      servingUnit,
      source: food.source.provider,
      quantity: String(servingSize),
    };
  };

  const openDraftFromFoodItem = (food: FoodItem) => {
    setSelectedDraft(createDraftFromFoodItem(food));
  };

  const quickAddFoodItem = (food: FoodItem) => {
    const draft = createDraftFromFoodItem(food);
    addFoodEntry({
      id: `${draft.externalId ?? draft.name}-${Date.now()}`,
      name: draft.name,
      brandName: draft.brandName,
      attribution: draft.attribution,
      date: selectedDate,
      mealType: selectedMeal,
      calories: draft.calories,
      protein: draft.protein,
      carbs: draft.carbs,
      fats: draft.fats,
      baseCalories: draft.calories,
      baseProtein: draft.protein,
      baseCarbs: draft.carbs,
      baseFats: draft.fats,
      source: draft.source,
      externalId: draft.externalId,
      servingSize: draft.servingSize,
      servingUnit: draft.servingUnit,
      quantity: draft.servingSize,
      createdAt: new Date().toISOString(),
    });
    setMessage(`Added ${draft.name} to ${selectedMealLabel}`);
  };

  const quickAddCatalogFood = (food: FoodCatalogItem, servings = 1) => {
    addFoodEntry(buildFoodEntryFromCatalog(food, { date: selectedDate, mealType: selectedMeal, servings }));
    setMessage(`Added ${food.name} to ${selectedMealLabel}`);
  };

  const quickAddRecent = (item: RecentItem) => {
    if (item.catalogFood) {
      const servings = (item.entry.quantity ?? item.entry.servingSize ?? item.catalogFood.servingSize) / item.catalogFood.servingSize;
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

  const openDraftFromRecent = (item: RecentItem) => {
    if (item.catalogFood) {
      openDraftFromCatalog(item.catalogFood, item.entry.quantity ?? item.catalogFood.servingSize);
      return;
    }

    setSelectedDraft({
      brandName: item.entry.brandName,
      attribution: item.entry.attribution,
      calories: item.entry.baseCalories ?? item.entry.calories,
      carbs: item.entry.baseCarbs ?? item.entry.carbs,
      externalId: item.entry.externalId,
      fats: item.entry.baseFats ?? item.entry.fats,
      name: item.entry.name,
      originalEntryId: item.entry.id,
      protein: item.entry.baseProtein ?? item.entry.protein,
      servingSize: item.entry.servingSize ?? item.entry.quantity ?? 1,
      servingUnit: item.entry.servingUnit ?? 'unit',
      source: item.entry.source,
      quantity: String(item.entry.quantity ?? item.entry.servingSize ?? 1),
    });
  };

  const quickAddMealTemplate = (template: MealTemplate) => {
    addFoodEntries(
      template.items.map((entry) => ({
        ...entry,
        id: `${entry.id}-${Date.now()}`,
        date: selectedDate,
        mealType: selectedMeal,
        createdAt: new Date().toISOString(),
      }))
    );
    setMessage(`Added ${template.name} to ${selectedMealLabel}`);
  };

  const toggleFavorite = (foodId: string) => {
    setFavoriteIds((current) => (current.includes(foodId) ? current.filter((item) => item !== foodId) : [foodId, ...current]));
  };

  const saveDraft = () => {
    if (!selectedDraft) {
      return;
    }

    const quantity = parseNumber(selectedDraft.quantity, selectedDraft.servingSize);
    const servings = selectedDraft.servingSize > 0 ? quantity / selectedDraft.servingSize : 1;

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setMessage('Enter a valid quantity.');
      return;
    }

    const nextEntry: FoodEntry = {
      id: selectedDraft.originalEntryId ?? `${selectedDraft.name}-${Date.now()}`,
      name: selectedDraft.name,
      date: selectedDate,
      mealType: selectedMeal,
      brandName: selectedDraft.brandName,
      attribution: selectedDraft.attribution,
      calories: Math.round(selectedDraft.calories * servings * 10) / 10,
      protein: Math.round(selectedDraft.protein * servings * 10) / 10,
      carbs: Math.round(selectedDraft.carbs * servings * 10) / 10,
      fats: Math.round(selectedDraft.fats * servings * 10) / 10,
      baseCalories: selectedDraft.calories,
      baseProtein: selectedDraft.protein,
      baseCarbs: selectedDraft.carbs,
      baseFats: selectedDraft.fats,
      source: selectedDraft.source,
      externalId: selectedDraft.externalId,
      servingSize: selectedDraft.servingSize,
      servingUnit: selectedDraft.servingUnit,
      quantity,
      createdAt: editingEntry?.createdAt ?? new Date().toISOString(),
    };

    if (selectedDraft.originalEntryId) {
      updateFoodEntry(selectedDraft.originalEntryId, nextEntry);
      setMessage(`Saved ${selectedDraft.name} to ${selectedMealLabel}`);
    } else {
      addFoodEntry(nextEntry);
      setMessage(`Added ${selectedDraft.name} to ${selectedMealLabel}`);
    }

    setSelectedDraft(null);
    router.replace({ pathname: '/nutrition', params: { date: selectedDate, openMeal: selectedMeal } });
  };

  const deleteSelectedDraft = () => {
    if (!selectedDraft?.originalEntryId) {
      return;
    }

    deleteFoodEntry(selectedDraft.originalEntryId);
    setSelectedDraft(null);
    router.replace({ pathname: '/nutrition', params: { date: selectedDate, openMeal: selectedMeal } });
  };

  const saveCustomFood = () => {
    if (!isMeaningful(foodName)) {
      setMessage('Enter a food name.');
      return;
    }

    const servingSize = parseNumber(foodServingSize, 1);
    const quantity = parseNumber(foodQuantity, servingSize);
    const servings = servingSize > 0 ? quantity / servingSize : 1;
    const entry: FoodEntry = {
      id: `${foodName.trim()}-${Date.now()}`,
      name: foodName.trim(),
      brandName: foodBrand.trim() || undefined,
      date: selectedDate,
      mealType: selectedMeal,
      calories: Math.round(parseNumber(foodCalories, 0) * servings * 10) / 10,
      protein: Math.round(parseNumber(foodProtein, 0) * servings * 10) / 10,
      carbs: Math.round(parseNumber(foodCarbs, 0) * servings * 10) / 10,
      fats: Math.round(parseNumber(foodFats, 0) * servings * 10) / 10,
      baseCalories: parseNumber(foodCalories, 0),
      baseProtein: parseNumber(foodProtein, 0),
      baseCarbs: parseNumber(foodCarbs, 0),
      baseFats: parseNumber(foodFats, 0),
      source: 'manual',
      servingSize,
      servingUnit: foodServingUnit.trim() || 'unit',
      quantity,
      createdAt: new Date().toISOString(),
    };

    addFoodEntry(entry);
    setMessage(`Added ${entry.name} to ${selectedMealLabel}`);
    setCreateFoodOpen(false);
    setFoodName('');
    setFoodBrand('');
  };

  const saveMealTemplateFromDiary = () => {
    if (!isMeaningful(mealTemplateName)) {
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

  const searchResults = useMemo(() => {
    if (mode !== 'food') {
      return [] as FoodCatalogItem[];
    }

    return defaultCatalogResults.slice(0, 18);
  }, [defaultCatalogResults, mode]);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (mode !== 'food' || !isFoodApiConfigured() || trimmedQuery.length < 2) {
      setBackendFoodResults([]);
      setBackendFoodSearchStatus('idle');
      return;
    }

    let active = true;
    setBackendFoodSearchStatus('loading');

    searchFoods(trimmedQuery)
      .then((foods) => {
        if (!active) {
          return;
        }

        setBackendFoodResults(foods.slice(0, 8));
        setBackendFoodSearchStatus('idle');
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setBackendFoodResults([]);
        setBackendFoodSearchStatus('error');
      });

    return () => {
      active = false;
    };
  }, [mode, query]);

  useEffect(() => {
    if (mode === 'recent' && recentItems.length === 0) {
      setMode('food');
    }
  }, [mode, recentItems.length]);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.six, paddingTop: insets.top + Spacing.three }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <Pressable accessibilityLabel="Cancel" hitSlop={10} onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backButtonText}>Cancel</Text>
            </Pressable>
            <View style={styles.headerCopy}>
              <Text selectable style={styles.title}>
                {selectedMealLabel}
              </Text>
              <Text selectable style={styles.subtitle}>
                {selectedDateLabel}
              </Text>
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
              <Text selectable style={styles.summaryTitle}>
                {selectedMealCountLabel}
              </Text>
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
              <Text selectable style={styles.messageText}>
                {message}
              </Text>
            </View>
          ) : null}

          {mode === 'food' ? (
            <FoodSearchModeSection
              backendFoodResults={backendFoodResults} backendFoodSearchStatus={backendFoodSearchStatus} colors={colors}
              favoriteIds={favoriteIds} favoriteSeedIds={favoriteSeedIds} formatProviderLabel={formatProviderLabel}
              getFoodAttributionLabel={getFoodAttributionLabel} onClearQuery={() => setQuery('')} onOpenCatalogFood={openDraftFromCatalog}
              onOpenFoodItem={openDraftFromFoodItem} onQuickAddCatalogFood={quickAddCatalogFood} onQuickAddFoodItem={quickAddFoodItem}
              onToggleFavorite={toggleFavorite} query={query} searchResults={searchResults} selectedMealLabel={selectedMealLabel}
              setQuery={setQuery} styles={styles}
            />
          ) : null}

          {mode === 'recent' ? (
            <RecentFoodsModeSection
              items={recentItems} onOpenFood={openDraftFromRecent} onQuickAdd={quickAddRecent}
              onSearchFood={() => setMode('food')} selectedMealLabel={selectedMealLabel} styles={styles}
            />
          ) : null}

          {mode === 'favorites' ? (
            <FavoriteFoodsModeSection
              foods={favoriteFoods} onOpenFood={openDraftFromCatalog} onQuickAdd={quickAddCatalogFood}
              onSearchFood={() => setMode('food')} selectedMealLabel={selectedMealLabel} styles={styles}
            />
          ) : null}

          {mode === 'meals' ? (
            <SavedMealsModeSection
              colors={colors} createMealOpen={createMealOpen} manageMealsOpen={manageMealsOpen} mealTemplateName={mealTemplateName}
              mealTemplates={mealTemplates} onDeleteMealTemplate={deleteMealTemplate} onQuickAddMealTemplate={quickAddMealTemplate}
              onSaveMealTemplate={saveMealTemplateFromDiary} onToggleCreateMeal={() => setCreateMealOpen((current) => !current)}
              onToggleManageMeals={() => setManageMealsOpen((current) => !current)} selectedMealLabel={selectedMealLabel}
              setMealTemplateName={setMealTemplateName} styles={styles}
            />
          ) : null}

          <View style={styles.quietActionRow}>
            <Pressable accessibilityLabel="Create food" hitSlop={10} onPress={() => setCreateFoodOpen((current) => !current)} style={styles.quietActionButton}>
              <Text style={styles.quietActionText}>{createFoodOpen ? 'Hide create food' : 'Create food'}</Text>
            </Pressable>
            <Pressable accessibilityLabel="Go to meals mode" hitSlop={10} onPress={() => setMode('meals')} style={styles.quietActionButton}>
              <Text style={styles.quietActionText}>Create meal</Text>
            </Pressable>
          </View>
          {createFoodOpen ? (
            <CreateFoodInlineForm
              colors={colors} foodBrand={foodBrand} foodCalories={foodCalories} foodCarbs={foodCarbs} foodFats={foodFats}
              foodName={foodName} foodProtein={foodProtein} foodQuantity={foodQuantity} foodServingSize={foodServingSize}
              foodServingUnit={foodServingUnit} onSave={saveCustomFood} setFoodBrand={setFoodBrand} setFoodCalories={setFoodCalories}
              setFoodCarbs={setFoodCarbs} setFoodFats={setFoodFats} setFoodName={setFoodName} setFoodProtein={setFoodProtein}
              setFoodQuantity={setFoodQuantity} setFoodServingSize={setFoodServingSize} setFoodServingUnit={setFoodServingUnit} styles={styles}
            />
          ) : null}
        </View>
      </ScrollView>

      {selectedDraft ? (
        <FoodPortionSheet
          attributionLabel={selectedDraftAttributionLabel} colors={colors} deleteLabel={deleteEntryLabel} draft={selectedDraft}
          insetsBottom={insets.bottom} macroTotalsLabel={selectedDraftMacroTotalsLabel}
          onChangeQuantity={(value) => setSelectedDraft((current) => (current ? { ...current, quantity: value } : current))}
          onClose={() => setSelectedDraft(null)} onDelete={deleteSelectedDraft} onSave={saveDraft}
          selectedDateLabel={selectedDateLabel} selectedMealLabel={selectedMealLabel} submitLabel={selectedDraftSubmitLabel}
          servingLabel={selectedDraftServingLabel} styles={styles}
        />
      ) : null}
    </KeyboardAvoidingView>
  );
}
