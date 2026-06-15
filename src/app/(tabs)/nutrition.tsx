import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { MetricCard } from '@/components/ui/MetricCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import type { FoodEntry, MealTemplate, MealType } from '@/context/AppContext';
import { useAppContext } from '@/context/AppContext';

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

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const parseLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);

  return new Date(year, month - 1, day);
};

const addDays = (dateString: string, days: number): string => {
  const date = parseLocalDate(dateString);
  date.setDate(date.getDate() + days);

  return formatLocalDate(date);
};

const mockFoodDatabase: MockFood[] = [
  {
    name: 'Chicken breast',
    source: 'manual',
    servingSize: 100,
    servingUnit: 'g',
    calories: 165,
    protein: 31,
    carbs: 0,
    fats: 3.6,
  },
  {
    name: 'White rice',
    source: 'manual',
    servingSize: 100,
    servingUnit: 'g',
    calories: 130,
    protein: 2.7,
    carbs: 28,
    fats: 0.3,
  },
  {
    name: 'Oats',
    source: 'manual',
    servingSize: 40,
    servingUnit: 'g',
    calories: 150,
    protein: 5,
    carbs: 27,
    fats: 3,
  },
  {
    name: 'Greek yogurt',
    brandName: 'Plain',
    source: 'manual',
    servingSize: 170,
    servingUnit: 'g',
    calories: 100,
    protein: 17,
    carbs: 6,
    fats: 0,
  },
  {
    name: 'Banana',
    source: 'manual',
    servingSize: 1,
    servingUnit: 'medium',
    calories: 105,
    protein: 1.3,
    carbs: 27,
    fats: 0.4,
  },
  {
    name: 'Eggs',
    source: 'manual',
    servingSize: 2,
    servingUnit: 'large',
    calories: 140,
    protein: 12,
    carbs: 1,
    fats: 10,
  },
  {
    name: 'Salmon',
    source: 'manual',
    servingSize: 100,
    servingUnit: 'g',
    calories: 208,
    protein: 20,
    carbs: 0,
    fats: 13,
  },
  {
    name: 'Pasta',
    source: 'manual',
    servingSize: 100,
    servingUnit: 'g',
    calories: 158,
    protein: 5.8,
    carbs: 31,
    fats: 0.9,
  },
  {
    name: 'Whey protein',
    brandName: 'Generic',
    source: 'manual',
    servingSize: 1,
    servingUnit: 'scoop',
    calories: 120,
    protein: 24,
    carbs: 3,
    fats: 1.5,
  },
];

