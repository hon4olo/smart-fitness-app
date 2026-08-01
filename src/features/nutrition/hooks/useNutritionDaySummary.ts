import { useMemo } from 'react';

import { addDays, sumNutritionTotals } from '@/lib';
import { getLoggedFoodDates, getNutritionSummary, resolveFoodCatalogItem } from '@/lib/nutrition';
import { useLocalization } from '@/localization';
import type { FoodEntry } from '@/types';

import { buildMealSummaries } from '../utils/nutritionDaySummaryModel';
import { getWeekStart, type WeekDay } from '../utils/nutritionScreenUtils';

type UseNutritionDaySummaryParams = {
  foodEntries: FoodEntry[];
  nutritionTargets: Parameters<typeof getNutritionSummary>[1];
  selectedDate: string;
  todayKey: string;
};

const toLocalNoon = (dateKey: string) => new Date(`${dateKey}T12:00:00`);

export function useNutritionDaySummary({
  foodEntries,
  nutritionTargets,
  selectedDate,
  todayKey,
}: UseNutritionDaySummaryParams) {
  const { formatDate } = useLocalization();
  const selectedDateEntries = useMemo(
    () => foodEntries.filter((entry) => entry.date === selectedDate),
    [foodEntries, selectedDate],
  );
  const selectedDateNutrition = useMemo(
    () => sumNutritionTotals(selectedDateEntries),
    [selectedDateEntries],
  );
  const nutritionSummary = useMemo(
    () => getNutritionSummary(selectedDateNutrition, nutritionTargets),
    [nutritionTargets, selectedDateNutrition],
  );
  const selectedDateLabel = useMemo(
    () => formatDate(toLocalNoon(selectedDate), { day: 'numeric', month: 'short', weekday: 'short' }),
    [formatDate, selectedDate],
  );

  const streakDays = useMemo(
    () => new Set(foodEntries.map((entry) => entry.date)),
    [foodEntries],
  );
  const loggedDaySet = useMemo(() => getLoggedFoodDates(foodEntries), [foodEntries]);
  const weekDays = useMemo<WeekDay[]>(() => {
    const weekStart = getWeekStart(selectedDate);
    return Array.from({ length: 7 }, (_, index) => {
      const dateKey = addDays(weekStart, index);
      const date = toLocalNoon(dateKey);
      return {
        dateKey,
        dayLabel: formatDate(date, { weekday: 'short' }),
        dayNumber: formatDate(date, { day: 'numeric' }),
        isSelected: dateKey === selectedDate,
        isToday: dateKey === todayKey,
        isLogged: loggedDaySet.has(dateKey),
      };
    });
  }, [formatDate, loggedDaySet, selectedDate, todayKey]);

  const nutritionStreak = useMemo(() => {
    let streak = 0;
    let cursor = todayKey;
    while (streakDays.has(cursor)) {
      streak += 1;
      cursor = addDays(cursor, -1);
    }
    return streak;
  }, [streakDays, todayKey]);

  const meals = useMemo(() => buildMealSummaries(selectedDateEntries), [selectedDateEntries]);

  const fiberBreakdown = useMemo(() => {
    let hasFiberData = false;
    let totalFiber = 0;

    for (const entry of selectedDateEntries) {
      const catalogFood = resolveFoodCatalogItem(entry);
      if (catalogFood?.fiber == null) continue;

      hasFiberData = true;
      const servings =
        entry.servingSize && entry.quantity ? entry.quantity / entry.servingSize : 1;
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
