import type { FoodBrowserMode, FoodCatalogItem, FoodCategory, FoodEntry, MealType, ProfileGoalType } from '@/types';

import { foodCatalog, foodCatalogLookup } from '@/data/foods';

export type MacroTotals = {
  calories: number;
  carbs: number;
  fats: number;
  protein: number;
};

export type NutritionSummary = {
  consumed: MacroTotals;
  target: MacroTotals;
  remaining: MacroTotals;
  calorieProgress: number;
  isOverTarget: boolean;
};

export type FoodBrowserFilters = {
  category?: FoodCategory | 'all';
  mode?: FoodBrowserMode;
  favoriteIds?: string[];
  recentIds?: string[];
};

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const tokenize = (value: string) => normalize(value).split(/\s+/).filter(Boolean);

export const createMacroTotals = (): MacroTotals => ({
  calories: 0,
  protein: 0,
  carbs: 0,
  fats: 0,
});

export const sumNutritionTotals = (entries: Pick<FoodEntry, 'calories' | 'protein' | 'carbs' | 'fats'>[]) => {
  return entries.reduce(
    (totals, entry) => ({
      calories: totals.calories + entry.calories,
      protein: totals.protein + entry.protein,
      carbs: totals.carbs + entry.carbs,
      fats: totals.fats + entry.fats,
    }),
    createMacroTotals()
  );
};

export const formatNumber = (value: number) => {
  return `${Math.round(value * 10) / 10}`;
};

export const formatCompactMacroTotals = (entryTotals: MacroTotals) => {
  return `${formatNumber(entryTotals.calories)} kcal · ${formatNumber(entryTotals.protein)}P · ${formatNumber(entryTotals.carbs)}C · ${formatNumber(entryTotals.fats)}F`;
};

export const formatMacroTargetPair = (consumed: number, target: number, unit = 'g') => {
  return `${formatNumber(consumed)} / ${formatNumber(target)} ${unit}`;
};

export const getNutritionSummary = (consumed: MacroTotals, target: MacroTotals): NutritionSummary => {
  const remaining = {
    calories: target.calories - consumed.calories,
    protein: target.protein - consumed.protein,
    carbs: target.carbs - consumed.carbs,
    fats: target.fats - consumed.fats,
  };

  return {
    consumed,
    target,
    remaining,
    calorieProgress: getClampedProgress(consumed.calories, target.calories),
    isOverTarget: remaining.calories < 0,
  };
};

export const formatMacroTotals = (entryTotals: MacroTotals) => {
  return `${formatNumber(entryTotals.calories)} kcal / ${formatNumber(entryTotals.protein)} g protein / ${formatNumber(entryTotals.carbs)} g carbs / ${formatNumber(entryTotals.fats)} g fats`;
};

export const getClampedProgress = (total: number, target: number) => {
  if (target <= 0) {
    return total > 0 ? 1 : 0;
  }

  return Math.min(1, Math.max(0, total / target));
};

export const formatGoalType = (value: ProfileGoalType) => {
  if (value === 'lose_fat') {
    return 'Lose fat';
  }

  if (value === 'gain_muscle') {
    return 'Gain muscle';
  }

  return 'Maintain';
};

export const parsePositiveNumber = (value: string) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 0;
};

export const parseOptionalPositiveNumber = (value: string) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : undefined;
};

export const parseNonNegativeNumber = (value: string) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : 0;
};

export const formatRemaining = (remaining: number, unit: string) => {
  const formattedValue = `${formatNumber(Math.abs(remaining))}${unit}`;

  return remaining < 0 ? `Over by ${formattedValue}` : `Remaining ${formattedValue}`;
};

export const getServingInfo = (entry: {
  servingSize?: number;
  servingUnit?: string;
  quantity?: number;
}) => {
  if (!entry.servingSize && !entry.servingUnit && !entry.quantity) {
    return '';
  }

  if (entry.quantity && entry.servingUnit) {
    return `${entry.quantity} ${entry.servingUnit}`;
  }

  return [entry.quantity ?? entry.servingSize, entry.servingUnit].filter(Boolean).join(' ') || 'serving';
};

