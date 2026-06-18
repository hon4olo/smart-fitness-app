export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type FoodEntry = {
  id: string;
  name: string;
  date: string;
  mealType: MealType;
  brandName?: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  baseCalories?: number;
  baseProtein?: number;
  baseCarbs?: number;
  baseFats?: number;
  source: 'manual' | 'fatsecret' | 'openfoodfacts' | 'usda';
  externalId?: string;
  servingSize?: number;
  servingUnit?: string;
  quantity?: number;
  createdAt: string;
};

export type MealTemplate = {
  id: string;
  name: string;
  items: FoodEntry[];
  createdAt: string;
};

export type NutritionState = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

export type NutritionTargets = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};
