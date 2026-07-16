import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  if (Number.isNaN(parsedDate.getTime())) return dateLabel;

  return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', weekday: 'short' }).format(parsedDate);
};

const formatWeekdayLabel = (dateLabel: string) => {
  const parsedDate = new Date(`${dateLabel}T12:00:00`);
  if (Number.isNaN(parsedDate.getTime())) return dateLabel.slice(5, 10);

  return new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(parsedDate);
};

const formatDayNumber = (dateLabel: string) => {
  const parsedDate = new Date(`${dateLabel}T12:00:00`);
  if (Number.isNaN(parsedDate.getTime())) return dateLabel.slice(-2);

  return new Intl.DateTimeFormat(undefined, { day: 'numeric' }).format(parsedDate);
};

const getWeekStart = (dateLabel: string) => {
  const parsedDate = new Date(`${dateLabel}T12:00:00`);
  const dayOfWeek = parsedDate.getDay();
  const offset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  return addDays(dateLabel, offset);
};

const isToday = (dateLabel: string) => dateLabel === formatLocalDate(new Date());

type WeekDay = {
  dateKey: string;
  dayLabel: string;
  dayNumber: string;
  isSelected: boolean;
  isToday: boolean;
};

type MealSummary = {
  entries: FoodEntry[];
  mealType: MealType;
  subtotal: ReturnType<typeof sumNutritionTotals>;
};

