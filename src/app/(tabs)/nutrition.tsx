import { useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddFoodFormSection } from '@/components/nutrition/AddFoodFormSection';
import { MealMenuCard } from '@/components/nutrition/MealMenuCard';
import { NutritionActionsCard } from '@/components/nutrition/NutritionActionsCard';
import { NutritionEmptyState } from '@/components/nutrition/NutritionEmptyState';
import { NutritionOverviewCard } from '@/components/nutrition/NutritionOverviewCard';
import { RecentFoodsSection } from '@/components/nutrition/RecentFoodsSection';
import { SavedMealsSection } from '@/components/nutrition/SavedMealsSection';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { addDays, formatLocalDate, getServingInfo, parseOptionalPositiveNumber, parsePositiveNumber, sumNutritionTotals } from '@/lib';
import { formatCompactMacroTotals, getNutritionSummary } from '@/lib/nutrition';
import type { FoodEntry, MealTemplate, MealType } from '@/context/AppContext';

type MockFood = Pick<
  FoodEntry,
  'name' | 'brandName' | 'source' | 'servingSize' | 'servingUnit' | 'calories' | 'protein' | 'carbs' | 'fats'
>;

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

const mockFoodDatabase: MockFood[] = [
  { name: 'Chicken breast', source: 'manual', servingSize: 100, servingUnit: 'g', calories: 165, protein: 31, carbs: 0, fats: 3.6 },
  { name: 'White rice', source: 'manual', servingSize: 100, servingUnit: 'g', calories: 130, protein: 2.7, carbs: 28, fats: 0.3 },
  { name: 'Oats', source: 'manual', servingSize: 40, servingUnit: 'g', calories: 150, protein: 5, carbs: 27, fats: 3 },
  { name: 'Greek yogurt', brandName: 'Plain', source: 'manual', servingSize: 170, servingUnit: 'g', calories: 100, protein: 17, carbs: 6, fats: 0 },
  { name: 'Banana', source: 'manual', servingSize: 1, servingUnit: 'medium', calories: 105, protein: 1.3, carbs: 27, fats: 0.4 },
  { name: 'Eggs', source: 'manual', servingSize: 2, servingUnit: 'large', calories: 140, protein: 12, carbs: 1, fats: 10 },
  { name: 'Salmon', source: 'manual', servingSize: 100, servingUnit: 'g', calories: 208, protein: 20, carbs: 0, fats: 13 },
  { name: 'Pasta', source: 'manual', servingSize: 100, servingUnit: 'g', calories: 158, protein: 5.8, carbs: 31, fats: 0.9 },
  { name: 'Whey protein', brandName: 'Generic', source: 'manual', servingSize: 1, servingUnit: 'scoop', calories: 120, protein: 24, carbs: 3, fats: 1.5 },
];

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

  const foodSearchTerm = foodSearchQuery.trim().toLowerCase();
  const filteredMockFoods =
    foodSearchTerm.length === 0
      ? []
      : mockFoodDatabase.filter((food) => [food.name, food.brandName].some((value) => value?.toLowerCase().includes(foodSearchTerm)));

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

  const isMealTemplateSaveDisabled = mealTemplateName.trim().length === 0 || selectedMealFoodEntries.length === 0;
  const mealTemplateButtonLabel = `Save ${currentMealLabel} Template`;
  const hasFoodLoggedToday = selectedDateFoodEntries.length > 0;

  const createBaseFoodFromMock = (food: MockFood): SelectedBaseFood => ({
    servingSize: food.servingSize,
    servingUnit: food.servingUnit,
    baseCalories: food.calories,
    baseProtein: food.protein,
    baseCarbs: food.carbs,
    baseFats: food.fats,
  });

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

  const handleUseMockFood = (food: MockFood) => {
    const nextQuantity = `${food.servingSize ?? 1}`;
    const baseFood = createBaseFoodFromMock(food);
    setName(food.name);
    setBrandName(food.brandName);
    setDraftFoodSource(food.source);
    setDraftFoodExternalId(undefined);
    setSelectedBaseFood(baseFood);
    setServingSize(food.servingSize ? `${food.servingSize}` : '');
    setServingUnit(food.servingUnit ?? '');
    setQuantity(nextQuantity);
    applyCalculatedMacros(baseFood, nextQuantity, food.servingSize ? `${food.servingSize}` : '');
  };

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
          Fast food diary, grouped actions, and clear daily progress.
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
        <NutritionActionsCard onAddFood={handleOpenAddFood} onOpenRecentFoods={handleOpenRecentFoods} onOpenSavedMeals={handleOpenSavedMeals} onOpenSearch={handleOpenSearch} />

        {!hasFoodLoggedToday ? (
          <NutritionEmptyState
            description="Start the diary by logging one food item. The meal cards below will stay ready for quick entry."
            title="No food logged today"
          />
        ) : null}

        <MealMenuCard
          entriesByMeal={selectedDateMeals}
          expandedMealType={expandedMealType}
          formatServingInfo={getServingInfo}
          mealTypeLabels={mealTypeLabels}
          onAddFoodToMeal={handleAddFoodToMeal}
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
            filteredFoods={filteredMockFoods}
            foodSearchQuery={foodSearchQuery}
            isExpanded={isAddFoodFormExpanded}
            isSaveDisabled={name.trim().length === 0 || !Number.isFinite(Number(calories)) || Number(calories) <= 0}
            isSearchExpanded={isSearchExpanded}
            mealType={mealType}
            mealTypeLabels={mealTypeLabels}
            name={name}
            onCaloriesChange={setCalories}
            onCarbsChange={setCarbs}
            onCancelEdit={clearForm}
            onFatsChange={setFats}
            onFoodSearchQueryChange={setFoodSearchQuery}
            onMealTypeChange={setMealType}
            onNameChange={handleNameChange}
            onProteinChange={setProtein}
            onQuantityChange={handleQuantityChange}
            onSaveFood={handleSaveFood}
            onServingSizeChange={handleServingSizeChange}
            onServingUnitChange={handleServingUnitChange}
            onToggleExpanded={() => setIsAddFoodFormExpanded((current) => !current)}
            onUseFood={handleUseMockFood}
            protein={protein}
            quantity={quantity}
            servingSize={servingSize}
            servingUnit={servingUnit}
          />
        </View>

        <View
          onLayout={(event: LayoutChangeEvent) => {
            sectionOffsets.current.recentFoods = event.nativeEvent.layout.y;
          }}>
          <RecentFoodsSection
            formatServingInfo={getServingInfo}
            isExpanded={isRecentFoodsExpanded}
            onToggleExpanded={() => setIsRecentFoodsExpanded((current) => !current)}
            onUseRecentFood={handleUseRecentFood}
            recentFoods={recentFoods}
          />
        </View>

        <View
          onLayout={(event: LayoutChangeEvent) => {
            sectionOffsets.current.savedMeals = event.nativeEvent.layout.y;
          }}>
          <SavedMealsSection
            currentMealCount={currentMealEntriesCount}
            currentMealLabel={currentMealLabel}
            currentMealNutritionLabel={currentMealTotalLabel}
            isExpanded={isSavedMealsExpanded}
            isMealTemplateSaveDisabled={isMealTemplateSaveDisabled}
            mealTemplateButtonLabel={mealTemplateButtonLabel}
            mealTemplateName={mealTemplateName}
            mealTemplates={mealTemplates}
            onDeleteMealTemplate={confirmDeleteMealTemplate}
            onDuplicateMealTemplate={handleDuplicateMealTemplate}
            onMealTemplateNameChange={setMealTemplateName}
            onSaveMealTemplate={handleSaveMealTemplate}
            onToggleExpanded={() => setIsSavedMealsExpanded((current) => !current)}
            onUseMealTemplate={handleUseMealTemplate}
            selectedDateLabel={selectedDateLabel}
            selectedMealEntriesCount={currentMealEntriesCount}
            selectedMealTypeLabel={currentMealLabel}
          />
        </View>
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
