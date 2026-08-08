import { router, useLocalSearchParams } from 'expo-router';
import { CalendarDays } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNutritionState } from '@/context/AppContext';
import { NutritionDetailsSection } from '@/features/nutrition/components/NutritionDetailsSection';
import { NutritionDiaryList } from '@/features/nutrition/components/NutritionDiaryList';
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

  const sections = useMemo(
    () =>
      meals.map((meal) => ({
        ...meal,
        data: expandedMeals.includes(meal.mealType) ? meal.entries : [],
      })),
    [expandedMeals, meals],
  );

  const targetPercent =
    nutritionTargets.calories > 0
      ? Math.round((nutritionSummary.consumed.calories / nutritionTargets.calories) * 100)
      : 0;
  const targetPercentLabel = nutritionTargets.calories > 0 ? `${targetPercent}%` : '--';
  const selectedDateAccessibility = selectedDateLabel;
  const selectedDateIsToday = isToday(selectedDate);
  const formatWeekdayLong = (dateLabel: string) =>
    formatDate(`${dateLabel}T12:00:00`, { weekday: 'long' });

  const header = (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text selectable style={styles.title}>
          {copy.title}
        </Text>
        <Pressable
          accessibilityLabel={copy.openCalendar(selectedDateAccessibility)}
          accessibilityRole="button"
          hitSlop={10}
          onPress={openCalendar}
          style={styles.calendarButton}>
          <CalendarDays color={colors.textPrimary} size={21} strokeWidth={2} />
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
          accessibilityLabel={selectedDateIsToday ? copy.todaySelected : copy.jumpToToday}
          accessibilityRole="button"
          accessibilityState={{ disabled: selectedDateIsToday }}
          disabled={selectedDateIsToday}
          hitSlop={10}
          onPress={() => updateSelectedDate(todayKey)}
          style={[
            styles.todayButton,
            selectedDateIsToday && {
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.divider,
            },
          ]}>
          <Text
            style={[
              styles.todayButtonText,
              selectedDateIsToday && { color: colors.textMuted },
            ]}>
            {copy.today}
          </Text>
        </Pressable>
      </View>

      <NutritionWeekStrip
        accessibilityLabelForDay={copy.weekDayAccessibility}
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
      </View>
    </View>
  );

  const footer = fiberBreakdown.hasFiberData ? (
    <View style={styles.container}>
      <NutritionDetailsSection styles={styles} totalFiber={fiberBreakdown.totalFiber} />
    </View>
  ) : null;

  return (
    <NutritionDiaryList
      copy={copy}
      energyUnit={energy}
      expandedMeals={expandedMeals}
      footer={footer}
      header={header}
      insetsBottom={insets.bottom}
      mealIcons={mealTypeIcons}
      nutritionTargetCalories={nutritionTargets.calories}
      onEditFoodEntry={editFoodEntry}
      onOpenMealPicker={openMealPicker}
      onToggleMealExpansion={toggleMealExpansion}
      sections={sections}
      styles={styles}
    />
  );
}