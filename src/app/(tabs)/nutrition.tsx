import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppCard } from '@/components/ui/AppCard';
import { ListRow } from '@/components/ui/ListRow';
import { Colors, MaxContentWidth, Radii, Spacing, Typography } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { addDays, formatLocalDate, getServingInfo, sumNutritionTotals } from '@/lib';
import { formatNumber, getNutritionSummary, resolveFoodCatalogItem } from '@/lib/nutrition';
import type { FoodEntry, MealType } from '@/types';
import { useAppTheme } from '@/theme/AppThemeProvider';

const mealTypeOrder: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const mealTypeLabels: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

const formatDisplayDate = (dateLabel: string) => {
  const parsedDate = new Date(`${dateLabel}T12:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return dateLabel;
  }

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
  }).format(parsedDate);
};

const formatWeekdayLabel = (dateLabel: string) => {
  const parsedDate = new Date(`${dateLabel}T12:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return dateLabel.slice(5, 10);
  }

  return new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(parsedDate);
};

const formatDayNumber = (dateLabel: string) => {
  const parsedDate = new Date(`${dateLabel}T12:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return dateLabel.slice(-2);
  }

  return new Intl.DateTimeFormat(undefined, { day: 'numeric' }).format(parsedDate);
};

const getWeekStart = (dateLabel: string) => {
  const parsedDate = new Date(`${dateLabel}T12:00:00`);
  const dayOfWeek = parsedDate.getDay();
  const offset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  return addDays(dateLabel, offset);
};

const isToday = (dateLabel: string) => dateLabel === formatLocalDate(new Date());

export default function NutritionScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { deleteFoodEntry, foodEntries, nutritionTargets } = useAppContext();
  const params = useLocalSearchParams<{ date?: string }>();
  const todayKey = useMemo(() => formatLocalDate(new Date()), []);
  const initialDate = typeof params.date === 'string' && params.date.length > 0 ? params.date : todayKey;
  const [selectedDate, setSelectedDate] = useState(initialDate);

  useEffect(() => {
    if (typeof params.date === 'string' && params.date.length > 0 && params.date !== selectedDate) {
      setSelectedDate(params.date);
    }
  }, [params.date, selectedDate]);

  const selectedDateEntries = useMemo(
    () => foodEntries.filter((entry) => entry.date === selectedDate),
    [foodEntries, selectedDate]
  );

  const selectedDateNutrition = useMemo(() => sumNutritionTotals(selectedDateEntries), [selectedDateEntries]);
  const nutritionSummary = useMemo(
    () => getNutritionSummary(selectedDateNutrition, nutritionTargets),
    [nutritionTargets, selectedDateNutrition]
  );
  const selectedDateLabel = useMemo(() => formatDisplayDate(selectedDate), [selectedDate]);
  const weekDays = useMemo(() => {
    const weekStart = getWeekStart(selectedDate);

    return Array.from({ length: 7 }, (_, index) => {
      const dateKey = addDays(weekStart, index);
      return {
        dateKey,
        dayLabel: formatWeekdayLabel(dateKey),
        dayNumber: formatDayNumber(dateKey),
        isSelected: dateKey === selectedDate,
        isToday: dateKey === todayKey,
      };
    });
  }, [selectedDate, todayKey]);

  const streakDays = useMemo(() => new Set(foodEntries.map((entry) => entry.date)), [foodEntries]);
  const nutritionStreak = useMemo(() => {
    let streak = 0;
    let cursor = todayKey;

    while (streakDays.has(cursor)) {
      streak += 1;
      cursor = addDays(cursor, -1);
    }

    return streak;
  }, [streakDays, todayKey]);

  const meals = useMemo(
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
      if (catalogFood?.fiber == null) {
        continue;
      }

      hasFiberData = true;
      const servings = entry.servingSize && entry.quantity ? entry.quantity / entry.servingSize : 1;
      const safeServings = Number.isFinite(servings) && servings > 0 ? servings : 1;
      totalFiber += (catalogFood.fiber ?? 0) * safeServings;
    }

    return { hasFiberData, totalFiber };
  }, [selectedDateEntries]);

  const updateSelectedDate = (nextDate: string) => {
    setSelectedDate(nextDate);
    (router as any).setParams?.({ date: nextDate });
  };

  const openCalendar = () => router.push({ pathname: '/nutrition/date-picker', params: { date: selectedDate } });
  const openMealPicker = (mealType: MealType) =>
    router.push({ pathname: '/nutrition/add-food', params: { date: selectedDate, meal: mealType } });
  const editFoodEntry = (entry: FoodEntry) =>
    router.push({ pathname: '/nutrition/add-food', params: { date: selectedDate, meal: entry.mealType, entryId: entry.id } });
  const handleDeleteFoodEntry = (entryId: string) => deleteFoodEntry(entryId);

  const calorieProgressLabel =
    nutritionTargets.calories > 0
      ? `${Math.round(nutritionSummary.calorieProgress * 100)}% of daily target`
      : 'Daily target not set';

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.six }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text selectable style={styles.title}>
              Nutrition
            </Text>
            <View style={styles.streakPill}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text selectable style={styles.streakText}>
                {nutritionStreak} day streak
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <Pressable accessibilityLabel={`Open calendar for ${selectedDateLabel}`} hitSlop={10} onPress={openCalendar} style={styles.headerButton}>
              <Text style={styles.headerButtonText}>Calendar</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.weekStripCard}>
          <View style={styles.weekStripHeader}>
            <Text selectable style={styles.weekStripTitle}>
              This week
            </Text>
            {!isToday(selectedDate) ? (
              <Pressable accessibilityLabel="Jump to today" hitSlop={10} onPress={() => updateSelectedDate(todayKey)} style={styles.weekStripLink}>
                <Text style={styles.weekStripLinkText}>Today</Text>
              </Pressable>
            ) : null}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weekStrip}>
            {weekDays.map((day) => (
              <Pressable
                key={day.dateKey}
                accessibilityLabel={`${day.dayLabel} ${day.dayNumber}${day.isToday ? ', today' : ''}`}
                accessibilityState={{ selected: day.isSelected }}
                hitSlop={10}
                onPress={() => updateSelectedDate(day.dateKey)}
                style={[styles.dayPill, day.isSelected && styles.dayPillSelected]}>
                <Text selectable style={[styles.dayLabel, day.isSelected && styles.dayLabelSelected]}>
                  {day.dayLabel}
                </Text>
                <Text selectable style={[styles.dayNumber, day.isSelected && styles.dayNumberSelected]}>
                  {day.dayNumber}
                </Text>
                {day.isToday ? <View style={[styles.todayDot, day.isSelected && styles.todayDotSelected]} /> : null}
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <AppCard style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <View style={styles.summaryCopy}>
              <Text selectable style={styles.sectionEyebrow}>
                Consumed today
              </Text>
              <Text selectable style={styles.summaryCalories}>
                {formatNumber(nutritionSummary.consumed.calories)} kcal
              </Text>
              <Text selectable style={styles.summaryPercent}>
                {calorieProgressLabel}
              </Text>
            </View>
          </View>

          <View style={styles.macroChips}>
            {[
              { label: 'Protein', value: nutritionSummary.consumed.protein, suffix: 'g' },
              { label: 'Carbs', value: nutritionSummary.consumed.carbs, suffix: 'g' },
              { label: 'Fat', value: nutritionSummary.consumed.fats, suffix: 'g' },
            ].map((macro) => (
              <View key={macro.label} style={styles.macroChip}>
                <Text selectable style={styles.macroChipLabel}>
                  {macro.label}
                </Text>
                <Text selectable style={styles.macroChipValue}>
                  {formatNumber(macro.value)} {macro.suffix}
                </Text>
              </View>
            ))}
          </View>
        </AppCard>

        <AppCard style={styles.mealCard}>
          <View style={styles.sectionHeader}>
            <Text selectable style={styles.sectionTitle}>
              Meal diary
            </Text>
          </View>

          <View style={styles.mealList}>
            {meals.map(({ entries, mealType, subtotal }) => (
              <View key={mealType} style={styles.mealSection}>
                <View style={styles.mealHeader}>
                  <View style={styles.mealHeaderCopy}>
                    <Text selectable style={styles.mealTitle}>
                      {mealTypeLabels[mealType]}
                    </Text>
                    <Text selectable style={styles.mealSubtotal}>
                      {formatNumber(subtotal.calories)} kcal
                    </Text>
                  </View>

                  <Pressable
                    accessibilityLabel={`Add food to ${mealTypeLabels[mealType]}`}
                    hitSlop={10}
                    onPress={() => openMealPicker(mealType)}
                    style={styles.addButton}>
                    <Text style={styles.addButtonText}>+</Text>
                  </Pressable>
                </View>

                {entries.length > 0 ? (
                  <View style={styles.foodList}>
                    {entries.map((entry) => {
                      const detailParts = [entry.brandName, getServingInfo(entry)].filter(Boolean);
                      return (
                        <ListRow
                          key={entry.id}
                          accessibilityHint="Tap to edit this food entry"
                          detail={detailParts.join(' · ')}
                          onPress={() => editFoodEntry(entry)}
                          title={entry.name}
                          trailing={
                            <Pressable
                              accessibilityLabel={`Delete ${entry.name}`}
                              hitSlop={10}
                              onPress={(event) => {
                                event.stopPropagation();
                                handleDeleteFoodEntry(entry.id);
                              }}
                              style={styles.deleteButton}>
                              <Text style={styles.deleteButtonText}>×</Text>
                            </Pressable>
                          }
                          value={`${formatNumber(entry.calories)} kcal`}
                        />
                      );
                    })}
                  </View>
                ) : (
                  <Text selectable style={styles.emptyMealLine}>
                    No food logged
                  </Text>
                )}
              </View>
            ))}
          </View>
        </AppCard>

        <AppCard style={styles.secondaryCard}>
          <View style={styles.sectionHeader}>
            <Text selectable style={styles.secondaryTitle}>
              Nutrient breakdown
            </Text>
          </View>

          {fiberBreakdown.hasFiberData ? (
            <View style={styles.nutrientRow}>
              <View>
                <Text selectable style={styles.nutrientLabel}>
                  Fiber
                </Text>
                <Text selectable style={styles.nutrientHint}>
                  From catalog foods only
                </Text>
              </View>
              <Text selectable style={styles.nutrientValue}>
                {formatNumber(fiberBreakdown.totalFiber)} g
              </Text>
            </View>
          ) : (
            <View style={styles.emptyNutrientState}>
              <Text selectable style={styles.emptyNutrientText}>
                Not available yet.
              </Text>
              <Text selectable style={styles.emptyNutrientHint}>
                Sodium, cholesterol, sugar, saturated fat, and other detailed nutrients are not stored in the current food data.
              </Text>
            </View>
          )}
        </AppCard>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: typeof Colors.dark) =>
  StyleSheet.create({
    addButton: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    addButtonText: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: '900',
      lineHeight: 20,
    },
    container: {
      gap: Spacing.three,
      maxWidth: MaxContentWidth,
      width: '100%',
    },
    content: {
      alignItems: 'center',
      padding: Spacing.three,
    },
    dayLabel: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    dayLabelSelected: {
      color: colors.textPrimary,
    },
    dayNumber: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '900',
      fontVariant: ['tabular-nums'],
    },
    dayNumberSelected: {
      color: colors.textOnAccent,
    },
    dayPill: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      gap: 2,
      minHeight: 64,
      justifyContent: 'center',
      paddingHorizontal: Spacing.two,
      paddingVertical: Spacing.two,
      width: 48,
    },
    dayPillSelected: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    deleteButton: {
      alignItems: 'center',
      borderRadius: 999,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    deleteButtonText: {
      color: colors.textSecondary,
      fontSize: 24,
      fontWeight: '700',
      lineHeight: 24,
    },
    emptyMealLine: {
      color: colors.textSecondary,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
      paddingVertical: Spacing.two,
    },
    emptyNutrientHint: {
      color: colors.textSecondary,
      fontSize: 12,
      lineHeight: 16,
    },
    emptyNutrientState: {
      gap: Spacing.one,
    },
    emptyNutrientText: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '800',
    },
    foodList: {
      gap: Spacing.two,
      paddingTop: Spacing.two,
    },
    headerActions: {
      alignItems: 'flex-end',
      gap: Spacing.one,
    },
    headerButton: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      height: 44,
      justifyContent: 'center',
      minWidth: 44,
      paddingHorizontal: Spacing.three,
    },
    headerButtonText: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: '800',
    },
    headerCopy: {
      flex: 1,
      gap: 4,
    },
    headerRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: Spacing.two,
    },
    macroChip: {
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      flex: 1,
      gap: 2,
      minWidth: 92,
      paddingHorizontal: Spacing.two,
      paddingVertical: Spacing.two,
    },
    macroChipLabel: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    macroChipValue: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '800',
      fontVariant: ['tabular-nums'],
    },
    macroChips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.two,
    },
    mealCard: {
      gap: Spacing.three,
    },
    mealHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.two,
      justifyContent: 'space-between',
    },
    mealHeaderCopy: {
      flex: 1,
      gap: 2,
    },
    mealList: {
      gap: Spacing.three,
    },
    mealSection: {
      borderColor: colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
      gap: Spacing.two,
      paddingTop: Spacing.three,
    },
    mealSubtotal: {
      color: colors.textSecondary,
      fontSize: 12,
      fontVariant: ['tabular-nums'],
      fontWeight: '700',
    },
    mealTitle: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '800',
    },
    nutrientHint: {
      color: colors.textSecondary,
      fontSize: 12,
      lineHeight: 16,
    },
    nutrientLabel: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '800',
    },
    nutrientRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: Spacing.two,
    },
    nutrientValue: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '900',
      fontVariant: ['tabular-nums'],
    },
    screen: {
      backgroundColor: colors.background,
      flex: 1,
    },
    secondaryCard: {
      gap: Spacing.three,
      opacity: 0.96,
    },
    secondaryTitle: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    sectionEyebrow: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    sectionHeader: {
      marginBottom: Spacing.one,
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '800',
    },
    streakEmoji: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: '900',
    },
    streakPill: {
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: Spacing.one,
      minHeight: 28,
      paddingHorizontal: Spacing.two,
    },
    streakText: {
      color: colors.textPrimary,
      fontSize: 12,
      fontWeight: '800',
    },
    summaryCalories: {
      color: colors.textPrimary,
      fontSize: 28,
      fontWeight: '900',
      fontVariant: ['tabular-nums'],
      lineHeight: 32,
    },
    summaryCard: {
      gap: Spacing.three,
    },
    summaryCopy: {
      gap: 2,
    },
    summaryPercent: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '700',
    },
    summaryTopRow: {
      gap: Spacing.two,
    },
    todayDot: {
      backgroundColor: colors.accentSoft,
      borderColor: colors.accent,
      borderRadius: 999,
      borderWidth: 1,
      height: 6,
      width: 6,
    },
    todayDotSelected: {
      backgroundColor: colors.textOnAccent,
      borderColor: colors.textOnAccent,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: '900',
    },
    weekStrip: {
      gap: Spacing.two,
      paddingRight: Spacing.one,
    },
    weekStripActions: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.one,
    },
    weekStripCard: {
      gap: Spacing.two,
    },
    weekStripHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: Spacing.two,
    },
    weekStripLink: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      height: 36,
      justifyContent: 'center',
      minWidth: 36,
      paddingHorizontal: Spacing.two,
    },
    weekStripLinkText: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: '800',
    },
    weekStripTitle: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
  });
