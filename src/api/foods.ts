import { createApiClient } from '@/api/client';

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

type FoodSearchResponse = {
  foods: FoodItem[];
};

const configuredFoodApiBaseUrl = process.env.EXPO_PUBLIC_FOOD_API_BASE_URL?.trim();

const stripTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

export const isFoodApiConfigured = (): boolean => Boolean(configuredFoodApiBaseUrl);

const getFoodApiClient = () => {
  if (!configuredFoodApiBaseUrl) {
    return null;
  }

  return createApiClient({
    baseUrl: stripTrailingSlash(configuredFoodApiBaseUrl),
    defaultTimeoutMs: 8_000,
    defaultRetry: {
      attempts: 1,
      delayMs: 250,
      factor: 2,
    },
  });
};

export const searchFoods = async (query: string): Promise<FoodItem[]> => {
  const trimmedQuery = query.trim();
  const client = getFoodApiClient();
  if (!client || !trimmedQuery) {
    return [];
  }

  const response = await client.get<FoodSearchResponse>('/foods/search', {
    query: { q: trimmedQuery },
  });

  return response.foods;
};

export const getFoodByBarcode = async (barcode: string): Promise<FoodItem | null> => {
  const trimmedBarcode = barcode.trim();
  const client = getFoodApiClient();
  if (!client || !trimmedBarcode) {
    return null;
  }

  return client.get<FoodItem>(`/foods/barcode/${encodeURIComponent(trimmedBarcode)}`);
};

export const getFoodById = async (id: string): Promise<FoodItem | null> => {
  const trimmedId = id.trim();
  const client = getFoodApiClient();
  if (!client || !trimmedId) {
    return null;
  }

  return client.get<FoodItem>(`/foods/${encodeURIComponent(trimmedId)}`);
};
