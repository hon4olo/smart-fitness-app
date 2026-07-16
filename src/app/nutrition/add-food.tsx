import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { ListRow } from '@/components/ui/ListRow';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Colors, MaxContentWidth, Radii, Spacing, Typography } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { foodCatalog } from '@/data/foods';
import {
  buildFoodEntryFromCatalog,
  formatCompactMacroTotals,
  formatFoodMacros,
  formatFoodServing,
  formatNumber,
  resolveFoodCatalogItem,
  searchFoodCatalog,
  sumNutritionTotals,
} from '@/lib/nutrition';
import type { FoodCatalogItem, FoodEntry, MealTemplate, MealType } from '@/types';
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

export default function NutritionAddFoodScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const {
    addFoodEntries,
    addFoodEntry,
    addMealTemplate,
    deleteMealTemplate,
    foodEntries,
    mealTemplates,
    updateFoodEntry,
  } = useAppContext();
  const params = useLocalSearchParams<{ date?: string; entryId?: string; meal?: MealType }>();
  const selectedDate = typeof params.date === 'string' && params.date.length > 0 ? params.date : new Date().toISOString().slice(0, 10);
  const selectedMeal: MealType = params.meal === 'lunch' || params.meal === 'dinner' || params.meal === 'snack' ? params.meal : 'breakfast';
  const entryId = typeof params.entryId === 'string' && params.entryId.length > 0 ? params.entryId : undefined;

  const selectedDateEntries = useMemo(
    () => foodEntries.filter((entry) => entry.date === selectedDate),
    [foodEntries, selectedDate]
  );
  const selectedMealEntries = useMemo(
    () => selectedDateEntries.filter((entry) => entry.mealType === selectedMeal),
    [selectedDateEntries, selectedMeal]
  );
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

  const editingEntry = useMemo(() => foodEntries.find((entry) => entry.id === entryId), [entryId, foodEntries]);
  const defaultCatalogResults = useMemo(() => searchFoodCatalog(foodCatalog, query, { favoriteIds: favoriteIds.length > 0 ? favoriteIds : favoriteSeedIds, recentIds: recentCatalogIds }), [favoriteIds, favoriteSeedIds, query, recentCatalogIds]);
  const favoriteFoods = useMemo(
    () => foodCatalog.filter((food) => favoriteIds.includes(food.id) || favoriteSeedIds.includes(food.id)),
    [favoriteIds, favoriteSeedIds]
  );
  const mealTotals = useMemo(
    () => sumNutritionTotals(selectedMealEntries),
    [selectedMealEntries]
  );
  const selectedMealLabel = mealTypeLabels[selectedMeal];
  const selectedMealCountLabel = `${selectedMealEntries.length} item${selectedMealEntries.length === 1 ? '' : 's'}`;
  const selectedDateLabel = formatScreenDate(selectedDate);

  useEffect(() => {
    if (editingEntry) {
      const catalogFood = resolveFoodCatalogItem(editingEntry);
      const servingSize = editingEntry.servingSize ?? catalogFood?.servingSize ?? editingEntry.quantity ?? 1;
      const servingUnit = editingEntry.servingUnit ?? catalogFood?.servingUnit ?? 'unit';
      setSelectedDraft({
        brandName: editingEntry.brandName,
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
    if (mode === 'recent' && recentItems.length === 0) {
      setMode('food');
    }
  }, [mode, recentItems.length]);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.six }]}
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
            <AppCard>
              <View style={styles.searchRow}>
                <TextInput
                  accessibilityLabel="Search food"
                  autoCapitalize="none"
                  autoCorrect={false}
                  clearButtonMode="while-editing"
                  onChangeText={setQuery}
                  placeholder="Search food"
                  placeholderTextColor={colors.textSecondary}
                  style={styles.searchInput}
                  value={query}
                />
                {query.length > 0 ? (
                  <Pressable accessibilityLabel="Clear search" hitSlop={10} onPress={() => setQuery('')} style={styles.clearButton}>
                    <Text style={styles.clearButtonText}>×</Text>
                  </Pressable>
                ) : null}
              </View>

              <View style={styles.listGap}>
                {searchResults.length > 0 ? (
                  searchResults.map((food) => {
                    const favorite = favoriteIds.includes(food.id) || favoriteSeedIds.includes(food.id);
                    return (
                      <ListRow
                        key={food.id}
                        accessibilityHint="Tap to set a portion before adding"
                        detail={`${formatFoodServing(food)} · ${formatFoodMacros(food)}`}
                        onPress={() => openDraftFromCatalog(food)}
                        title={food.name}
                        trailing={
                          <View style={styles.rowActions}>
                            <Pressable
                              accessibilityLabel={`${favorite ? 'Remove' : 'Add'} ${food.name} from favorites`}
                              hitSlop={10}
                              onPress={() => toggleFavorite(food.id)}
                              style={styles.iconButton}>
                              <Text style={styles.iconButtonText}>{favorite ? '★' : '☆'}</Text>
                            </Pressable>
                            <Pressable
                              accessibilityLabel={`Quick add ${food.name} to ${selectedMealLabel}`}
                              hitSlop={10}
                              onPress={() => quickAddCatalogFood(food)}
                              style={styles.iconButton}>
                              <Text style={styles.iconButtonText}>+</Text>
                            </Pressable>
                          </View>
                        }
                        value={`${formatNumber(food.calories)} kcal`}
                      />
                    );
                  })
                ) : (
                  <Text selectable style={styles.emptyStateText}>
                    No food found
                  </Text>
                )}
              </View>
            </AppCard>
          ) : null}

          {mode === 'recent' ? (
            <AppCard>
              <View style={styles.sectionHeader}>
                <Text selectable style={styles.sectionTitle}>
                  Recent foods
                </Text>
              </View>
              {recentItems.length > 0 ? (
                <View style={styles.listGap}>
                  {recentItems.map((item) => (
                    <ListRow
                      key={item.key}
                      accessibilityHint="Tap to adjust the portion"
                      detail={`${item.portionLabel} · ${item.entry.brandName ?? 'recent'} `}
                      onPress={() => {
                        if (item.catalogFood) {
                          openDraftFromCatalog(item.catalogFood, item.entry.quantity ?? item.catalogFood.servingSize);
                          return;
                        }

                        setSelectedDraft({
                          brandName: item.entry.brandName,
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
                      }}
                      title={item.label}
                      trailing={
                        <Pressable
                          accessibilityLabel={`Quick add ${item.label} to ${selectedMealLabel}`}
                          hitSlop={10}
                          onPress={() => quickAddRecent(item)}
                          style={styles.iconButton}>
                          <Text style={styles.iconButtonText}>+</Text>
                        </Pressable>
                      }
                      value={item.caloriesLabel}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.emptyBlock}>
                  <Text selectable style={styles.emptyStateText}>
                    No recent foods yet.
                  </Text>
                  <AppButton label="Search food" onPress={() => setMode('food')} variant="secondary" />
                </View>
              )}
            </AppCard>
          ) : null}

          {mode === 'favorites' ? (
            <AppCard>
              <View style={styles.sectionHeader}>
                <Text selectable style={styles.sectionTitle}>
                  Favorites
                </Text>
              </View>
              {favoriteFoods.length > 0 ? (
                <View style={styles.listGap}>
                  {favoriteFoods.map((food) => (
                    <ListRow
                      key={food.id}
                      accessibilityHint="Tap to set a portion before adding"
                      detail={`${formatFoodServing(food)} · ${formatFoodMacros(food)}`}
                      onPress={() => openDraftFromCatalog(food)}
                      title={food.name}
                      trailing={
                        <Pressable
                          accessibilityLabel={`Quick add ${food.name} to ${selectedMealLabel}`}
                          hitSlop={10}
                          onPress={() => quickAddCatalogFood(food)}
                          style={styles.iconButton}>
                          <Text style={styles.iconButtonText}>+</Text>
                        </Pressable>
                      }
                      value={`${formatNumber(food.calories)} kcal`}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.emptyBlock}>
                  <Text selectable style={styles.emptyStateText}>
                    No favorites yet.
                  </Text>
                  <AppButton label="Search food" onPress={() => setMode('food')} variant="secondary" />
                </View>
              )}
            </AppCard>
          ) : null}

          {mode === 'meals' ? (
            <AppCard>
              <View style={styles.sectionHeader}>
                <Text selectable style={styles.sectionTitle}>
                  Meals
                </Text>
              </View>

              <View style={styles.secondaryActions}>
                <AppButton label="Create Meal" onPress={() => setCreateMealOpen((current) => !current)} variant="secondary" />
                <AppButton label="Manage Meals" onPress={() => setManageMealsOpen((current) => !current)} variant="secondary" />
              </View>

              {createMealOpen ? (
                <View style={styles.inlineForm}>
                  <TextInput
                    accessibilityLabel="Meal name"
                    autoCapitalize="words"
                    onChangeText={setMealTemplateName}
                    placeholder="Meal name"
                    placeholderTextColor={colors.textSecondary}
                    style={styles.input}
                    value={mealTemplateName}
                  />
                  <Text selectable style={styles.helperText}>
                    Saves the current {selectedMealLabel.toLowerCase()} diary items as a reusable meal.
                  </Text>
                  <AppButton label="Save meal" onPress={saveMealTemplateFromDiary} />
                </View>
              ) : null}

              {mealTemplates.length > 0 ? (
                <View style={styles.listGap}>
                  {mealTemplates.map((template) => {
                    const templateTotals = sumNutritionTotals(template.items);
                    return (
                      <ListRow
                        key={template.id}
                        accessibilityHint="Add this saved meal to the selected day and meal"
                        detail={`${template.items.length} item${template.items.length === 1 ? '' : 's'} · ${formatCompactMacroTotals(templateTotals)}`}
                        onPress={() => quickAddMealTemplate(template)}
                        title={template.name}
                        trailing={
                          <View style={styles.rowActions}>
                            <Pressable
                              accessibilityLabel={`Add ${template.name} to ${selectedMealLabel}`}
                              hitSlop={10}
                              onPress={() => quickAddMealTemplate(template)}
                              style={styles.iconButton}>
                              <Text style={styles.iconButtonText}>+</Text>
                            </Pressable>
                            {manageMealsOpen ? (
                              <Pressable
                                accessibilityLabel={`Delete ${template.name}`}
                                hitSlop={10}
                                onPress={() => deleteMealTemplate(template.id)}
                                style={styles.iconButton}>
                                <Text style={styles.iconButtonText}>×</Text>
                              </Pressable>
                            ) : null}
                          </View>
                        }
                        value={`${formatNumber(templateTotals.calories)} kcal`}
                      />
                    );
                  })}
                </View>
              ) : (
                <View style={styles.emptyBlock}>
                  <Text selectable style={styles.emptyStateText}>
                    No saved meals yet.
                  </Text>
                </View>
              )}
            </AppCard>
          ) : null}

          <AppCard>
            <View style={styles.sectionHeader}>
              <Text selectable style={styles.sectionTitle}>
                Footer actions
              </Text>
            </View>
            <View style={styles.secondaryActions}>
              <AppButton label="Create Food" onPress={() => setCreateFoodOpen((current) => !current)} variant="secondary" />
              <AppButton label="Create Meal" onPress={() => setMode('meals')} variant="secondary" />
            </View>
            {createFoodOpen ? (
              <View style={styles.inlineForm}>
                <TextInput
                  accessibilityLabel="Food name"
                  autoCapitalize="words"
                  onChangeText={setFoodName}
                  placeholder="Food name"
                  placeholderTextColor={colors.textSecondary}
                  style={styles.input}
                  value={foodName}
                />
                <TextInput
                  accessibilityLabel="Brand"
                  autoCapitalize="words"
                  onChangeText={setFoodBrand}
                  placeholder="Brand (optional)"
                  placeholderTextColor={colors.textSecondary}
                  style={styles.input}
                  value={foodBrand}
                />
                <View style={styles.grid}>
                  <TextInput
                    accessibilityLabel="Serving size"
                    keyboardType="decimal-pad"
                    onChangeText={setFoodServingSize}
                    placeholder="Serving size"
                    placeholderTextColor={colors.textSecondary}
                    style={styles.input}
                    value={foodServingSize}
                  />
                  <TextInput
                    accessibilityLabel="Serving unit"
                    onChangeText={setFoodServingUnit}
                    placeholder="Serving unit"
                    placeholderTextColor={colors.textSecondary}
                    style={styles.input}
                    value={foodServingUnit}
                  />
                </View>
                <TextInput
                  accessibilityLabel="Quantity"
                  keyboardType="decimal-pad"
                  onChangeText={setFoodQuantity}
                  placeholder="Quantity"
                  placeholderTextColor={colors.textSecondary}
                  style={styles.input}
                  value={foodQuantity}
                />
                <View style={styles.grid}>
                  <TextInput
                    accessibilityLabel="Calories"
                    keyboardType="decimal-pad"
                    onChangeText={setFoodCalories}
                    placeholder="Calories"
                    placeholderTextColor={colors.textSecondary}
                    style={styles.input}
                    value={foodCalories}
                  />
                  <TextInput
                    accessibilityLabel="Protein"
                    keyboardType="decimal-pad"
                    onChangeText={setFoodProtein}
                    placeholder="Protein"
                    placeholderTextColor={colors.textSecondary}
                    style={styles.input}
                    value={foodProtein}
                  />
                </View>
                <View style={styles.grid}>
                  <TextInput
                    accessibilityLabel="Carbs"
                    keyboardType="decimal-pad"
                    onChangeText={setFoodCarbs}
                    placeholder="Carbs"
                    placeholderTextColor={colors.textSecondary}
                    style={styles.input}
                    value={foodCarbs}
                  />
                  <TextInput
                    accessibilityLabel="Fats"
                    keyboardType="decimal-pad"
                    onChangeText={setFoodFats}
                    placeholder="Fats"
                    placeholderTextColor={colors.textSecondary}
                    style={styles.input}
                    value={foodFats}
                  />
                </View>
                <AppButton label="Add food" onPress={saveCustomFood} />
              </View>
            ) : null}
          </AppCard>
        </View>
      </ScrollView>

      {selectedDraft ? (
        <View style={[styles.sheetBackdrop, { paddingBottom: insets.bottom + Spacing.two }]} pointerEvents="box-none">
          <Pressable accessibilityLabel="Close portion editor" onPress={() => setSelectedDraft(null)} style={styles.sheetScrim} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <View>
                <Text selectable style={styles.sheetTitle}>
                  {selectedDraft.name}
                </Text>
                <Text selectable style={styles.sheetSubtitle}>
                  {selectedMealLabel} · {selectedDateLabel}
                </Text>
              </View>
              <Pressable accessibilityLabel="Close portion editor" hitSlop={10} onPress={() => setSelectedDraft(null)} style={styles.sheetClose}>
                <Text style={styles.sheetCloseText}>×</Text>
              </Pressable>
            </View>

            {selectedDraft.brandName ? (
              <Text selectable style={styles.sheetMeta}>
                {selectedDraft.brandName}
              </Text>
            ) : null}
            <Text selectable style={styles.sheetMeta}>
              {formatFoodServing({ servingSize: selectedDraft.servingSize, servingUnit: selectedDraft.servingUnit })}
            </Text>

            <View style={styles.sheetField}>
              <Text selectable style={styles.sheetLabel}>
                Quantity
              </Text>
              <TextInput
                accessibilityLabel="Quantity"
                autoFocus
                keyboardType="decimal-pad"
                onChangeText={(value) => setSelectedDraft((current) => (current ? { ...current, quantity: value } : current))}
                placeholder="Quantity"
                placeholderTextColor={colors.textSecondary}
                style={styles.sheetInput}
                value={selectedDraft.quantity}
              />
            </View>

            <View style={styles.sheetTotals}>
              <Text selectable style={styles.sheetTotalLine}>
                {formatCompactMacroTotals({
                  calories: Math.round(selectedDraft.calories * (parseNumber(selectedDraft.quantity, selectedDraft.servingSize) / selectedDraft.servingSize) * 10) / 10,
                  carbs: Math.round(selectedDraft.carbs * (parseNumber(selectedDraft.quantity, selectedDraft.servingSize) / selectedDraft.servingSize) * 10) / 10,
                  fats: Math.round(selectedDraft.fats * (parseNumber(selectedDraft.quantity, selectedDraft.servingSize) / selectedDraft.servingSize) * 10) / 10,
                  protein: Math.round(selectedDraft.protein * (parseNumber(selectedDraft.quantity, selectedDraft.servingSize) / selectedDraft.servingSize) * 10) / 10,
                })}
              </Text>
            </View>

            <Text selectable style={styles.sheetHint}>
              {selectedDraft.originalEntryId ? 'Update the selected entry and keep the diary context unchanged.' : 'Add this food to the selected meal without leaving the picker.'}
            </Text>

            <AppButton
              label={selectedDraft.originalEntryId ? `Save changes` : `Add to ${selectedMealLabel}`}
              onPress={saveDraft}
            />
          </View>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: typeof Colors.dark) =>
  StyleSheet.create({
    backButton: {
      alignItems: 'flex-start',
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: Spacing.one,
      width: 72,
    },
    backButtonText: {
      color: colors.accent,
      fontSize: 15,
      fontWeight: '800',
    },
    clearButton: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 44,
      width: 44,
    },
    clearButtonText: {
      color: colors.textSecondary,
      fontSize: 24,
      fontWeight: '900',
      lineHeight: 24,
    },
    container: {
      gap: Spacing.three,
      maxWidth: MaxContentWidth,
      width: '100%',
    },
    content: {
      backgroundColor: colors.background,
      alignItems: 'center',
      flexGrow: 1,
      padding: Spacing.three,
    },
    emptyBlock: {
      alignItems: 'flex-start',
      gap: Spacing.two,
      paddingTop: Spacing.one,
    },
    emptyStateText: {
      color: colors.textSecondary,
      fontSize: Typography.body.fontSize,
      lineHeight: Typography.body.lineHeight,
    },
    footer: {},
    grid: {
      flexDirection: 'row',
      gap: Spacing.two,
    },
    headerCopy: {
      alignItems: 'center',
      flex: 1,
      gap: 2,
    },
    headerRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.one,
    },
    headerSpacer: {
      width: 72,
    },
    iconButton: {
      alignItems: 'center',
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    iconButtonText: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '900',
      lineHeight: 18,
    },
    input: {
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      color: colors.textPrimary,
      fontSize: 15,
      minHeight: 44,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two,
    },
    inlineForm: {
      gap: Spacing.two,
    },
    listGap: {
      gap: Spacing.two,
    },
    messageBanner: {
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      padding: Spacing.two,
    },
    messageText: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: '700',
    },
    rowActions: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.one,
    },
    searchInput: {
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      color: colors.textPrimary,
      flex: 1,
      fontSize: 15,
      minHeight: 44,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two,
    },
    searchRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.one,
      marginBottom: Spacing.two,
    },
    secondaryActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.two,
    },
    screen: {
      backgroundColor: colors.background,
      flex: 1,
    },
    sectionHeader: {
      marginBottom: Spacing.two,
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '800',
    },
    sheet: {
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderTopLeftRadius: Radii.xlarge,
      borderTopRightRadius: Radii.xlarge,
      borderTopWidth: StyleSheet.hairlineWidth,
      gap: Spacing.two,
      maxWidth: MaxContentWidth,
      padding: Spacing.three,
      width: '100%',
    },
    sheetBackdrop: {
      alignItems: 'center',
      bottom: 0,
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0,
      justifyContent: 'flex-end',
    },
    sheetClose: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    sheetCloseText: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: '900',
      lineHeight: 24,
    },
    sheetField: {
      gap: Spacing.one,
    },
    sheetHeader: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: Spacing.two,
      justifyContent: 'space-between',
    },
    sheetHint: {
      color: colors.textSecondary,
      fontSize: 12,
      lineHeight: 16,
    },
    sheetScrim: {
      ...StyleSheet.absoluteFill,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    helperText: {
      color: colors.textSecondary,
      fontSize: 12,
      lineHeight: 16,
    },
    sheetInput: {
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      color: colors.textPrimary,
      fontSize: 16,
      minHeight: 48,
      paddingHorizontal: Spacing.three,
    },
    sheetLabel: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    sheetMeta: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 18,
    },
    sheetSubtitle: {
      color: colors.textSecondary,
      fontSize: 12,
      lineHeight: 16,
    },
    sheetTitle: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '900',
    },
    sheetTotalLine: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '800',
    },
    sheetTotals: {
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      padding: Spacing.two,
    },
    summaryCalories: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '900',
      fontVariant: ['tabular-nums'],
    },
    summaryCopy: {
      color: colors.textSecondary,
      fontSize: 12,
    },
    summaryPill: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: Spacing.three,
    },
    summaryTitle: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '800',
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '700',
    },
    title: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: '900',
    },
  });