export default function NutritionScreen() {
  const {
    addFoodEntry,
    addFoodEntries,
    addMealTemplate,
    deleteFoodEntry,
    deleteMealTemplate,
    profile,
    weightHistory,
    updateFoodEntry,
    updateNutritionTargets,
    foodEntries,
    mealTemplates,
    nutritionTargets,
  } = useAppContext();
  const safeAreaInsets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState(formatLocalDate(new Date()));
  const [targetCalories, setTargetCalories] = useState(`${nutritionTargets.calories}`);
  const [targetProtein, setTargetProtein] = useState(`${nutritionTargets.protein}`);
  const [targetCarbs, setTargetCarbs] = useState(`${nutritionTargets.carbs}`);
  const [targetFats, setTargetFats] = useState(`${nutritionTargets.fats}`);
  const [foodSearchQuery, setFoodSearchQuery] = useState('');
  const [isTargetsExpanded, setIsTargetsExpanded] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isRecentFoodsExpanded, setIsRecentFoodsExpanded] = useState(false);
  const [isSavedMealsExpanded, setIsSavedMealsExpanded] = useState(false);
  const [isAddFoodFormExpanded, setIsAddFoodFormExpanded] = useState(true);
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
  const parsedCalories = Number(calories);
  const isSaveDisabled = name.trim().length === 0 || !Number.isFinite(parsedCalories) || parsedCalories <= 0;
  const selectedDateFoodEntries = foodEntries.filter((entry) => entry.date === selectedDate);
  const selectedMealFoodEntries = selectedDateFoodEntries.filter((entry) => entry.mealType === mealType);
  const latestWeightEntry = weightHistory[0];
  const latestWeightKg = latestWeightEntry?.weight ?? Number(profile.weight);
  const selectedDateNutrition = selectedDateFoodEntries.reduce(
    (totals, entry) => ({
      calories: totals.calories + entry.calories,
      protein: totals.protein + entry.protein,
      carbs: totals.carbs + entry.carbs,
      fats: totals.fats + entry.fats,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );
  const selectedMealNutrition = selectedMealFoodEntries.reduce(
    (totals, entry) => ({
      calories: totals.calories + entry.calories,
      protein: totals.protein + entry.protein,
      carbs: totals.carbs + entry.carbs,
      fats: totals.fats + entry.fats,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );
  const foodSearchTerm = foodSearchQuery.trim().toLowerCase();
  const filteredMockFoods =
    foodSearchTerm.length === 0
      ? []
      : mockFoodDatabase.filter((food) =>
          [food.name, food.brandName].some((value) => value?.toLowerCase().includes(foodSearchTerm))
        );

  const recentFoods = Array.from(
    foodEntries
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .reduce((recentMap, entry) => {
        const dedupeKey = [
          entry.name.trim().toLowerCase(),
          entry.brandName?.trim().toLowerCase() ?? '',
          entry.source,
          entry.externalId ?? '',
        ].join('|');

        if (!recentMap.has(dedupeKey)) {
          recentMap.set(dedupeKey, entry as RecentFood);
        }

        return recentMap;
      }, new Map<string, RecentFood>())
      .values()
  ).slice(0, 8);
  const isMealTemplateSaveDisabled = mealTemplateName.trim().length === 0 || selectedMealFoodEntries.length === 0;
  const mealTemplateButtonLabel = `Save ${mealTypeLabels[mealType]} Template`;

  const formatGoalType = (value: typeof profile.goalType) => {
    if (value === 'lose_fat') {
      return 'Lose fat';
    }

    if (value === 'maintain') {
      return 'Maintain';
    }

    return 'Gain muscle';
  };

  const suggestedTargets = (() => {
    if (!Number.isFinite(latestWeightKg) || latestWeightKg <= 0) {
      return null;
    }

    const maintenanceCalories = latestWeightKg * 33;
    const baseCalories =
      profile.goalType === 'lose_fat'
        ? maintenanceCalories - 300
        : profile.goalType === 'gain_muscle'
          ? maintenanceCalories + 250
          : maintenanceCalories;
    const suggestedCalories = Math.round(baseCalories / 10) * 10;
    const suggestedProtein = Math.round(latestWeightKg * 2);
    const suggestedFats = Math.round(latestWeightKg * 0.8);
    const proteinCalories = suggestedProtein * 4;
    const fatCalories = suggestedFats * 9;
    const suggestedCarbs = Math.max(0, Math.round((suggestedCalories - proteinCalories - fatCalories) / 4));

    return {
      calories: suggestedCalories,
      protein: suggestedProtein,
      carbs: suggestedCarbs,
      fats: suggestedFats,
    };
  })();

  useEffect(() => {
    setTargetCalories(`${nutritionTargets.calories}`);
    setTargetProtein(`${nutritionTargets.protein}`);
    setTargetCarbs(`${nutritionTargets.carbs}`);
    setTargetFats(`${nutritionTargets.fats}`);
  }, [nutritionTargets]);

  const parseMacro = (value: string) => {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 0;
  };

  const parseOptionalNumber = (value: string) => {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : undefined;
  };

  const parseTarget = (value: string) => {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : 0;
  };

  const formatNumber = (value: number) => {
    return `${Math.round(value * 10) / 10}`;
  };

  const getClampedProgress = (total: number, target: number) => {
    if (target <= 0) {
      return total > 0 ? 1 : 0;
    }

    return Math.min(1, Math.max(0, total / target));
  };

  const formatRemaining = (remaining: number, unit: string) => {
    const formattedValue = `${formatNumber(Math.abs(remaining))}${unit}`;

    return remaining < 0 ? `Over by ${formattedValue}` : `Remaining ${formattedValue}`;
  };

  const formatServingInfo = (entry: {
    servingSize?: number;
    servingUnit?: string;
    quantity?: number;
  }) => {
    if (!entry.servingSize && !entry.servingUnit && !entry.quantity) {
      return null;
    }

    if (entry.quantity && entry.servingUnit) {
      return `${entry.quantity} ${entry.servingUnit}`;
    }

    return [entry.quantity ?? entry.servingSize, entry.servingUnit].filter(Boolean).join(' ') || 'serving';
  };

  const formatMacroTotals = (entryTotals: { calories: number; protein: number; carbs: number; fats: number }) => {
    return `${formatNumber(entryTotals.calories)} kcal / ${formatNumber(entryTotals.protein)} g protein / ${formatNumber(entryTotals.carbs)} g carbs / ${formatNumber(entryTotals.fats)} g fats`;
  };

  const getSectionTitle = (title: string, isExpanded: boolean) => {
    return `${title} ${isExpanded ? '−' : '+'}`;
  };

  const createBaseFoodFromMock = (food: MockFood): SelectedBaseFood => ({
    servingSize: food.servingSize,
    servingUnit: food.servingUnit,
    baseCalories: food.calories,
    baseProtein: food.protein,
    baseCarbs: food.carbs,
    baseFats: food.fats,
  });

  const createBaseFoodFromEntry = (entry: FoodEntry): SelectedBaseFood => {
    const multiplier =
      entry.quantity && entry.servingSize && entry.quantity > 0 && entry.servingSize > 0
        ? entry.quantity / entry.servingSize
        : 0;
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

  const applyCalculatedMacros = (
    baseFood: SelectedBaseFood,
    nextQuantity: string,
    nextServingSize = servingSize
  ) => {
    const parsedServingSize = parseOptionalNumber(nextServingSize) ?? baseFood.servingSize;
    const parsedQuantity = Number(nextQuantity);

    if (
      !Number.isFinite(parsedQuantity) ||
      parsedQuantity <= 0 ||
      parsedServingSize === undefined ||
      parsedServingSize <= 0
    ) {
      setCalories('');
      setProtein('');
      setCarbs('');
      setFats('');
      return;
    }

    const multiplier = parsedQuantity / parsedServingSize;

    setCalories(formatNumber(baseFood.baseCalories * multiplier));
    setProtein(formatNumber(baseFood.baseProtein * multiplier));
    setCarbs(formatNumber(baseFood.baseCarbs * multiplier));
    setFats(formatNumber(baseFood.baseFats * multiplier));
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
  };

  const handleSaveFood = () => {
    if (isSaveDisabled) {
      return;
    }

    const parsedQuantity = parseOptionalNumber(quantity);
    const parsedServingSize = parseOptionalNumber(servingSize) ?? parsedQuantity;
    const baseCalories = selectedBaseFood?.baseCalories ?? parsedCalories;
    const baseProtein = selectedBaseFood?.baseProtein ?? parseMacro(protein);
    const baseCarbs = selectedBaseFood?.baseCarbs ?? parseMacro(carbs);
    const baseFats = selectedBaseFood?.baseFats ?? parseMacro(fats);

    const foodEntry: FoodEntry = {
      id: editingFoodEntry?.id ?? `${Date.now()}`,
      name: name.trim(),
      date: editingFoodEntry?.date ?? selectedDate,
      mealType,
      brandName,
      calories: parsedCalories,
      protein: parseMacro(protein),
      carbs: parseMacro(carbs),
      fats: parseMacro(fats),
      baseCalories,
      baseProtein,
      baseCarbs,
      baseFats,
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
      items: selectedMealFoodEntries.map((entry, index) => ({
        ...entry,
        id: `${templateId}-item-${index}`,
      })),
      createdAt,
    });
    setMealTemplateName('');
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

  const handleSaveTargets = () => {
    updateNutritionTargets({
      calories: parseTarget(targetCalories),
      protein: parseTarget(targetProtein),
      carbs: parseTarget(targetCarbs),
      fats: parseTarget(targetFats),
    });
  };

  const handleApplySuggestedTargets = () => {
    if (!suggestedTargets) {
      return;
    }

    updateNutritionTargets(suggestedTargets);
  };

  const confirmDeleteFoodEntry = (entryId: string) => {
    Alert.alert(
      'Delete food entry?',
      "This entry will be removed from today's nutrition.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteFoodEntry(entryId),
        },
      ],
    );
  };

  const confirmDeleteMealTemplate = (templateId: string) => {
    Alert.alert('Delete saved meal?', 'This template will be removed from your saved meals.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteMealTemplate(templateId),
      },
    ]);
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

  const selectedDateMeals = mealTypeOrder.map((type) => {
    const entries = selectedDateFoodEntries.filter((entry) => entry.mealType === type);
    const subtotal = entries.reduce(
      (totals, entry) => ({
        calories: totals.calories + entry.calories,
        protein: totals.protein + entry.protein,
        carbs: totals.carbs + entry.carbs,
        fats: totals.fats + entry.fats,
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );

    return {
      entries,
      subtotal,
      type,
    };
  });

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: safeAreaInsets.bottom + 140 }]}>
      <View style={styles.container}>
        <SectionHeader title="Nutrition" subtitle="Daily macro snapshot and food entries" />

        <AppCard>
          <Text selectable style={styles.sectionTitle}>
            {selectedDate}
          </Text>
          <View style={styles.dateControls}>
            <AppButton label="Previous Day" onPress={goToPreviousDay} variant="secondary" />
            <AppButton label="Today" onPress={goToToday} variant="secondary" />
            <AppButton label="Next Day" onPress={goToNextDay} variant="secondary" />
          </View>
        </AppCard>

        <View style={styles.grid}>
          <MetricCard
            label="Calories"
            value={`${formatNumber(selectedDateNutrition.calories)} / ${nutritionTargets.calories}`}
            detail="kcal"
          />
          <MetricCard
            label="Protein"
            value={`${formatNumber(selectedDateNutrition.protein)} / ${nutritionTargets.protein} g`}
          />
          <MetricCard
            label="Carbs"
            value={`${formatNumber(selectedDateNutrition.carbs)} / ${nutritionTargets.carbs} g`}
          />
          <MetricCard
            label="Fats"
            value={`${formatNumber(selectedDateNutrition.fats)} / ${nutritionTargets.fats} g`}
          />
        </View>

        <AppCard>
          <Text selectable style={styles.sectionTitle}>
            Daily progress
          </Text>
          <View style={styles.targetRow}>
            <Text selectable style={styles.targetLabel}>
              Calories
            </Text>
            <Text selectable style={styles.targetValue}>
              {formatNumber(selectedDateNutrition.calories)} / {nutritionTargets.calories} kcal
            </Text>
            <Text selectable style={styles.remainingValue}>
              {formatRemaining(nutritionTargets.calories - selectedDateNutrition.calories, ' kcal')}
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${getClampedProgress(selectedDateNutrition.calories, nutritionTargets.calories) * 100}%` },
                ]}
              />
            </View>
          </View>
          <View style={styles.targetRow}>
            <Text selectable style={styles.targetLabel}>
              Protein
            </Text>
            <Text selectable style={styles.targetValue}>
              {formatNumber(selectedDateNutrition.protein)} / {nutritionTargets.protein} g
            </Text>
            <Text selectable style={styles.remainingValue}>
              {formatRemaining(nutritionTargets.protein - selectedDateNutrition.protein, ' g')}
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${getClampedProgress(selectedDateNutrition.protein, nutritionTargets.protein) * 100}%` },
                ]}
              />
            </View>
          </View>
          <View style={styles.targetRow}>
            <Text selectable style={styles.targetLabel}>
              Carbs
            </Text>
            <Text selectable style={styles.targetValue}>
              {formatNumber(selectedDateNutrition.carbs)} / {nutritionTargets.carbs} g
            </Text>
            <Text selectable style={styles.remainingValue}>
              {formatRemaining(nutritionTargets.carbs - selectedDateNutrition.carbs, ' g')}
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${getClampedProgress(selectedDateNutrition.carbs, nutritionTargets.carbs) * 100}%` },
                ]}
              />
            </View>
          </View>
          <View style={styles.targetRow}>
            <Text selectable style={styles.targetLabel}>
              Fats
            </Text>
            <Text selectable style={styles.targetValue}>
              {formatNumber(selectedDateNutrition.fats)} / {nutritionTargets.fats} g
            </Text>
            <Text selectable style={styles.remainingValue}>
              {formatRemaining(nutritionTargets.fats - selectedDateNutrition.fats, ' g')}
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${getClampedProgress(selectedDateNutrition.fats, nutritionTargets.fats) * 100}%` },
                ]}
              />
            </View>
          </View>
        </AppCard>

        <AppCard>
          <Pressable
            onPress={() => setIsTargetsExpanded((current) => !current)}
            style={styles.collapsibleHeader}>
            <Text selectable style={styles.sectionTitle}>
              {getSectionTitle('Nutrition Targets', isTargetsExpanded)}
            </Text>
          </Pressable>

          {isTargetsExpanded ? (
            <>
              <View style={styles.suggestedSummary}>
                <View style={styles.suggestedSummaryRow}>
                  <Text selectable style={styles.targetLabel}>
                    Goal
                  </Text>
                  <Text selectable style={styles.targetValue}>
                    {formatGoalType(profile.goalType)}
                  </Text>
                </View>
                <View style={styles.suggestedSummaryRow}>
                  <Text selectable style={styles.targetLabel}>
                    Latest weight
                  </Text>
                  <Text selectable style={styles.targetValue}>
                    {Number.isFinite(latestWeightKg) && latestWeightKg > 0
                      ? `${latestWeightKg.toFixed(1)} kg`
                      : 'No weight logged yet'}
                  </Text>
                </View>
              </View>

              <View style={styles.suggestedCard}>
                <Text selectable style={styles.suggestedTitle}>
                  Suggested Targets
                </Text>
                {suggestedTargets ? (
                  <>
                    <View style={styles.suggestedGrid}>
                      <View style={styles.suggestedItem}>
                        <Text selectable style={styles.inputLabel}>
                          Calories
                        </Text>
                        <Text selectable style={styles.suggestedValue}>
                          {suggestedTargets.calories}
                        </Text>
                      </View>
                      <View style={styles.suggestedItem}>
                        <Text selectable style={styles.inputLabel}>
                          Protein
                        </Text>
                        <Text selectable style={styles.suggestedValue}>
                          {suggestedTargets.protein} g
                        </Text>
                      </View>
                      <View style={styles.suggestedItem}>
                        <Text selectable style={styles.inputLabel}>
                          Carbs
                        </Text>
                        <Text selectable style={styles.suggestedValue}>
                          {suggestedTargets.carbs} g
                        </Text>
                      </View>
                      <View style={styles.suggestedItem}>
                        <Text selectable style={styles.inputLabel}>
                          Fats
                        </Text>
                        <Text selectable style={styles.suggestedValue}>
                          {suggestedTargets.fats} g
                        </Text>
                      </View>
                    </View>
                    <AppButton
                      label="Apply Suggested Targets"
                      onPress={handleApplySuggestedTargets}
                      variant="secondary"
                    />
                  </>
                ) : (
                  <Text selectable style={styles.remainingValue}>
                    Log a weight entry to generate suggested targets.
                  </Text>
                )}
              </View>

              <View style={styles.inputGrid}>
                <View style={styles.inputGroup}>
                  <Text selectable style={styles.inputLabel}>
                    Calories target
                  </Text>
                  <TextInput
                    keyboardType="decimal-pad"
                    onChangeText={setTargetCalories}
                    placeholder="2800"
                    placeholderTextColor={Colors.dark.textSecondary}
                    style={styles.input}
                    value={targetCalories}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text selectable style={styles.inputLabel}>
                    Protein target
                  </Text>
                  <TextInput
                    keyboardType="decimal-pad"
                    onChangeText={setTargetProtein}
                    placeholder="160"
                    placeholderTextColor={Colors.dark.textSecondary}
                    style={styles.input}
                    value={targetProtein}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text selectable style={styles.inputLabel}>
                    Carbs target
                  </Text>
                  <TextInput
                    keyboardType="decimal-pad"
                    onChangeText={setTargetCarbs}
                    placeholder="350"
                    placeholderTextColor={Colors.dark.textSecondary}
                    style={styles.input}
                    value={targetCarbs}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text selectable style={styles.inputLabel}>
                    Fats target
                  </Text>
                  <TextInput
                    keyboardType="decimal-pad"
                    onChangeText={setTargetFats}
                    placeholder="80"
                    placeholderTextColor={Colors.dark.textSecondary}
                    style={styles.input}
                    value={targetFats}
                  />
                </View>
              </View>

              <AppButton label="Save Targets" onPress={handleSaveTargets} />
            </>
          ) : null}
        </AppCard>

        <AppCard>
          <Pressable
            onPress={() => setIsSearchExpanded((current) => !current)}
            style={styles.collapsibleHeader}>
            <Text selectable style={styles.sectionTitle}>
              {getSectionTitle('Search Food', isSearchExpanded)}
            </Text>
          </Pressable>

          {isSearchExpanded ? (
            <>
              <View style={styles.inputGroup}>
                <TextInput
                  onChangeText={setFoodSearchQuery}
                  placeholder="Search food database"
                  placeholderTextColor={Colors.dark.textSecondary}
                  style={styles.input}
                  value={foodSearchQuery}
                />
              </View>

              {filteredMockFoods.map((food) => (
                <View key={`${food.name}-${food.servingUnit}`} style={styles.searchResult}>
                  <View style={styles.searchResultContent}>
                    <Text selectable style={styles.foodName}>
                      {food.name}
                    </Text>
                    {food.brandName ? (
                      <Text selectable style={styles.foodBrand}>
                        {food.brandName}
                      </Text>
                    ) : null}
                    <Text selectable style={styles.foodMeta}>
                      {food.calories} kcal / {food.protein} g protein / {food.carbs} g carbs / {food.fats} g fats
                    </Text>
                    <Text selectable style={styles.foodServing}>
                      Serving: {[food.servingSize, food.servingUnit].filter(Boolean).join(' ')}
                    </Text>
                  </View>
                  <AppButton label="Use" onPress={() => handleUseMockFood(food)} variant="secondary" />
                </View>
              ))}
            </>
          ) : null}
        </AppCard>

        <AppCard>
          <Pressable
            onPress={() => setIsRecentFoodsExpanded((current) => !current)}
            style={styles.collapsibleHeader}>
            <Text selectable style={styles.sectionTitle}>
              {getSectionTitle('Recent Foods', isRecentFoodsExpanded)}
            </Text>
          </Pressable>

          {isRecentFoodsExpanded ? (
            recentFoods.length > 0 ? (
              recentFoods.map((food) => (
                <View key={`${food.name}-${food.brandName ?? ''}-${food.source}-${food.externalId ?? ''}`} style={styles.searchResult}>
                  <View style={styles.searchResultContent}>
                    <Text selectable style={styles.foodName}>
                      {food.name}
                    </Text>
                    {food.brandName ? (
                      <Text selectable style={styles.foodBrand}>
                        {food.brandName}
                      </Text>
                    ) : null}
                    {formatServingInfo(food) ? (
                      <Text selectable style={styles.foodServing}>
                        Serving: {formatServingInfo(food)}
                      </Text>
                    ) : null}
                    <Text selectable style={styles.foodMeta}>
                      {food.calories} kcal / {food.protein} g protein / {food.carbs} g carbs /{' '}
                      {food.fats} g fats
                    </Text>
                  </View>
                  <AppButton
                    label="Use"
                    onPress={() => handleUseRecentFood(food)}
                    variant="secondary"
                  />
                </View>
              ))
            ) : (
              <Text selectable style={styles.remainingValue}>
                No recent foods yet.
              </Text>
            )
          ) : null}
        </AppCard>

        <AppCard>
          <Pressable
            onPress={() => setIsSavedMealsExpanded((current) => !current)}
            style={styles.collapsibleHeader}>
            <Text selectable style={styles.sectionTitle}>
              {getSectionTitle('Saved Meals', isSavedMealsExpanded)}
            </Text>
          </Pressable>

          {isSavedMealsExpanded ? (
            <>
              <View style={styles.savedMealComposer}>
                <View style={styles.inputGroup}>
                  <Text selectable style={styles.inputLabel}>
                    Template name
                  </Text>
                  <TextInput
                    onChangeText={setMealTemplateName}
                    placeholder="Post-workout lunch"
                    placeholderTextColor={Colors.dark.textSecondary}
                    style={styles.input}
                    value={mealTemplateName}
                  />
                </View>

                <Text selectable style={styles.remainingValue}>
                  Save the current {mealTypeLabels[mealType]} entries for {selectedDate}. This will store{' '}
                  {selectedMealFoodEntries.length} item{selectedMealFoodEntries.length === 1 ? '' : 's'}.
                </Text>
                <Text selectable style={styles.templateSummaryLabel}>
                  Template source: {mealTypeLabels[mealType]}
                </Text>
                <Text selectable style={styles.templateSummaryLabel}>
                  Foods in current meal: {selectedMealFoodEntries.length}
                </Text>
                <Text selectable style={styles.templateSummaryLabel}>
                  Current meal calories: {formatNumber(selectedMealNutrition.calories)} kcal
                </Text>

                <AppButton
                  disabled={isMealTemplateSaveDisabled}
                  label={mealTemplateButtonLabel}
                  onPress={handleSaveMealTemplate}
                />
              </View>

              {mealTemplates.length > 0 ? (
                mealTemplates.map((template) => {
                  const templateTotals = template.items.reduce(
                    (totals, entry) => ({
                      calories: totals.calories + entry.calories,
                      protein: totals.protein + entry.protein,
                      carbs: totals.carbs + entry.carbs,
                      fats: totals.fats + entry.fats,
                    }),
                    { calories: 0, protein: 0, carbs: 0, fats: 0 }
                  );

                  return (
                    <View key={template.id} style={styles.savedMealItem}>
                      <View style={styles.savedMealItemContent}>
                        <Text selectable style={styles.foodName}>
                          {template.name}
                        </Text>
                        <Text selectable style={styles.foodMeta}>
                          {formatMacroTotals(templateTotals)}
                        </Text>
                        <Text selectable style={styles.foodServing}>
                          {template.items.length} item{template.items.length === 1 ? '' : 's'}
                        </Text>
                      </View>
                      <View style={styles.savedMealActions}>
                        <AppButton
                          label="Use"
                          onPress={() => handleUseMealTemplate(template)}
                          variant="secondary"
                        />
                        <AppButton
                          label="Delete"
                          onPress={() => confirmDeleteMealTemplate(template.id)}
                          variant="secondary"
                        />
                      </View>
                    </View>
                  );
                })
              ) : (
                <Text selectable style={styles.remainingValue}>
                  No saved meals yet.
                </Text>
              )}
            </>
          ) : null}
        </AppCard>

        <AppCard>
          <Pressable
            onPress={() => setIsAddFoodFormExpanded((current) => !current)}
            style={styles.collapsibleHeader}>
            <Text selectable style={styles.sectionTitle}>
              {getSectionTitle(editingFoodEntry ? 'Edit Food' : 'Add Food form', isAddFoodFormExpanded)}
            </Text>
          </Pressable>

          {isAddFoodFormExpanded ? (
            <>
              <View style={styles.inputGroup}>
                <Text selectable style={styles.inputLabel}>
                  Name
                </Text>
                <TextInput
                  onChangeText={handleNameChange}
                  placeholder="Food name"
                  placeholderTextColor={Colors.dark.textSecondary}
                  style={styles.input}
                  value={name}
                />
              </View>

              <Text selectable style={styles.inputLabel}>
                Meal type
              </Text>
              <View style={styles.mealTypeRow}>
                {mealTypeOrder.map((type) => (
                  <AppButton
                    key={type}
                    label={mealTypeLabels[type]}
                    onPress={() => setMealType(type)}
                    variant={mealType === type ? 'primary' : 'secondary'}
                  />
                ))}
              </View>

              <View style={styles.mealSummary}>
                <Text selectable style={styles.remainingValue}>
                  Current {mealTypeLabels[mealType]} total: {formatMacroTotals(selectedMealNutrition)}
                </Text>
              </View>

              <View style={styles.inputGrid}>
                <View style={styles.inputGroup}>
                  <Text selectable style={styles.inputLabel}>
                    Calories
                  </Text>
                  <TextInput
                    keyboardType="decimal-pad"
                    onChangeText={setCalories}
                    placeholder="0"
                    placeholderTextColor={Colors.dark.textSecondary}
                    style={styles.input}
                    value={calories}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text selectable style={styles.inputLabel}>
                    Protein
                  </Text>
                  <TextInput
                    keyboardType="decimal-pad"
                    onChangeText={setProtein}
                    placeholder="0"
                    placeholderTextColor={Colors.dark.textSecondary}
                    style={styles.input}
                    value={protein}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text selectable style={styles.inputLabel}>
                    Carbs
                  </Text>
                  <TextInput
                    keyboardType="decimal-pad"
                    onChangeText={setCarbs}
                    placeholder="0"
                    placeholderTextColor={Colors.dark.textSecondary}
                    style={styles.input}
                    value={carbs}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text selectable style={styles.inputLabel}>
                    Fats
                  </Text>
                  <TextInput
                    keyboardType="decimal-pad"
                    onChangeText={setFats}
                    placeholder="0"
                    placeholderTextColor={Colors.dark.textSecondary}
                    style={styles.input}
                    value={fats}
                  />
                </View>
              </View>

              <View style={styles.inputGrid}>
                <View style={styles.inputGroup}>
                  <Text selectable style={styles.inputLabel}>
                    Serving size
                  </Text>
                  <TextInput
                    keyboardType="decimal-pad"
                    onChangeText={handleServingSizeChange}
                    placeholder="100"
                    placeholderTextColor={Colors.dark.textSecondary}
                    style={styles.input}
                    value={servingSize}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text selectable style={styles.inputLabel}>
                    Serving unit
                  </Text>
                  <TextInput
                    onChangeText={handleServingUnitChange}
                    placeholder="g"
                    placeholderTextColor={Colors.dark.textSecondary}
                    style={styles.input}
                    value={servingUnit}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text selectable style={styles.inputLabel}>
                    Quantity
                  </Text>
                  <TextInput
                    keyboardType="decimal-pad"
                    onChangeText={handleQuantityChange}
                    placeholder="0"
                    placeholderTextColor={Colors.dark.textSecondary}
                    style={styles.input}
                    value={quantity}
                  />
                </View>
              </View>

              <AppButton disabled={isSaveDisabled} label="Save Food" onPress={handleSaveFood} />
              {editingFoodEntry ? (
                <AppButton label="Cancel Edit" onPress={clearForm} variant="secondary" />
              ) : null}
            </>
          ) : null}
        </AppCard>

        <AppCard>
          <Text selectable style={styles.sectionTitle}>
            Food entries
          </Text>
          {selectedDateMeals.map(({ entries, subtotal, type }) => {
            if (entries.length === 0) {
              return null;
            }

            return (
              <View key={type} style={styles.mealGroup}>
                <View style={styles.mealHeader}>
                  <Text selectable style={styles.mealTitle}>
                    {mealTypeLabels[type]}
                  </Text>
                  <Text selectable style={styles.mealSubtotal}>
                    {subtotal.calories.toFixed(0)} kcal
                  </Text>
                </View>
                {entries.map((entry) => (
                  <View key={entry.id} style={styles.foodRow}>
                    <Text selectable style={styles.foodName}>
                      {entry.name}
                    </Text>
                    {entry.brandName ? (
                      <Text selectable style={styles.foodBrand}>
                        {entry.brandName}
                      </Text>
                    ) : null}
                    {formatServingInfo(entry) ? (
                      <Text selectable style={styles.foodServing}>
                        Serving: {formatServingInfo(entry)}
                      </Text>
                    ) : null}
                    <Text selectable style={styles.foodMeta}>
                      {entry.calories} kcal / {entry.protein} g protein / {entry.carbs} g carbs /{' '}
                      {entry.fats} g fats
                    </Text>
                    <AppButton
                      label="Edit"
                      onPress={() => handleEditFoodEntry(entry)}
                      variant="secondary"
                    />
                    <AppButton
                      label="Delete"
                      onPress={() => confirmDeleteFoodEntry(entry.id)}
                      variant="secondary"
                    />
                  </View>
                ))}
              </View>
            );
          })}
        </AppCard>
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
    paddingBottom: Spacing.six,
  },
  collapsibleHeader: {
    paddingBottom: Spacing.two,
  },
  dateControls: {
    gap: Spacing.two,
  },
  foodMeta: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
    lineHeight: 20,
  },
  foodBrand: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  foodName: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
    width: '100%',
  },
  foodRow: {
    borderColor: Colors.dark.border,
    borderTopWidth: 1,
    gap: Spacing.one,
    paddingTop: Spacing.three,
  },
  foodServing: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  mealGroup: {
    gap: Spacing.two,
    paddingTop: Spacing.two,
  },
  mealHeader: {
    alignItems: 'center',
    borderColor: Colors.dark.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
  },
  mealSubtotal: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  mealTitle: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '800',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  input: {
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: 1,
    color: Colors.dark.text,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: Spacing.two,
  },
  inputGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  inputGroup: {
    flex: 1,
    gap: Spacing.one,
    minWidth: 130,
  },
  inputLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  mealTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.two,
    marginTop: Spacing.one,
  },
  suggestedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  suggestedItem: {
    flex: 1,
    gap: Spacing.one,
    minWidth: 120,
  },
  suggestedCard: {
    borderColor: Colors.dark.border,
    borderTopWidth: 1,
    gap: Spacing.two,
    marginBottom: Spacing.three,
    paddingTop: Spacing.two,
  },
  suggestedSummary: {
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  suggestedSummaryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  suggestedTitle: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: Spacing.two,
  },
  suggestedValue: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '800',
  },
  progressFill: {
    backgroundColor: Colors.dark.accent,
    borderRadius: 999,
    height: '100%',
  },
  progressTrack: {
    backgroundColor: Colors.dark.backgroundElement,
    borderColor: Colors.dark.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 10,
    overflow: 'hidden',
    width: '100%',
  },
  screen: {
    backgroundColor: Colors.dark.background,
    flex: 1,
  },
  searchResult: {
    borderColor: Colors.dark.border,
    borderTopWidth: 1,
    gap: Spacing.two,
    paddingTop: Spacing.three,
  },
  searchResultContent: {
    gap: Spacing.one,
  },
  savedMealActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  savedMealComposer: {
    borderColor: Colors.dark.border,
    borderTopWidth: 1,
    gap: Spacing.two,
    marginBottom: Spacing.three,
    paddingTop: Spacing.two,
  },
  savedMealItem: {
    borderColor: Colors.dark.border,
    borderTopWidth: 1,
    gap: Spacing.two,
    paddingTop: Spacing.three,
  },
  savedMealItemContent: {
    gap: Spacing.one,
  },
  mealSummary: {
    marginBottom: Spacing.two,
  },
  sectionTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '800',
  },
  remainingValue: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    width: '100%',
  },
  templateSummaryLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    width: '100%',
  },
  targetLabel: {
    color: Colors.dark.text,
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  targetRow: {
    borderColor: Colors.dark.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
  },
  targetValue: {
    color: Colors.dark.text,
    fontSize: 15,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
  },
});
