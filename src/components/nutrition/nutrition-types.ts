import type { FoodEntry } from '@/context/AppContext';

export type FoodSearchResult = {
  brandName?: string;
  calories: number;
  carbs: number;
  fats: number;
  name: string;
  protein: number;
  servingSize?: number;
  servingUnit?: string;
  source: FoodEntry['source'];
};
