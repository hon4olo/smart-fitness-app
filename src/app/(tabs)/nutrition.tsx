import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useNutritionState } from '@/context/AppContext';
import { MealGroup } from '@/features/nutrition/components/MealGroup';
import { NutritionDetailsSection } from '@/features/nutrition/components/NutritionDetailsSection';
import { NutritionSummaryGrid } from '@/features/nutrition/components/NutritionSummaryGrid';
import { NutritionWeekStrip } from '@/features/nutrition/components/NutritionWeekStrip';
import { useNutritionDaySummary } from '@/features/nutrition/hooks/useNutritionDaySummary';
import { createStyles } from '@/features/nutrition/styles/nutritionScreenStyles';
import { isToday, mealTypeIcons } from '@/features/nutrition/utils/nutritionScreenUtils';
import { formatLocalDate } from '@/lib';
import { formatNumber as formatNutritionNumber } from '@/lib/nutrition';
import { useLocalization } from '@/localization';
import { getNutritionDiaryCopy } from '@/localization/nutritionDiaryCopy';
import { useAppTheme } from '@/theme/AppThemeProvider';
import type { FoodEntry, MealType } from '@/types';
import { formatEnergyValue, useUnitPreferences } from '@/units';

export default function NutritionScreen() {
  const { colors } = useAppTheme();
  const { energy } = useUnitPreferences();
  const { formatDate, formatNumber, locale } = useLocalization();
  const copy = getNutritionDiaryCopy(locale);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { foodEntries, nutritionTargets } = useNutritionState();
  const params = useLocalSearchParams<{ date?: string; openMeal?: MealType }>();

  const todayKey = useMemo(() => formatLocalDate(new Date()), []);
  const initialDate =
    typeof params.date === 'string' && params.date.length > 0 ? params.date : todayKey;
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [expandedMeals, setExpandedMeals] = useState<MealType[]>([]);

  useEffect(() => {
    if (
      typeof params.date === 'string' &&
      params.date.length > 0 &&
      params.date !== selectedDate
    ) {
      setSelectedDate(params.date);
      setExpandedMeals([]);
    }
  }, [params.date, selectedDate]);

  useEffect(() => {
    if (
      params.openMeal === 'breakfast' ||
      params.openMeal === 'lunch' ||
      params.openMeal === 'dinner' ||
      params.openMeal === 'snack'
    ) {
      setExpandedMeals([params.openMeal]);
    }
  }, [params.openMeal]);

  const {
    fiberBreakdown,
    meals,
    nutritionStreak,
    nutritionSummary,
    selectedDateLabel,
    weekDays,
  } = useNutritionDaySummary({
    foodEntries,
    nutritionTargets,
    selectedDate,
    todayKey,
  });

  const updateSelectedDate = (nextDate: string) => {
    setSelectedDate(nextDate);
    setExpandedMeals([]);
    router.replace({ pathname: '/nutrition', params: { date: nextDate } });
  };

  const openCalendar = () =>
    router.push({ pathname: '/nutrition/date-picker', params: { date: selectedDate } });
  const openMealPicker = (mealType: MealType) =>
    router.push({ pathname: '/nutrition/add-food', params: { date: selectedDate, meal: mealType } });
  const editFoodEntry = (entry: FoodEntry) =>
    router.push({
      pathname: '/nutrition/add-food',
      params: { date: selectedDate, meal: entry.mealType, entryId: entry.id },
    });

  const toggleMealExpansion = (mealType: MealType) => {
    setExpandedMeals((current) =>
      current.includes(mealType)
        ? current.filter((item) => item !== mealType)
        : [...current, mealType],
    );
  };

  const targetPercent =
    nutritionTargets.calories > 0
      ? Math.round((nutritionSummary.consumed.calories / nutritionTargets.calories) * 100)
      : 0;
  const targetPercentLabel = nutritionTargets.calories > 0 ? `${targetPercent}%` : '--';
  const selectedDateAccessibility = selectedDateLabel;
  const formatWeekdayLong = (dateLabel: string) =>
    formatDate(`${dateLabel}T12:00:00`, { weekday: 'long' });

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.six }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text selectable style={styles.title}>
            {copy.title}
          </Text>
          <Pressable
            accessibilityLabel={copy.openCalendar(selectedDateAccessibility)}
            hitSlop={10}
            onPress={openCalendar}
            style={styles.calendarButton}>
            <Text style={styles.calendarButtonText}>🗓</Text>
          </Pressable>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.streakChip}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text selectable style={styles.streakText}>
              {copy.streak(
                nutritionStreak,
                formatNumber(nutritionStreak, { maximumFractionDigits: 0 }),
              )}
            </Text>
          </View>
          <Pressable
            accessibilityLabel={isToday(selectedDate) ? copy.todaySelected : copy.jumpToToday}
            accessibilityState={{ disabled: isToday(selectedDate) }}
            disabled={isToday(selectedDate)}
            hitSlop={10}
            onPress={() => updateSelectedDate(todayKey)}
            style={[styles.todayButton, isToday(selectedDate) && styles.todayButtonDisabled]}>
            <Text style={styles.todayButtonText}>{copy.today}</Text>
          </Pressable>
        </View>

        <NutritionWeekStrip
          formatWeekdayLong={formatWeekdayLong}
          onSelectDate={updateSelectedDate}
          styles={styles}
          weekDays={weekDays}
        />

        <View style={styles.summarySection}>
          <NutritionSummaryGrid
            labels={copy.macroLabels}
            showLabels
            styles={styles}
            values={{
              fats: `${formatNutritionNumber(nutritionSummary.consumed.fats)} g`,
              carbs: `${formatNutritionNumber(nutritionSummary.consumed.carbs)} g`,
              protein: `${formatNutritionNumber(nutritionSummary.consumed.protein)} g`,
              target: targetPercentLabel,
              calories: `${formatEnergyValue(nutritionSummary.consumed.calories, energy)} ${energy}`,
            }}
          />
        </View>

        <View style={styles.mealSectionList}>
          <View style={styles.sectionHeader}>
            <Text selectable style={styles.sectionTitle}>
              {copy.mealDiary}
            </Text>
          </View>
          <View style={styles.mealList}>
            {meals.map(({ entries, mealType, subtotal }) => {
              const expanded = expandedMeals.includes(mealType);
              return (
                <MealGroup
                  key={mealType}
                  copy={copy}
                  energyUnit={energy}
                  entries={entries}
                  expanded={expanded}
                  mealIcon={mealTypeIcons[mealType]}
                  mealLabel={copy.mealLabels[mealType]}
                  mealType={mealType}
                  nutritionTargetCalories={nutritionTargets.calories}
                  onEditFoodEntry={editFoodEntry}
                  onOpenMealPicker={openMealPicker}
                  onToggleMealExpansion={toggleMealExpansion}
                  styles={styles}
                  subtotal={subtotal}
                />
              );
            })}
          </View>
        </View>

        {fiberBreakdown.hasFiberData ? (
          <NutritionDetailsSection styles={styles} totalFiber={fiberBreakdown.totalFiber} />
        ) : null}
      </View>
    </ScrollView>
  );
}
