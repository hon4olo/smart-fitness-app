import { useMemo } from 'react';

import { addDays, sumNutritionTotals } from '@/lib';
import { getLoggedFoodDates, getNutritionSummary, resolveFoodCatalogItem } from '@/lib/nutrition';
import type { FoodEntry } from '@/types';

import {
  formatDayNumber,
  formatDisplayDate,
  formatWeekdayLabel,
  getWeekStart,
  mealTypeOrder,
  type MealSummary,
  type WeekDay,
} from '../utils/nutritionScreenUtils';

type UseNutritionDaySummaryParams = {
  foodEntries: FoodEntry[];
  nutritionTargets: Parameters<typeof getNutritionSummary>[1];
  selectedDate: string;
  todayKey: string;
};

export function useNutritionDaySummary({ foodEntries, nutritionTargets, selectedDate, todayKey }: UseNutritionDaySummaryParams) {
  const selectedDateEntries = useMemo(() => foodEntries.filter((entry) => entry.date === selectedDate), [foodEntries, selectedDate]);
  const selectedDateNutrition = useMemo(() => sumNutritionTotals(selectedDateEntries), [selectedDateEntries]);
  const nutritionSummary = useMemo(() => getNutritionSummary(selectedDateNutrition, nutritionTargets), [nutritionTargets, selectedDateNutrition]);
  const selectedDateLabel = useMemo(() => formatDisplayDate(selectedDate), [selectedDate]);

  const streakDays = useMemo(() => new Set(foodEntries.map((entry) => entry.date)), [foodEntries]);
  const loggedDaySet = useMemo(() => getLoggedFoodDates(foodEntries), [foodEntries]);
  const weekDays = useMemo<WeekDay[]>(() => {
    const weekStart = getWeekStart(selectedDate);
    return Array.from({ length: 7 }, (_, index) => {
      const dateKey = addDays(weekStart, index);
      return {
        dateKey,
        dayLabel: formatWeekdayLabel(dateKey),
        dayNumber: formatDayNumber(dateKey),
        isSelected: dateKey === selectedDate,
        isToday: dateKey === todayKey,
        isLogged: loggedDaySet.has(dateKey),
      };
    });
  }, [selectedDate, todayKey, loggedDaySet]);

  const nutritionStreak = useMemo(() => {
    let streak = 0;
    let cursor = todayKey;
    while (streakDays.has(cursor)) {
      streak += 1;
      cursor = addDays(cursor, -1);
    }
    return streak;
  }, [streakDays, todayKey]);

  const meals = useMemo<MealSummary[]>(
    () =>
      mealTypeOrder.map((mealType) => {
        const entries = selectedDateEntries.filter((entry) => entry.mealType === mealType);
        return { entries, mealType, subtotal: sumNutritionTotals(entries) };
      }),
    [selectedDateEntries]
  );

  const fiberBreakdown = useMemo(() => {
    let hasFiberData = false;
    let totalFiber = 0;

    for (const entry of selectedDateEntries) {
      const catalogFood = resolveFoodCatalogItem(entry);
      if (catalogFood?.fiber == null) continue;

      hasFiberData = true;
      const servings = entry.servingSize && entry.quantity ? entry.quantity / entry.servingSize : 1;
      const safeServings = Number.isFinite(servings) && servings > 0 ? servings : 1;
      totalFiber += (catalogFood.fiber ?? 0) * safeServings;
    }

    return { hasFiberData, totalFiber };
  }, [selectedDateEntries]);

  return {
    fiberBreakdown,
    meals,
    nutritionStreak,
    nutritionSummary,
    selectedDateLabel,
    weekDays,
  };
}
