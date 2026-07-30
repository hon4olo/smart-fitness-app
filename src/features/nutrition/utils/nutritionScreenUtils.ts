import { addDays, formatLocalDate, sumNutritionTotals } from '@/lib';
import type { FoodEntry, MealType } from '@/types';

export const mealTypeOrder: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export const mealTypeLabels: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

export const mealTypeIcons: Record<MealType, string> = {
  breakfast: '☀',
  lunch: '◐',
  dinner: '☾',
  snack: '◦',
};

export type WeekDay = {
  dateKey: string;
  dayLabel: string;
  dayNumber: string;
  isSelected: boolean;
  isToday: boolean;
  isLogged: boolean;
};

export type MealSummary = {
  entries: FoodEntry[];
  mealType: MealType;
  subtotal: ReturnType<typeof sumNutritionTotals>;
};

export const getWeekStart = (dateLabel: string) => {
  const parsedDate = new Date(`${dateLabel}T12:00:00`);
  const dayOfWeek = parsedDate.getDay();
  const offset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  return addDays(dateLabel, offset);
};

export const isToday = (dateLabel: string) => dateLabel === formatLocalDate(new Date());
