import type { FoodEntry, WeightEntry, WorkoutSession } from '@/types';

import { addDays, formatLocalDate, formatShortDate } from '@/lib';
import { sumNutritionTotals } from '@/lib/nutrition';
import { getLatestWorkoutSession, getSessionVolume } from '@/lib/workouts';

export type HomeActivityItem = {
  detail: string;
  id: string;
  label: string;
  value: string;
};

export type HomeSnapshotItem = {
  detail: string;
  id: string;
  label: string;
  tone?: 'neutral' | 'positive' | 'warning';
  value: string;
};

type LatestPrItem = {
  label: string;
  value: string;
};

type HomeMotivationInput = {
  currentStreak: number | null;
  latestPr?: LatestPrItem;
  trainingGoal: number;
  weightDelta30Days: number | null;
  workoutsThisWeek: number;
  yesterdayProteinMet: boolean;
};

const toDateKey = (value: string) => formatLocalDate(new Date(value));

const sortByCreatedAtDesc = <T extends { createdAt: string }>(entries: T[]) => {
  return [...entries].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
};

export const getLatestFoodEntry = (foodEntries: FoodEntry[]) => {
  return sortByCreatedAtDesc(foodEntries).at(0) ?? null;
};

export const getCurrentWorkoutStreak = (workoutSessions: WorkoutSession[]) => {
  const uniqueDays = [...new Set(workoutSessions.map((session) => toDateKey(session.finishedAt)))].sort();

  if (uniqueDays.length === 0) {
    return null;
  }

  let streak = 1;
  let cursor = uniqueDays.at(-1) ?? '';

  for (let index = uniqueDays.length - 2; index >= 0; index -= 1) {
    const expectedPreviousDay = addDays(cursor, -1);

    if (uniqueDays[index] !== expectedPreviousDay) {
      break;
    }

    streak += 1;
    cursor = uniqueDays[index];
  }

  return {
    days: streak,
    latestWorkoutDate: uniqueDays.at(-1) ?? '',
  };
};

export const getWeeklyCaloriesAverage = (foodEntries: FoodEntry[], todayKey = formatLocalDate(new Date())) => {
  const weekDayKeys = Array.from({ length: 7 }, (_, index) => addDays(todayKey, index - 6));
  const totalCalories = weekDayKeys.reduce((sum, dateKey) => {
    const dayCalories = sumNutritionTotals(foodEntries.filter((entry) => entry.date === dateKey)).calories;
    return sum + dayCalories;
  }, 0);

  return totalCalories > 0 ? totalCalories / weekDayKeys.length : null;
};

export const getWeeklyWorkoutCount = (workoutSessions: WorkoutSession[], todayKey = formatLocalDate(new Date())) => {
  const weekStart = addDays(todayKey, -6);

  return workoutSessions.filter((session) => {
    const sessionDate = toDateKey(session.finishedAt);
    return sessionDate >= weekStart && sessionDate <= todayKey;
  }).length;
};

export const getWeeklyWorkoutVolumeTrend = (workoutSessions: WorkoutSession[], todayKey = formatLocalDate(new Date())) => {
  const currentWeekStart = addDays(todayKey, -6);
  const previousWeekStart = addDays(todayKey, -13);
  const previousWeekEnd = addDays(todayKey, -7);

  const currentWeekVolume = workoutSessions.reduce((total, session) => {
    const sessionDate = toDateKey(session.finishedAt);

    if (sessionDate >= currentWeekStart && sessionDate <= todayKey) {
      return total + getSessionVolume(session);
    }

    return total;
  }, 0);

  const previousWeekVolume = workoutSessions.reduce((total, session) => {
    const sessionDate = toDateKey(session.finishedAt);

    if (sessionDate >= previousWeekStart && sessionDate <= previousWeekEnd) {
      return total + getSessionVolume(session);
    }

    return total;
  }, 0);

  const delta = currentWeekVolume - previousWeekVolume;
  const formattedCurrent = Math.round(currentWeekVolume).toLocaleString();
  const formattedPrevious = Math.round(previousWeekVolume).toLocaleString();

  return {
    currentVolume: currentWeekVolume,
    detail:
      previousWeekVolume > 0
        ? `${delta >= 0 ? '+' : ''}${Math.round(delta).toLocaleString()} kg vs last week`
        : currentWeekVolume > 0
          ? `${formattedCurrent} kg this week`
          : 'No workout volume yet',
    label:
      previousWeekVolume > 0
        ? `${delta >= 0 ? '+' : ''}${Math.round((delta / previousWeekVolume) * 100)}% vs last week`
        : currentWeekVolume > 0
          ? `${formattedCurrent} kg`
          : '—',
    previousVolume: previousWeekVolume,
    summary: previousWeekVolume > 0 ? `${formattedCurrent} kg vs ${formattedPrevious} kg` : formattedCurrent,
  };
};

export const getRecentActivityItems = (args: {
  foodEntries: FoodEntry[];
  latestPrs: LatestPrItem[];
  weightHistory: WeightEntry[];
  workoutSessions: WorkoutSession[];
}): HomeActivityItem[] => {
  const items: HomeActivityItem[] = [];
  const latestWorkoutSession = getLatestWorkoutSession(args.workoutSessions);
  const latestWeightEntry = sortByCreatedAtDesc(args.weightHistory).at(0) ?? null;
  const latestMeal = getLatestFoodEntry(args.foodEntries);
  const latestPr = args.latestPrs.at(0) ?? null;

  if (latestWorkoutSession) {
    items.push({
      id: 'workout',
      label: 'Latest workout',
      value: latestWorkoutSession.workoutTitle,
      detail: `${formatShortDate(latestWorkoutSession.finishedAt)} · ${latestWorkoutSession.sets.length} sets · ${Math.round(getSessionVolume(latestWorkoutSession)).toLocaleString()} kg`,
    });
  }

  if (latestWeightEntry) {
    items.push({
      id: 'weight',
      label: 'Latest weight',
      value: `${latestWeightEntry.weight.toFixed(1)} kg`,
      detail: `${formatShortDate(latestWeightEntry.createdAt)} · Check-in`,
    });
  }

  if (latestMeal) {
    items.push({
      id: 'meal',
      label: 'Latest meal',
      value: latestMeal.name,
      detail: `${formatShortDate(latestMeal.createdAt)} · ${Math.round(latestMeal.calories)} kcal · ${Math.round(latestMeal.protein)}P · ${Math.round(latestMeal.carbs)}C · ${Math.round(latestMeal.fats)}F`,
    });
  }

  if (latestPr) {
    items.push({
      id: 'pr',
      label: 'Latest PR',
      value: latestPr.label,
      detail: latestPr.value,
    });
  }

  return items;
};

export const getMotivationInsight = ({
  currentStreak,
  latestPr,
  trainingGoal,
  weightDelta30Days,
  workoutsThisWeek,
  yesterdayProteinMet,
}: HomeMotivationInput) => {
  if (currentStreak && currentStreak >= 3) {
    return `You’re on a ${currentStreak}-day training streak.`;
  }

  if (workoutsThisWeek >= trainingGoal && trainingGoal > 0) {
    return `You trained ${workoutsThisWeek} times this week.`;
  }

  if (weightDelta30Days !== null && weightDelta30Days < 0) {
    return `${Math.abs(weightDelta30Days).toFixed(1)} kg lost in the last month.`;
  }

  if (latestPr) {
    return `Latest PR: ${latestPr.label}.`;
  }

  if (yesterdayProteinMet) {
    return 'Protein target reached yesterday.';
  }

  return 'Keep logging consistently and the dashboard will keep sharpening itself.';
};