export const formatFoodServing = (food: Pick<FoodCatalogItem, 'servingSize' | 'servingUnit'>) => {
  return `${formatNumber(food.servingSize)} ${food.servingUnit}`;
};

export const formatMealItemCount = (itemCount: number) => {
  if (itemCount <= 0) {
    return 'No items yet';
  }

  return `${itemCount} item${itemCount === 1 ? '' : 's'}`;
};

export const getLoggedFoodDates = (entries: Pick<FoodEntry, 'date'>[]) => new Set(entries.map((entry) => entry.date));

export const formatFoodMacros = (food: Pick<FoodCatalogItem, 'calories' | 'carbs' | 'fat' | 'protein'>, servings = 1) => {
  return `${formatNumber(food.calories * servings)} kcal · ${formatNumber(food.protein * servings)}P · ${formatNumber(food.carbs * servings)}C · ${formatNumber(food.fat * servings)}F`;
};

export const buildFoodEntryFromCatalog = (
  food: FoodCatalogItem,
  options: {
    date: string;
    mealType: MealType;
    servings?: number;
    source?: FoodEntry['source'];
  }
): FoodEntry => {
  const servings = options.servings && options.servings > 0 ? options.servings : 1;
  const quantity = food.servingSize * servings;
  const createdAt = new Date().toISOString();

  return {
    id: `${food.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: food.name,
    date: options.date,
    mealType: options.mealType,
    calories: Math.round(food.calories * servings * 10) / 10,
    protein: Math.round(food.protein * servings * 10) / 10,
    carbs: Math.round(food.carbs * servings * 10) / 10,
    fats: Math.round(food.fat * servings * 10) / 10,
    baseCalories: food.calories,
    baseProtein: food.protein,
    baseCarbs: food.carbs,
    baseFats: food.fat,
    source: options.source ?? 'usda',
    externalId: food.id,
    servingSize: food.servingSize,
    servingUnit: food.servingUnit,
    quantity,
    createdAt,
  };
};

export const resolveFoodCatalogItem = (value: { externalId?: string; name: string }) => {
  if (value.externalId) {
    const byId = foodCatalogLookup.byId.get(normalize(value.externalId));

    if (byId) {
      return byId;
    }
  }

  const byName = foodCatalogLookup.byName.get(normalize(value.name));

  if (byName) {
    return byName;
  }

  return foodCatalogLookup.byTag.get(normalize(value.name)) ?? null;
};

export const getRecentCatalogFoods = (entries: FoodEntry[], limit = 20) => {
  const sortedEntries = [...entries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const seen = new Set<string>();
  const recentFoods: FoodCatalogItem[] = [];

  for (const entry of sortedEntries) {
    const match = resolveFoodCatalogItem(entry);

    if (!match || seen.has(match.id)) {
      continue;
    }

    seen.add(match.id);
    recentFoods.push(match);

    if (recentFoods.length >= limit) {
      break;
    }
  }

  return recentFoods;
};

const getFoodScore = (
  food: FoodCatalogItem,
  options: Required<Pick<FoodBrowserFilters, 'category' | 'mode'>> & Pick<FoodBrowserFilters, 'favoriteIds' | 'recentIds'>,
  query: string,
  tokens: string[]
) => {
  const searchableFields = [food.id, food.name, food.category, ...food.aliases, ...food.tags, food.servingUnit, ...(food.fiber ? [String(food.fiber)] : [])]
    .map(normalize)
    .filter(Boolean);
  const haystack = searchableFields.join(' ');
  const queryNormalized = normalize(query);
  const favorites = new Set(options.favoriteIds ?? []);
  const recent = new Set(options.recentIds ?? []);

  if (options.category !== 'all' && food.category !== options.category) {
    return Number.NEGATIVE_INFINITY;
  }

  if (options.mode === 'favorites' && !favorites.has(food.id)) {
    return Number.NEGATIVE_INFINITY;
  }

  if (options.mode === 'recent' && !recent.has(food.id)) {
    return Number.NEGATIVE_INFINITY;
  }

  let score = food.popularity;

  if (favorites.has(food.id)) {
    score += 500;
  }

  if (recent.has(food.id)) {
    score += 220;
  }

  if (options.mode === 'popular') {
    score += food.popularity * 1.25;
  }

  if (!queryNormalized) {
    return score;
  }

  if (haystack === queryNormalized) {
    score += 1200;
  }

  if (food.name.toLowerCase() === queryNormalized) {
    score += 1000;
  }

  if (food.aliases.some((alias) => normalize(alias) === queryNormalized)) {
    score += 900;
  }

  if (food.category.includes(queryNormalized)) {
    score += 260;
  }

  for (const token of tokens) {
    if (!token) {
      continue;
    }

    if (food.name.toLowerCase().startsWith(token)) {
      score += 260;
      continue;
    }

    if (food.aliases.some((alias) => normalize(alias).startsWith(token))) {
      score += 210;
      continue;
    }

    if (haystack.includes(token)) {
      score += 80;
    }
  }

  const compactHaystack = haystack.replace(/\s+/g, '');
  const compactQuery = queryNormalized.replace(/\s+/g, '');

  if (compactQuery && compactHaystack.includes(compactQuery)) {
    score += 140;
  }

  return score;
};

export const searchFoodCatalog = (foods: FoodCatalogItem[], query: string, filters: FoodBrowserFilters = {}) => {
  const category = filters.category ?? 'all';
  const mode = filters.mode ?? 'all';
  const tokens = tokenize(query);
  const results = foods
    .map((food) => ({
      food,
      score: getFoodScore(food, { category, mode, favoriteIds: filters.favoriteIds, recentIds: filters.recentIds }, query, tokens),
    }))
    .filter((result) => result.score > Number.NEGATIVE_INFINITY / 2)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.food.name.localeCompare(right.food.name);
    })
    .map((result) => result.food);

  if (!normalize(query)) {
    return results;
  }

  return results.filter((food) => {
    const searchable = [food.name, food.id, food.category, ...food.aliases, ...food.tags].map(normalize).join(' ');
    const compactSearchable = searchable.replace(/\s+/g, '');
    const compactQuery = normalize(query).replace(/\s+/g, '');

    return tokens.every((token) => searchable.includes(token) || compactSearchable.includes(token.replace(/\s+/g, '')) || compactSearchable.includes(compactQuery));
  });
};

const getMacroDistance = (source: FoodCatalogItem, candidate: FoodCatalogItem) => {
  const caloriesDiff = Math.abs(source.calories - candidate.calories) / 120;
  const proteinDiff = Math.abs(source.protein - candidate.protein) / 20;
  const carbsDiff = Math.abs(source.carbs - candidate.carbs) / 20;
  const fatDiff = Math.abs(source.fat - candidate.fat) / 8;
  const fiberDiff = Math.abs((source.fiber ?? 0) - (candidate.fiber ?? 0)) / 5;
  const tagOverlap = candidate.tags.filter((tag) => source.tags.includes(tag)).length;

  return caloriesDiff + proteinDiff + carbsDiff + fatDiff + fiberDiff - tagOverlap * 0.5;
};

export const getSimilarFoods = (food: FoodCatalogItem, foods: FoodCatalogItem[] = foodCatalog, limit = 6) => {
  return foods
    .filter((candidate) => candidate.id !== food.id && candidate.category === food.category)
    .map((candidate) => ({ candidate, score: getMacroDistance(food, candidate) }))
    .sort((left, right) => left.score - right.score || left.candidate.name.localeCompare(right.candidate.name))
    .slice(0, limit)
    .map((item) => item.candidate);
};

export const getFoodCatalogTopFoods = (foods: FoodCatalogItem[], limit = 12) => {
  return [...foods]
    .sort((left, right) => right.popularity - left.popularity || left.name.localeCompare(right.name))
    .slice(0, limit);
};

export const findFoodById = (foodId: string) => foodCatalogLookup.byId.get(normalize(foodId));
export const findFoodByName = (foodName: string) => foodCatalogLookup.byName.get(normalize(foodName));
export const findFoodByTag = (tag: string) => foodCatalogLookup.byTag.get(normalize(tag));
