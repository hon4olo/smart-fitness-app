import { useCallback, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddFoodFormSection } from '@/components/nutrition/AddFoodFormSection';
import { FoodDetailSheet } from '@/components/nutrition/FoodDetailSheet';
import { MealMenuCard } from '@/components/nutrition/MealMenuCard';
import { NutritionOverviewCard } from '@/components/nutrition/NutritionOverviewCard';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { foodCatalog, foodCategoryLabels, foodCategoryOrder } from '@/data/foods';
import { useAppContext } from '@/context/AppContext';
import {
  addDays,
  buildFoodEntryFromCatalog,
  formatLocalDate,
  getRecentCatalogFoods,
  getServingInfo,
  getSimilarFoods,
  parseOptionalPositiveNumber,
  parsePositiveNumber,
  searchFoodCatalog,
  sumNutritionTotals,
} from '@/lib';
import { formatCompactMacroTotals, getFoodCatalogTopFoods, getNutritionSummary } from '@/lib/nutrition';
import type { FoodBrowserMode, FoodCatalogItem, FoodCategory, FoodEntry, MealTemplate, MealType } from '@/types';

type SelectedBaseFood = {
  servingSize?: number;
  servingUnit?: string;
  baseCalories: number;
  baseProtein: number;
  baseCarbs: number;
  baseFats: number;
};

type RecentFood = FoodEntry & {
  createdAt: string;
};

const mealTypeOrder: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const mealTypeLabels: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