export default function NutritionScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { deleteFoodEntry, foodEntries, nutritionTargets } = useAppContext();
  const params = useLocalSearchParams<{ date?: string; openMeal?: MealType }>();

  const todayKey = useMemo(() => formatLocalDate(new Date()), []);
  const initialDate = typeof params.date === 'string' && params.date.length > 0 ? params.date : todayKey;
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [expandedMeals, setExpandedMeals] = useState<MealType[]>([]);

  useEffect(() => {
    if (typeof params.date === 'string' && params.date.length > 0 && params.date !== selectedDate) {
      setSelectedDate(params.date);
      setExpandedMeals([]);
    }
  }, [params.date, selectedDate]);

  useEffect(() => {
    if (params.openMeal === 'breakfast' || params.openMeal === 'lunch' || params.openMeal === 'dinner' || params.openMeal === 'snack') {
      setExpandedMeals([params.openMeal]);
    }
  }, [params.openMeal]);

  const selectedDateEntries = useMemo(() => foodEntries.filter((entry) => entry.date === selectedDate), [foodEntries, selectedDate]);
  const selectedDateNutrition = useMemo(() => sumNutritionTotals(selectedDateEntries), [selectedDateEntries]);
  const nutritionSummary = useMemo(() => getNutritionSummary(selectedDateNutrition, nutritionTargets), [nutritionTargets, selectedDateNutrition]);
  const selectedDateLabel = useMemo(() => formatDisplayDate(selectedDate), [selectedDate]);

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

  const updateSelectedDate = (nextDate: string) => {
    setSelectedDate(nextDate);
    setExpandedMeals([]);
    router.replace({ pathname: '/nutrition', params: { date: nextDate } });
  };

  const openCalendar = () => router.push({ pathname: '/nutrition/date-picker', params: { date: selectedDate } });
  const openMealPicker = (mealType: MealType) =>
    router.push({ pathname: '/nutrition/add-food', params: { date: selectedDate, meal: mealType } });
  const editFoodEntry = (entry: FoodEntry) =>
    router.push({ pathname: '/nutrition/add-food', params: { date: selectedDate, meal: entry.mealType, entryId: entry.id } });

  const toggleMealExpansion = (mealType: MealType) => {
    setExpandedMeals((current) => (current.includes(mealType) ? current.filter((item) => item !== mealType) : [...current, mealType]));
  };

  const targetPercent = nutritionTargets.calories > 0 ? Math.round((nutritionSummary.consumed.calories / nutritionTargets.calories) * 100) : 0;
  const targetPercentLabel = nutritionTargets.calories > 0 ? `${targetPercent}%` : '--';

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
            Nutrition
          </Text>
          <Pressable accessibilityLabel={`Open calendar for ${selectedDateLabel}`} hitSlop={10} onPress={openCalendar} style={styles.calendarButton}>
            <Text style={styles.calendarButtonText}>🗓</Text>
          </Pressable>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.streakChip}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text selectable style={styles.streakText}>
              {nutritionStreak} day streak
            </Text>
          </View>

          <Pressable
            accessibilityLabel={isToday(selectedDate) ? 'Today selected' : 'Jump to today'}
            accessibilityState={{ disabled: isToday(selectedDate) }}
            disabled={isToday(selectedDate)}
            hitSlop={10}
            onPress={() => updateSelectedDate(todayKey)}
            style={[styles.todayButton, isToday(selectedDate) && styles.todayButtonDisabled]}>
            <Text style={styles.todayButtonText}>Today</Text>
          </Pressable>
        </View>

        <View style={styles.weekSection}>
          <View style={styles.weekStrip}>
            {weekDays.map((day) => (
              <Pressable
                key={day.dateKey}
                accessibilityLabel={`${day.dayLabel} ${day.dayNumber}${day.isToday ? ', today' : ''}`}
                accessibilityState={{ selected: day.isSelected }}
                hitSlop={12}
                onPress={() => updateSelectedDate(day.dateKey)}
                style={styles.weekDayButton}>
                <View style={styles.weekDayHitArea}>
                  <View style={[styles.weekDayCircle, day.isSelected && styles.weekDayCircleSelected, day.isToday && styles.weekDayCircleToday, day.isSelected && day.isToday && styles.weekDayCircleTodaySelected]}>
                    {day.isToday ? <View style={[styles.weekDayTodayDot, day.isSelected && styles.weekDayTodayDotSelected]} /> : null}
                  </View>
                </View>
                <Text numberOfLines={1} selectable style={[styles.weekDayLabel, day.isSelected && styles.weekDayLabelSelected]}>
                  {day.dayLabel}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.summarySection}>
          <View style={styles.summaryGrid}>
            {[
              { label: 'Fat', value: `${formatNumber(nutritionSummary.consumed.fats)} g`, width: 1.6 },
              { label: 'Carbs', value: `${formatNumber(nutritionSummary.consumed.carbs)} g`, width: 1.8 },
              { label: 'Protein', value: `${formatNumber(nutritionSummary.consumed.protein)} g`, width: 2 },
              { label: 'TARGET', value: targetPercentLabel, width: 1.6 },
              { label: 'Calories', value: `${formatNumber(nutritionSummary.consumed.calories)} kcal`, emphasis: true, width: 3 },
            ].map((metric, index) => (
              <View
                key={metric.label}
                style={[
                  styles.summaryMetric,
                  { flexGrow: metric.width, flexBasis: 0 },
                  metric.emphasis && styles.summaryMetricEmphasis,
                  index > 0 && styles.summaryMetricWithBorder,
                ]}>
                <Text numberOfLines={1} selectable style={styles.summaryMetricLabel}>
                  {metric.label}
                </Text>
                <Text numberOfLines={1} selectable style={[styles.summaryMetricValue, metric.emphasis && styles.summaryMetricValueEmphasis]}>
                  {metric.value}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.mealSectionList}>
          <View style={styles.sectionHeader}>
            <Text selectable style={styles.sectionTitle}>
              Meal diary
            </Text>
          </View>

          <View style={styles.mealList}>
            {meals.map(({ entries, mealType, subtotal }) => {
              const expanded = expandedMeals.includes(mealType);
              const itemCount = entries.length;
              const macroSummary = `P ${formatNumber(subtotal.protein)} · C ${formatNumber(subtotal.carbs)} · F ${formatNumber(subtotal.fats)}`;

              return (
                <View key={mealType} style={styles.mealSection}>
                  <Pressable
                    accessibilityLabel={`${mealTypeLabels[mealType]} meal`}
                    accessibilityState={{ expanded }}
                    hitSlop={12}
                    onPress={() => toggleMealExpansion(mealType)}
                    style={styles.mealHeader}>
                    <View style={styles.mealHeaderCopy}>
                      <Text selectable style={styles.mealTitle}>
                        {mealTypeLabels[mealType]}
                      </Text>
                      <Text selectable style={styles.mealSummaryLine}>
                        {itemCount > 0 ? `${itemCount} item${itemCount === 1 ? '' : 's'} · ${macroSummary}` : macroSummary}
                      </Text>
                    </View>

                    <View style={styles.mealHeaderActions}>
                      <Text selectable style={styles.mealSubtotal}>
                        {formatNumber(subtotal.calories)} kcal
                      </Text>
                      <Pressable
                        accessibilityLabel={`Add food to ${mealTypeLabels[mealType]}`}
                        hitSlop={12}
                        onPress={(event) => {
                          event.stopPropagation();
                          openMealPicker(mealType);
                        }}
                        style={styles.mealActionButton}>
                        <Text style={styles.mealActionIcon}>+</Text>
                      </Pressable>
                      <Text style={styles.chevronText}>{expanded ? '▾' : '▸'}</Text>
                    </View>
                  </Pressable>

                  <View style={styles.mealDivider} />

                  {expanded ? (
                    <View style={styles.foodList}>
                      {entries.length > 0 ? (
                        entries.map((entry) => {
                          const detailParts = [entry.brandName, getServingInfo(entry)].filter(Boolean);
                          return (
                            <Pressable
                              key={entry.id}
                              accessibilityHint="Tap to edit this food entry"
                              accessibilityLabel={`Edit ${entry.name}`}
                              hitSlop={10}
                              onPress={() => editFoodEntry(entry)}
                              style={styles.foodRow}>
                              <View style={styles.foodRowCopy}>
                                <Text selectable style={styles.foodRowTitle}>
                                  {entry.name}
                                </Text>
                                <Text selectable style={styles.foodRowDetail}>
                                  {detailParts.join(' · ')}
                                </Text>
                              </View>
                              <Text selectable style={styles.foodRowCalories}>
                                {formatNumber(entry.calories)} kcal
                              </Text>
                            </Pressable>
                          );
                        })
                      ) : null}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>

        {fiberBreakdown.hasFiberData ? (
          <View style={styles.detailsSection}>
            <View style={styles.sectionHeader}>
              <Text selectable style={styles.sectionTitle}>
                Nutrition details
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text selectable style={styles.detailLabel}>
                Fiber
              </Text>
              <Text selectable style={styles.detailValue}>
                {formatNumber(fiberBreakdown.totalFiber)} g
              </Text>
            </View>
          </View>
        ) : null}
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
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
    addButtonText: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '900',
      lineHeight: 16,
    },
    calendarButton: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      height: 44,
      justifyContent: 'center',
      minWidth: 44,
      paddingHorizontal: Spacing.two,
    },
    calendarButtonText: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '900',
      lineHeight: 18,
    },
    chevronText: {
      color: colors.textSecondary,
      fontSize: 16,
      fontWeight: '900',
      width: 14,
    },
    container: {
      gap: Spacing.three,
      maxWidth: MaxContentWidth,
      width: '100%',
    },
    content: {
      alignItems: 'center',
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.three,
    },
    foodList: {
      gap: Spacing.two,
      paddingTop: Spacing.two,
    },
    foodRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.two,
      minHeight: 44,
    },
    foodRowCalories: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: '800',
      fontVariant: ['tabular-nums'],
    },
    foodRowCopy: {
      flex: 1,
      gap: 1,
      minWidth: 0,
    },
    foodRowDetail: {
      color: colors.textSecondary,
      fontSize: 12,
      lineHeight: 16,
    },
    foodRowTitle: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '800',
    },
    detailLabel: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: 14,
      fontWeight: '800',
      minWidth: 0,
    },
    detailRow: {
      alignItems: 'center',
      borderTopColor: colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: Spacing.two,
      justifyContent: 'space-between',
      paddingVertical: Spacing.two,
    },
    detailValue: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '800',
      fontVariant: ['tabular-nums'],
    },
    detailsSection: {
      gap: Spacing.one,
    },
    headerRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: Spacing.two,
      minHeight: 44,
    },
    mealActionButton: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
    mealActionIcon: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '900',
      lineHeight: 16,
    },
    mealDivider: {
      borderTopColor: colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
      marginTop: Spacing.one,
    },
    mealHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.two,
      justifyContent: 'space-between',
      minHeight: 44,
    },
    mealHeaderActions: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.one,
    },
    mealHeaderCopy: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    mealList: {
      gap: Spacing.one,
    },
    mealSection: {
      paddingTop: Spacing.one,
    },
    mealSectionList: {
      gap: Spacing.one,
    },
    mealSubtotal: {
      color: colors.textSecondary,
      fontSize: 12,
      fontVariant: ['tabular-nums'],
      fontWeight: '700',
    },
    mealSummaryLine: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '700',
      lineHeight: 16,
    },
    mealTitle: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '800',
    },
    metaRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: Spacing.two,
      minHeight: 36,
    },
    nutrientCard: {
      paddingVertical: Spacing.two,
    },
    nutrientCardCopy: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    nutrientCardRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: Spacing.two,
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
    sectionHeader: {
      marginBottom: Spacing.one,
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '800',
    },
    streakChip: {
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: Spacing.one,
      minHeight: 36,
      paddingHorizontal: Spacing.two,
    },
    streakEmoji: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: '900',
    },
    streakText: {
      color: colors.textPrimary,
      fontSize: 12,
      fontWeight: '800',
    },
    summarySection: {
      gap: Spacing.one,
    },
    summaryGrid: {
      flexDirection: 'row',
      gap: 0,
      justifyContent: 'space-between',
    },
    summaryMetric: {
      alignItems: 'center',
      flex: 1,
      gap: 2,
      minWidth: 0,
      paddingHorizontal: Spacing.one,
    },
    summaryMetricEmphasis: {
      minWidth: 0,
    },
    summaryMetricLabel: {
      color: colors.textSecondary,
      fontSize: 9,
      fontWeight: '800',
      lineHeight: 11,
      textAlign: 'center',
      textTransform: 'uppercase',
    },
    summaryMetricValue: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: '800',
      fontVariant: ['tabular-nums'],
      lineHeight: 16,
      textAlign: 'center',
    },
    summaryMetricValueEmphasis: {
      fontSize: 15,
      fontWeight: '900',
    },
    summaryMetricWithBorder: {
      borderLeftColor: colors.borderSubtle,
      borderLeftWidth: StyleSheet.hairlineWidth,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: '900',
    },
    todayButton: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      height: 36,
      justifyContent: 'center',
      minWidth: 72,
      paddingHorizontal: Spacing.two,
    },
    todayButtonDisabled: {
      opacity: 0.35,
    },
    todayButtonText: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: '800',
    },
    weekDayButton: {
      alignItems: 'center',
      flex: 1,
      gap: 2,
      justifyContent: 'center',
      minHeight: 44,
      paddingVertical: 0,
    },
    weekDayCircle: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      height: 22,
      justifyContent: 'center',
      width: 22,
    },
    weekDayCircleSelected: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    weekDayCircleToday: {
      borderColor: colors.accentSoft,
      borderWidth: 1,
    },
    weekDayCircleTodaySelected: {
      borderColor: colors.textOnAccent,
    },
    weekDayHitArea: {
      alignItems: 'center',
      height: 28,
      justifyContent: 'center',
      width: 28,
    },
    weekDayLabel: {
      color: colors.textSecondary,
      fontSize: 10,
      fontWeight: '800',
      lineHeight: 12,
      textTransform: 'uppercase',
    },
    weekDayLabelSelected: {
      color: colors.textPrimary,
    },
    weekDayTodayDot: {
      backgroundColor: colors.accent,
      borderRadius: 999,
      height: 5,
      width: 5,
    },
    weekDayTodayDotSelected: {
      backgroundColor: colors.textOnAccent,
    },
    weekSection: {
      borderBottomColor: colors.borderSubtle,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
      paddingVertical: Spacing.one,
    },
    weekStrip: {
      flexDirection: 'row',
      gap: 0,
      paddingHorizontal: 0,
    },
  });
