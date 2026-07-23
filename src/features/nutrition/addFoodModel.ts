import type { FoodItem } from '@/api/foods';
import {
  formatCompactMacroTotals,
  formatNumber,
  resolveFoodCatalogItem,
} from '@/lib/nutrition';
import type {
  FoodAttribution,
  FoodCatalogItem,
  FoodEntry,
  MealType,
} from '@/types';

export const mealTypeLabels: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snacks',
};

export type PickerMode = 'food' | 'recent' | 'favorites' | 'meals';

export type DraftItem = {
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

export type RecentItem = {
  entry: FoodEntry;
  key: string;
  label: string;
  portionLabel: string;
  caloriesLabel: string;
  catalogFood?: FoodCatalogItem;
};

const providerLabels: Record<FoodItem['source']['provider'] | 'manual' | 'usda', string> = {
  custom: 'Custom',
  fatsecret: 'FatSecret',
  local: 'Local',
  manual: 'Manual',
  openfoodfacts: 'OpenFoodFacts',
  usda: 'Local',
};

export const formatProviderLabel = (
  provider: FoodItem['source']['provider'] | FoodEntry['source'],
): string => providerLabels[provider] ?? provider;

export const getFoodAttributionLabel = (
  food: Pick<FoodItem, 'attribution' | 'source'>,
): string =>
  food.source.provider === 'fatsecret'
    ? 'Food data provided by FatSecret'
    : food.attribution?.text ?? `Source: ${formatProviderLabel(food.source.provider)}`;

export const formatScreenDate = (dateLabel: string): string => {
  const parsedDate = new Date(`${dateLabel}T12:00:00`);
  if (Number.isNaN(parsedDate.getTime())) return dateLabel;

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
  }).format(parsedDate);
};

export const parseFoodNumber = (value: string, fallback = 0): number => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const isMeaningfulFoodText = (value: string): boolean => value.trim().length > 0;

export const buildRecentFoodItems = (entries: FoodEntry[]): RecentItem[] => {
  const sortedEntries = [...entries].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
  const seen = new Set<string>();
  const items: RecentItem[] = [];

  for (const entry of sortedEntries) {
    const catalogFood = resolveFoodCatalogItem(entry);
    const key = catalogFood?.id ?? `${entry.name.toLowerCase()}|${entry.brandName ?? ''}`;
    if (seen.has(key)) continue;

    seen.add(key);
    items.push({
      catalogFood: catalogFood ?? undefined,
      caloriesLabel: `${formatNumber(entry.calories)} kcal`,
      entry,
      key,
      label: entry.name,
      portionLabel: `${formatNumber(entry.quantity ?? entry.servingSize ?? 1)} ${
        entry.servingUnit ?? 'unit'
      }`,
    });
  }

  return items.slice(0, 20);
};

export const createDraftFromCatalogFood = (
  food: FoodCatalogItem,
  quantity = food.servingSize,
): DraftItem => ({
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

export const createDraftFromFoodItem = (food: FoodItem): DraftItem => {
  const nutrients = food.nutrientsPer100g ??
    food.nutrientsPer100ml ?? { calories: 0, protein: 0, carbs: 0, fat: 0 };
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

export const createDraftFromFoodEntry = (entry: FoodEntry): DraftItem => {
  const catalogFood = resolveFoodCatalogItem(entry);
  const servingSize = entry.servingSize ?? catalogFood?.servingSize ?? entry.quantity ?? 1;

  return {
    brandName: entry.brandName,
    attribution: entry.attribution,
    calories: entry.baseCalories ?? entry.calories,
    carbs: entry.baseCarbs ?? entry.carbs,
    externalId: entry.externalId,
    fats: entry.baseFats ?? entry.fats,
    name: entry.name,
    originalEntryId: entry.id,
    protein: entry.baseProtein ?? entry.protein,
    servingSize,
    servingUnit: entry.servingUnit ?? catalogFood?.servingUnit ?? 'unit',
    source: entry.source,
    quantity: String(entry.quantity ?? servingSize),
  };
};

export const buildDraftMacroTotalsLabel = (draft: DraftItem | null): string => {
  if (!draft) return '';
  const quantity = parseFoodNumber(draft.quantity, draft.servingSize);
  const multiplier = draft.servingSize > 0 ? quantity / draft.servingSize : 1;

  return formatCompactMacroTotals({
    calories: Math.round(draft.calories * multiplier * 10) / 10,
    carbs: Math.round(draft.carbs * multiplier * 10) / 10,
    fats: Math.round(draft.fats * multiplier * 10) / 10,
    protein: Math.round(draft.protein * multiplier * 10) / 10,
  });
};

export const buildFoodEntryFromDraft = ({
  createdAt,
  date,
  draft,
  mealType,
}: {
  createdAt: string;
  date: string;
  draft: DraftItem;
  mealType: MealType;
}): FoodEntry | null => {
  const quantity = parseFoodNumber(draft.quantity, draft.servingSize);
  if (!Number.isFinite(quantity) || quantity <= 0) return null;
  const servings = draft.servingSize > 0 ? quantity / draft.servingSize : 1;

  return {
    id: draft.originalEntryId ?? `${draft.name}-${Date.now()}`,
    name: draft.name,
    date,
    mealType,
    brandName: draft.brandName,
    attribution: draft.attribution,
    calories: Math.round(draft.calories * servings * 10) / 10,
    protein: Math.round(draft.protein * servings * 10) / 10,
    carbs: Math.round(draft.carbs * servings * 10) / 10,
    fats: Math.round(draft.fats * servings * 10) / 10,
    baseCalories: draft.calories,
    baseProtein: draft.protein,
    baseCarbs: draft.carbs,
    baseFats: draft.fats,
    source: draft.source,
    externalId: draft.externalId,
    servingSize: draft.servingSize,
    servingUnit: draft.servingUnit,
    quantity,
    createdAt,
  };
};

export type CustomFoodValues = {
  brand: string;
  calories: string;
  carbs: string;
  fats: string;
  name: string;
  protein: string;
  quantity: string;
  servingSize: string;
  servingUnit: string;
};

export const buildCustomFoodEntry = ({
  date,
  mealType,
  values,
}: {
  date: string;
  mealType: MealType;
  values: CustomFoodValues;
}): FoodEntry => {
  const servingSize = parseFoodNumber(values.servingSize, 1);
  const quantity = parseFoodNumber(values.quantity, servingSize);
  const servings = servingSize > 0 ? quantity / servingSize : 1;
  const calories = parseFoodNumber(values.calories, 0);
  const protein = parseFoodNumber(values.protein, 0);
  const carbs = parseFoodNumber(values.carbs, 0);
  const fats = parseFoodNumber(values.fats, 0);

  return {
    id: `${values.name.trim()}-${Date.now()}`,
    name: values.name.trim(),
    brandName: values.brand.trim() || undefined,
    date,
    mealType,
    calories: Math.round(calories * servings * 10) / 10,
    protein: Math.round(protein * servings * 10) / 10,
    carbs: Math.round(carbs * servings * 10) / 10,
    fats: Math.round(fats * servings * 10) / 10,
    baseCalories: calories,
    baseProtein: protein,
    baseCarbs: carbs,
    baseFats: fats,
    source: 'manual',
    servingSize,
    servingUnit: values.servingUnit.trim() || 'unit',
    quantity,
    createdAt: new Date().toISOString(),
  };
};