const formatDisplayDate = (dateLabel: string) => {
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

export default function NutritionScreen() {
  const {
    addFoodEntry,
    addFoodEntries,
    addMealTemplate,
    deleteFoodEntry,
    deleteMealTemplate,
    foodEntries,
    mealTemplates,
    nutritionTargets,
    updateFoodEntry,
  } = useAppContext();
  const safeAreaInsets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef({ foodForm: 0, recentFoods: 0, savedMeals: 0 });
  const [selectedDate, setSelectedDate] = useState(formatLocalDate(new Date()));
  const [foodSearchQuery, setFoodSearchQuery] = useState('');
  const [isRecentFoodsExpanded, setIsRecentFoodsExpanded] = useState(false);
  const [isSavedMealsExpanded, setIsSavedMealsExpanded] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isAddFoodFormExpanded, setIsAddFoodFormExpanded] = useState(true);
  const [isFoodBrowserExpanded, setIsFoodBrowserExpanded] = useState(true);
  const [selectedBrowserCategory, setSelectedBrowserCategory] = useState<FoodCategory | 'all'>('all');
  const [selectedBrowserMode, setSelectedBrowserMode] = useState<FoodBrowserMode>('all');
  const [favoriteFoodIds, setFavoriteFoodIds] = useState<string[]>([]);
  const [selectedBrowserFood, setSelectedBrowserFood] = useState<FoodCatalogItem | null>(null);
  const [expandedMealType, setExpandedMealType] = useState<MealType | null>(null);
  const [editingFoodEntry, setEditingFoodEntry] = useState<FoodEntry | undefined>();
  const [mealType, setMealType] = useState<MealType>('breakfast');
  const [mealTemplateName, setMealTemplateName] = useState('');
  const [name, setName] = useState('');
  const [brandName, setBrandName] = useState<string | undefined>();
  const [draftFoodSource, setDraftFoodSource] = useState<FoodEntry['source']>('manual');
  const [draftFoodExternalId, setDraftFoodExternalId] = useState<string | undefined>();
  const [selectedBaseFood, setSelectedBaseFood] = useState<SelectedBaseFood | undefined>();
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');
  const [servingSize, setServingSize] = useState('');
  const [servingUnit, setServingUnit] = useState('');
  const [quantity, setQuantity] = useState('');

  const selectedDateFoodEntries = useMemo(
    () => foodEntries.filter((entry) => entry.date === selectedDate),
    [foodEntries, selectedDate]
  );
  const selectedDateNutrition = useMemo(() => sumNutritionTotals(selectedDateFoodEntries), [selectedDateFoodEntries]);
  const selectedMealFoodEntries = useMemo(
    () => selectedDateFoodEntries.filter((entry) => entry.mealType === mealType),
    [mealType, selectedDateFoodEntries]
  );
  const selectedMealNutrition = useMemo(() => sumNutritionTotals(selectedMealFoodEntries), [selectedMealFoodEntries]);
  const nutritionSummary = useMemo(
    () => getNutritionSummary(selectedDateNutrition, nutritionTargets),
    [nutritionTargets, selectedDateNutrition]
  );
  const selectedDateLabel = useMemo(() => formatDisplayDate(selectedDate), [selectedDate]);
  const currentMealLabel = mealTypeLabels[mealType];
  const currentMealTotalLabel = formatCompactMacroTotals(selectedMealNutrition);
  const currentMealEntriesCount = selectedMealFoodEntries.length;

  const recentFoods = useMemo(
    () =>
      Array.from(
        foodEntries
          .slice()
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .reduce((recentMap, entry) => {
            const dedupeKey = [entry.name.trim().toLowerCase(), entry.brandName?.trim().toLowerCase() ?? '', entry.source, entry.externalId ?? ''].join('|');

            if (!recentMap.has(dedupeKey)) {
              recentMap.set(dedupeKey, entry as RecentFood);
            }

            return recentMap;
          }, new Map<string, RecentFood>())
          .values()
      ).slice(0, 8),
    [foodEntries]
  );

  const browserRecentFoods = useMemo(() => getRecentCatalogFoods(foodEntries, 20), [foodEntries]);
  const favoriteFoodSet = useMemo(() => new Set(favoriteFoodIds), [favoriteFoodIds]);
  const favoriteFoods = useMemo(() => foodCatalog.filter((food) => favoriteFoodSet.has(food.id)), [favoriteFoodSet]);
  const popularFoods = useMemo(() => getFoodCatalogTopFoods(foodCatalog, 8), []);
  const browserResults = useMemo(
    () =>
      searchFoodCatalog(foodCatalog, foodSearchQuery, {
        category: selectedBrowserCategory,
        favoriteIds: favoriteFoodIds,
        mode: selectedBrowserMode,
        recentIds: browserRecentFoods.map((food) => food.id),
      }),
    [browserRecentFoods, favoriteFoodIds, foodSearchQuery, selectedBrowserCategory, selectedBrowserMode]
  );
  const browserSimilarFoods = useMemo(
    () => (selectedBrowserFood ? getSimilarFoods(selectedBrowserFood, foodCatalog, 6) : []),
    [selectedBrowserFood]
  );
  const browserCategoryCounts = useMemo(() => {
    const counts = new Map<FoodCategory, number>();

    for (const food of foodCatalog) {
      counts.set(food.category, (counts.get(food.category) ?? 0) + 1);
    }

    return foodCategoryOrder.map((category) => ({
      category,
      count: counts.get(category) ?? 0,
      label: foodCategoryLabels[category],
    }));
  }, []);
  const browserModeCounts = useMemo(
    () => [
      { count: foodCatalog.length, label: 'All', mode: 'all' as const },
      { count: favoriteFoods.length, label: 'Favorites', mode: 'favorites' as const },
      { count: browserRecentFoods.length, label: 'Recent', mode: 'recent' as const },
      { count: popularFoods.length, label: 'Popular', mode: 'popular' as const },
    ],
    [browserRecentFoods.length, favoriteFoods.length, popularFoods.length]
  );
  const browserCategoryChips = useMemo(
    () => [
      {
        count: foodCatalog.length,
        label: 'All',
        onPress: () => setSelectedBrowserCategory('all'),
        selected: selectedBrowserCategory === 'all',
      },
      ...browserCategoryCounts.map(({ category, count, label }) => ({
        count,
        label,
        onPress: () => setSelectedBrowserCategory(category),
        selected: selectedBrowserCategory === category,
      })),
    ],
    [browserCategoryCounts, selectedBrowserCategory]
  );
  const browserModeChips = useMemo(
    () =>
      browserModeCounts.map(({ count, label, mode }) => ({
        count,
        label,
        onPress: () => setSelectedBrowserMode(mode),
        selected: selectedBrowserMode === mode,
      })),
    [browserModeCounts, selectedBrowserMode]
  );

  const isMealTemplateSaveDisabled = mealTemplateName.trim().length === 0 || selectedMealFoodEntries.length === 0;
  const mealTemplateButtonLabel = `Save ${currentMealLabel} Template`;
  const hasFoodLoggedToday = selectedDateFoodEntries.length > 0;

  const createBaseFoodFromEntry = (entry: FoodEntry): SelectedBaseFood => {
    const multiplier = entry.quantity && entry.servingSize && entry.quantity > 0 && entry.servingSize > 0 ? entry.quantity / entry.servingSize : 0;
    const inferBaseMacro = (baseMacro: number | undefined, savedMacro: number) => {
      if (baseMacro !== undefined) {
        return baseMacro;
      }

      return multiplier > 0 ? savedMacro / multiplier : savedMacro;
    };

    return {
      servingSize: entry.servingSize,
      servingUnit: entry.servingUnit,
      baseCalories: inferBaseMacro(entry.baseCalories, entry.calories),
      baseProtein: inferBaseMacro(entry.baseProtein, entry.protein),
      baseCarbs: inferBaseMacro(entry.baseCarbs, entry.carbs),
      baseFats: inferBaseMacro(entry.baseFats, entry.fats),
    };
  };

  const applyCalculatedMacros = (baseFood: SelectedBaseFood, nextQuantity: string, nextServingSize = servingSize) => {
    const parsedServingSize = parseOptionalPositiveNumber(nextServingSize) ?? baseFood.servingSize;
    const parsedQuantity = Number(nextQuantity);

    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0 || parsedServingSize === undefined || parsedServingSize <= 0) {
      setCalories('');
      setProtein('');
      setCarbs('');
      setFats('');
      return;
    }

    const multiplier = parsedQuantity / parsedServingSize;
    setCalories((baseFood.baseCalories * multiplier).toFixed(1).replace(/\.0$/, ''));
    setProtein((baseFood.baseProtein * multiplier).toFixed(1).replace(/\.0$/, ''));
    setCarbs((baseFood.baseCarbs * multiplier).toFixed(1).replace(/\.0$/, ''));
    setFats((baseFood.baseFats * multiplier).toFixed(1).replace(/\.0$/, ''));
  };

  const clearSelectedFoodMetadata = () => {
    setBrandName(undefined);
    setDraftFoodSource('manual');
    setDraftFoodExternalId(undefined);
    setSelectedBaseFood(undefined);
    setServingSize('');
    setServingUnit('');
    setQuantity('');
  };

  const clearForm = () => {
    setEditingFoodEntry(undefined);
    setMealType('breakfast');
    setName('');
    setBrandName(undefined);
    setDraftFoodSource('manual');
    setDraftFoodExternalId(undefined);
    setSelectedBaseFood(undefined);
    setCalories('');
    setProtein('');
    setCarbs('');
    setFats('');
    setServingSize('');
    setServingUnit('');
    setQuantity('');
    setFoodSearchQuery('');
    setSelectedBrowserFood(null);
    setSelectedBrowserCategory('all');
    setSelectedBrowserMode('all');
    setIsFoodBrowserExpanded(true);
    setIsSearchExpanded(false);
  };

  const handleNameChange = (value: string) => {
    setName(value);
    clearSelectedFoodMetadata();
  };

  const handleServingSizeChange = (value: string) => {
    setServingSize(value);

    if (selectedBaseFood) {
      applyCalculatedMacros(selectedBaseFood, quantity, value);
    }
  };

  const handleServingUnitChange = (value: string) => {
    setServingUnit(value);
  };

  const handleQuantityChange = (value: string) => {
    setQuantity(value);

    if (selectedBaseFood) {
      applyCalculatedMacros(selectedBaseFood, value);
    }
  };

  const handleToggleFavoriteFood = useCallback((food: FoodCatalogItem) => {
    setFavoriteFoodIds((current) => (current.includes(food.id) ? current.filter((foodId) => foodId !== food.id) : [...current, food.id]));
  }, []);

  const handleOpenBrowserFood = useCallback((food: FoodCatalogItem) => {
    setSelectedBrowserFood(food);
    setIsSearchExpanded(true);
    setIsAddFoodFormExpanded(true);
  }, []);

  const handleCloseBrowserFood = useCallback(() => {
    setSelectedBrowserFood(null);
  }, []);

  const handleQuickAddBrowserFood = useCallback(
    (food: FoodCatalogItem, servings = 1) => {
      const foodEntry = buildFoodEntryFromCatalog(food, {
        date: selectedDate,
        mealType,
        servings,
      });

      addFoodEntry(foodEntry);
      setIsSearchExpanded(true);
      setIsAddFoodFormExpanded(true);
    },
    [addFoodEntry, mealType, selectedDate]
  );

  const handleUseRecentFood = (food: FoodEntry) => {
    const baseFood = createBaseFoodFromEntry(food);
    const nextQuantity = food.quantity ? `${food.quantity}` : `${food.servingSize ?? 1}`;
    setName(food.name);
    setBrandName(food.brandName);
    setDraftFoodSource(food.source);
    setDraftFoodExternalId(food.externalId);
    setSelectedBaseFood(baseFood);
    setCalories(`${food.calories}`);
    setProtein(`${food.protein}`);
    setCarbs(`${food.carbs}`);
    setFats(`${food.fats}`);
    setServingSize(food.servingSize ? `${food.servingSize}` : '');
    setServingUnit(food.servingUnit ?? '');
    setQuantity(nextQuantity);
    applyCalculatedMacros(baseFood, nextQuantity, food.servingSize ? `${food.servingSize}` : '');
    setIsAddFoodFormExpanded(true);
    setIsSearchExpanded(true);
    scrollToSection('foodForm');
  };

  const handleEditFoodEntry = (entry: FoodEntry) => {
    const baseFood = createBaseFoodFromEntry(entry);
    setEditingFoodEntry(entry);
    setMealType(entry.mealType);
    setName(entry.name);
    setBrandName(entry.brandName);
    setDraftFoodSource(entry.source);
    setDraftFoodExternalId(entry.externalId);
    setSelectedBaseFood(baseFood);
    setCalories(`${entry.calories}`);
    setProtein(`${entry.protein}`);
    setCarbs(`${entry.carbs}`);
    setFats(`${entry.fats}`);
    setServingSize(entry.servingSize ? `${entry.servingSize}` : '');
    setServingUnit(entry.servingUnit ?? '');
    setQuantity(entry.quantity ? `${entry.quantity}` : '');
    setIsAddFoodFormExpanded(true);
    setIsSearchExpanded(false);
    scrollToSection('foodForm');
  };

  const handleSaveFood = () => {
    if (name.trim().length === 0 || !Number.isFinite(Number(calories)) || Number(calories) <= 0) {
      return;
    }

    const parsedQuantity = parseOptionalPositiveNumber(quantity);
    const parsedServingSize = parseOptionalPositiveNumber(servingSize) ?? parsedQuantity;
    const parsedCalories = Number(calories);
    const foodEntry: FoodEntry = {
      id: editingFoodEntry?.id ?? `${Date.now()}`,
      name: name.trim(),
      date: editingFoodEntry?.date ?? selectedDate,
      mealType,
      brandName,
      calories: parsedCalories,
      protein: parsePositiveNumber(protein),
      carbs: parsePositiveNumber(carbs),
      fats: parsePositiveNumber(fats),
      baseCalories: selectedBaseFood?.baseCalories ?? parsedCalories,
      baseProtein: selectedBaseFood?.baseProtein ?? parsePositiveNumber(protein),
      baseCarbs: selectedBaseFood?.baseCarbs ?? parsePositiveNumber(carbs),
      baseFats: selectedBaseFood?.baseFats ?? parsePositiveNumber(fats),
      source: editingFoodEntry?.source ?? draftFoodSource,
      servingSize: parsedServingSize,
      servingUnit: servingUnit.trim() || undefined,
      quantity: parsedQuantity,
      externalId: editingFoodEntry?.externalId ?? draftFoodExternalId,
      createdAt: editingFoodEntry?.createdAt ?? new Date().toISOString(),
    };

    if (editingFoodEntry) {
      updateFoodEntry(editingFoodEntry.id, foodEntry);
    } else {
      addFoodEntry(foodEntry);
    }

    clearForm();
  };

  const handleSaveMealTemplate = () => {
    if (isMealTemplateSaveDisabled) {
      return;
    }

    const createdAt = new Date().toISOString();
    const templateId = `${Date.now()}`;
    addMealTemplate({
      id: templateId,
      name: mealTemplateName.trim(),
      items: selectedMealFoodEntries.map((entry, index) => ({ ...entry, id: `${templateId}-item-${index}` })),
      createdAt,
    });
    setMealTemplateName('');
  };

  const handleDuplicateMealTemplate = (template: MealTemplate) => {
    const createdAt = new Date().toISOString();
    const templateId = `${Date.now()}`;
    addMealTemplate({
      id: templateId,
      name: `${template.name} copy`,
      items: template.items.map((item, index) => ({ ...item, id: `${templateId}-item-${index}` })),
      createdAt,
    });
  };

  const handleUseMealTemplate = (template: MealTemplate) => {
    const createdAt = new Date().toISOString();
    const templateIdPrefix = `${Date.now()}`;
    addFoodEntries(
      template.items.map((item, index) => ({
        ...item,
        id: `${templateIdPrefix}-${index}-${Math.random().toString(36).slice(2, 8)}`,
        date: selectedDate,
        mealType,
        createdAt,
      }))
    );
  };

  const confirmDeleteFoodEntry = (entryId: string) => {
    deleteFoodEntry(entryId);
  };

  const confirmDeleteMealTemplate = (templateId: string) => {
    deleteMealTemplate(templateId);
  };

  const scrollToSection = (key: keyof typeof sectionOffsets.current) => {
    const offset = sectionOffsets.current[key];
    scrollViewRef.current?.scrollTo({ animated: true, y: Math.max(0, offset - 12) });
  };

  const goToPreviousDay = () => {
    setSelectedDate((current) => addDays(current, -1));
    clearForm();
  };

  const goToToday = () => {
    setSelectedDate(formatLocalDate(new Date()));
    clearForm();
  };

  const goToNextDay = () => {
    setSelectedDate((current) => addDays(current, 1));
    clearForm();
  };

  const handleOpenAddFood = () => {
    setIsAddFoodFormExpanded(true);
    setIsSearchExpanded(false);
    scrollToSection('foodForm');
  };

  const handleOpenSearch = () => {
    setIsAddFoodFormExpanded(true);
    setIsSearchExpanded(true);
    setIsFoodBrowserExpanded(true);
    scrollToSection('foodForm');
  };

  const handleOpenRecentFoods = () => {
    setIsRecentFoodsExpanded(true);
    scrollToSection('recentFoods');
  };

  const handleOpenSavedMeals = () => {
    setIsSavedMealsExpanded(true);
    scrollToSection('savedMeals');
  };

  const handleAddFoodToMeal = (nextMealType: MealType) => {
    setMealType(nextMealType);
    setExpandedMealType(nextMealType);
    handleOpenAddFood();
  };

  const handleToggleExpandedMeal = (nextMealType: MealType) => {
    setMealType(nextMealType);
    setExpandedMealType((current) => (current === nextMealType ? null : nextMealType));
  };

  const selectedDateMeals = useMemo(
    () =>
      mealTypeOrder.map((type) => {
        const entries = selectedDateFoodEntries.filter((entry) => entry.mealType === type);
        const subtotal = sumNutritionTotals(entries);

        return { entries, subtotal, type };
      }),
    [selectedDateFoodEntries]
  );

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[styles.content, { paddingBottom: safeAreaInsets.bottom + 140 }]}
      keyboardShouldPersistTaps="handled"
      ref={scrollViewRef}
      showsVerticalScrollIndicator={false}
      style={styles.screen}>
      <View style={styles.container}>
        <Text selectable style={styles.pageTitle}>
          Nutrition
        </Text>
        <Text selectable style={styles.pageSubtitle}>
          Date, meals, and one add-food entry point.
        </Text>

        <View style={styles.dateRow}>
          <Pressable onPress={goToPreviousDay} style={styles.dateButton}>
            <Text style={styles.dateButtonLabel}>‹</Text>
          </Pressable>
          <Text selectable style={styles.dateLabel}>
            {selectedDateLabel}
          </Text>
          <Pressable onPress={goToToday} style={styles.todayButton}>
            <Text style={styles.todayButtonLabel}>Today</Text>
          </Pressable>
          <Pressable onPress={goToNextDay} style={styles.dateButton}>
            <Text style={styles.dateButtonLabel}>›</Text>
          </Pressable>
        </View>

        <NutritionOverviewCard dateLabel={selectedDateLabel} summary={nutritionSummary} />

        <MealMenuCard
          entriesByMeal={selectedDateMeals}
          expandedMealType={expandedMealType}
          formatServingInfo={getServingInfo}
          mealTypeLabels={mealTypeLabels}
          onDeleteFoodEntry={confirmDeleteFoodEntry}
          onEditFoodEntry={handleEditFoodEntry}
          onToggleExpandedMeal={handleToggleExpandedMeal}
          selectedMealType={mealType}
        />

        <View
          onLayout={(event: LayoutChangeEvent) => {
            sectionOffsets.current.foodForm = event.nativeEvent.layout.y;
          }}>
          <AddFoodFormSection
            calories={calories}
            carbs={carbs}
            currentMealTotalLabel={currentMealTotalLabel}
            editingFoodEntry={editingFoodEntry}
            fats={fats}
            filteredFoods={browserResults}
            favoriteFoods={favoriteFoods}
            favoriteIds={favoriteFoodIds}
            foodSearchQuery={foodSearchQuery}
            isBrowserExpanded={isFoodBrowserExpanded}
            isExpanded={isAddFoodFormExpanded}
            isSaveDisabled={name.trim().length === 0 || !Number.isFinite(Number(calories)) || Number(calories) <= 0}
            isSearchExpanded={isSearchExpanded}
            mealType={mealType}
            mealTypeLabels={mealTypeLabels}
            modeChips={browserModeChips}
            name={name}
            onCaloriesChange={setCalories}
            onCarbsChange={setCarbs}
            onCancelEdit={clearForm}
            onCategoryChange={setSelectedBrowserCategory}
            onFatsChange={setFats}
            onFoodSearchQueryChange={setFoodSearchQuery}
            onMealTypeChange={setMealType}
            onModeChange={setSelectedBrowserMode}
            onNameChange={handleNameChange}
            onOpenFood={handleOpenBrowserFood}
            onQuickAddFood={handleQuickAddBrowserFood}
            onProteinChange={setProtein}
            onQuantityChange={handleQuantityChange}
            onSaveFood={handleSaveFood}
            onServingSizeChange={handleServingSizeChange}
            onServingUnitChange={handleServingUnitChange}
            onToggleBrowserExpanded={() => setIsFoodBrowserExpanded((current) => !current)}
            onToggleExpanded={() => setIsAddFoodFormExpanded((current) => !current)}
            onToggleFavorite={handleToggleFavoriteFood}
            popularFoods={popularFoods}
            recentFoods={browserRecentFoods}
            selectedCategory={selectedBrowserCategory}
            selectedMode={selectedBrowserMode}
            protein={protein}
            quantity={quantity}
            servingSize={servingSize}
            servingUnit={servingUnit}
            categoryChips={browserCategoryChips}
          />
        </View>

        <FoodDetailSheet
          food={selectedBrowserFood}
          isFavorite={selectedBrowserFood ? favoriteFoodSet.has(selectedBrowserFood.id) : false}
          onAddFood={(servings) => selectedBrowserFood && handleQuickAddBrowserFood(selectedBrowserFood, servings)}
          onClose={handleCloseBrowserFood}
          onSelectSimilar={handleOpenBrowserFood}
          onToggleFavorite={handleToggleFavoriteFood}
          similarFoods={browserSimilarFoods}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    width: '100%',
  },
  content: {
    alignItems: 'center',
    padding: Spacing.three,
  },
  dateButton: {
    alignItems: 'center',
    backgroundColor: Colors.dark.backgroundSelected,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 999,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  dateButtonLabel: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 18,
  },
  dateLabel: {
    color: Colors.dark.text,
    flex: 1,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
    textAlign: 'center',
  },
  dateRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.one,
    justifyContent: 'space-between',
  },
  pageSubtitle: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  pageTitle: {
    color: Colors.dark.text,
    fontSize: 24,
    fontWeight: '900',
  },
  screen: {
    backgroundColor: Colors.dark.background,
    flex: 1,
  },
  todayButton: {
    alignItems: 'center',
    backgroundColor: Colors.dark.backgroundSelected,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
  },
  todayButtonLabel: {
    color: Colors.dark.text,
    fontSize: 13,
    fontWeight: '700',
  },
});
