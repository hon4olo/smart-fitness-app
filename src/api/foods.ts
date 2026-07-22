import { createApiClient } from '@/api/client';
import { isApiError } from '@/api/client/errors';
import { getMobileApiBaseUrl } from '@/api/config';

export type FoodProviderName = 'local' | 'fatsecret' | 'openfoodfacts' | 'custom';

export type FoodNutrients = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
};

export type FoodServing = {
  id: string;
  label: string;
  quantity: number;
  unit: string;
  grams?: number;
  milliliters?: number;
};

export type FoodItem = {
  id: string;
  source: {
    provider: FoodProviderName;
    sourceId: string;
  };
  barcode?: string;
  name: string;
  brand?: string;
  servingBase: '100g' | '100ml';
  nutrientsPer100g?: FoodNutrients;
  nutrientsPer100ml?: FoodNutrients;
  servings: FoodServing[];
  verified: boolean;
  attribution?: {
    provider: string;
    text: string;
    url?: string;
  };
};

export type CreateCustomBarcodeFoodPayload = {
  name: string;
  brand?: string;
  servingUnit: 'g' | 'ml';
  caloriesPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
  imageUrl?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isFoodNutrients = (value: unknown): value is FoodNutrients => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.calories === 'number' &&
    typeof value.protein === 'number' &&
    typeof value.carbs === 'number' &&
    typeof value.fat === 'number'
  );
};

const isFoodServing = (value: unknown): value is FoodServing => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.label === 'string' &&
    typeof value.quantity === 'number' &&
    typeof value.unit === 'string'
  );
};

const isFoodProviderName = (value: unknown): value is FoodProviderName =>
  value === 'local' || value === 'fatsecret' || value === 'openfoodfacts' || value === 'custom';

const isFoodItem = (value: unknown): value is FoodItem => {
  if (!isRecord(value) || !isRecord(value.source)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    isFoodProviderName(value.source.provider) &&
    typeof value.source.sourceId === 'string' &&
    typeof value.name === 'string' &&
    (value.servingBase === '100g' || value.servingBase === '100ml') &&
    (value.nutrientsPer100g === undefined || isFoodNutrients(value.nutrientsPer100g)) &&
    (value.nutrientsPer100ml === undefined || isFoodNutrients(value.nutrientsPer100ml)) &&
    Array.isArray(value.servings) &&
    value.servings.every(isFoodServing) &&
    typeof value.verified === 'boolean'
  );
};

const hasFoodNotFoundCode = (body: unknown): boolean =>
  isRecord(body) && (body.code === 'FOOD_NOT_FOUND' || body.error === 'FOOD_NOT_FOUND');

export const isFoodApiConfigured = (): boolean => true;

const foodApiClient = createApiClient({
  baseUrl: getMobileApiBaseUrl(),
  defaultTimeoutMs: 8_000,
  defaultRetry: {
    attempts: 1,
    delayMs: 250,
    factor: 2,
  },
});

const getFoodApiClient = () => foodApiClient;

export const searchFoods = async (query: string): Promise<FoodItem[]> => {
  const trimmedQuery = query.trim();
  const client = getFoodApiClient();
  if (!trimmedQuery) {
    return [];
  }

  const response = await client.get<unknown>('/foods/search', {
    query: { q: trimmedQuery },
  });

  return isRecord(response) && Array.isArray(response.foods) ? response.foods.filter(isFoodItem) : [];
};

export const autocompleteFoods = async (query: string): Promise<string[]> => {
  const trimmedQuery = query.trim();
  const client = getFoodApiClient();
  if (trimmedQuery.length < 2) {
    return [];
  }

  const response = await client.get<unknown>('/foods/autocomplete', {
    query: { q: trimmedQuery },
  });

  if (!isRecord(response) || !Array.isArray(response.suggestions)) {
    return [];
  }

  return response.suggestions
    .filter((suggestion): suggestion is string => typeof suggestion === 'string' && suggestion.trim().length > 0)
    .map((suggestion) => suggestion.trim())
    .slice(0, 8);
};

export const lookupFoodByBarcode = async (barcode: string): Promise<FoodItem | null> => {
  const trimmedBarcode = barcode.trim();
  const client = getFoodApiClient();
  if (!trimmedBarcode) {
    return null;
  }

  try {
    const response = await client.get<unknown>(`/foods/barcode/${encodeURIComponent(trimmedBarcode)}`);
    return isFoodItem(response) ? response : null;
  } catch (error) {
    if (isApiError(error) && error.status === 404 && (error.code === 'not_found' || hasFoodNotFoundCode(error.body))) {
      return null;
    }

    throw error;
  }
};

export const getFoodByBarcode = lookupFoodByBarcode;

export const createCustomBarcodeFood = async (barcode: string, payload: CreateCustomBarcodeFoodPayload): Promise<FoodItem> => {
  const trimmedBarcode = barcode.trim();
  const client = getFoodApiClient();
  if (!trimmedBarcode) {
    throw new Error('Barcode is required');
  }

  const response = await client.post<unknown, CreateCustomBarcodeFoodPayload>(
    `/foods/barcode/${encodeURIComponent(trimmedBarcode)}/custom`,
    payload
  );

  if (!isFoodItem(response)) {
    throw new Error('Food database returned an invalid product.');
  }

  return response;
};

export const getFoodById = async (id: string): Promise<FoodItem | null> => {
  const trimmedId = id.trim();
  const client = getFoodApiClient();
  if (!trimmedId) {
    return null;
  }

  const response = await client.get<unknown>(`/foods/${encodeURIComponent(trimmedId)}`);
  return isFoodItem(response) ? response : null;
};
