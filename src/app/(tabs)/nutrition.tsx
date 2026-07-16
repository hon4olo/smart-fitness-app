import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, MaxContentWidth, Radii, Spacing, Typography } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { addDays, formatLocalDate, getServingInfo, sumNutritionTotals } from '@/lib';
import { formatNumber, formatMealItemCount, getLoggedFoodDates, getNutritionSummary, resolveFoodCatalogItem } from '@/lib/nutrition';
import type { FoodEntry, MealType } from '@/types';
import { useAppTheme } from '@/theme/AppThemeProvider';

const mealTypeOrder: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const mealTypeLabels: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

const mealTypeIcons: Record<MealType, string> = {
  breakfast: '☀',
  lunch: '◐',
  dinner: '☾',
  snack: '◦',
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

const formatWeekdayLong = (dateLabel: string) => {
  const parsedDate = new Date(`${dateLabel}T12:00:00`);
  if (Number.isNaN(parsedDate.getTime())) return dateLabel;

  return new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(parsedDate);
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
  isLogged: boolean;
};

type MealSummary = {
  entries: FoodEntry[];
  mealType: MealType;
  subtotal: ReturnType<typeof sumNutritionTotals>;
};

const macroGridColumns = [
  { key: 'fats', label: 'Fat', flex: 1.6 },
  { key: 'carbs', label: 'Carbs', flex: 1.8 },
  { key: 'protein', label: 'Protein', flex: 2 },
  { key: 'target', label: 'Target', flex: 1.6 },
  { key: 'calories', label: 'Calories', flex: 3 },
] as const;

type MacroGridKey = (typeof macroGridColumns)[number]['key'];
type MacroGridValues = Record<MacroGridKey, string>;

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

  const renderMacroGridRow = (values: MacroGridValues, showLabels = false, nested = false) => (
    <View style={[styles.macroGridRow, nested && styles.macroGridRowNested]}>
      {macroGridColumns.map((column, index) => (
        <View
          key={column.key}
          style={[
            styles.macroGridCell,
            { flexGrow: column.flex, flexBasis: 0 },
            index > 0 && styles.macroGridCellWithBorder,
          ]}>
          {showLabels ? (
            <Text numberOfLines={1} selectable style={styles.macroGridLabel}>
              {column.label}
            </Text>
          ) : null}
          <Text numberOfLines={1} selectable style={styles.macroGridValue}>
            {values[column.key]}
          </Text>
        </View>
      ))}
    </View>
  );

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
                accessibilityLabel={`${formatWeekdayLong(day.dateKey)}, ${day.isLogged ? 'food logged' : 'no food logged'}${day.isToday ? ', today' : ''}`}
                accessibilityState={{ selected: day.isSelected }}
                hitSlop={12}
                onPress={() => updateSelectedDate(day.dateKey)}
                style={styles.weekDayButton}>
                <View style={styles.weekDayHitArea}>
                  <View
                    style={[
                      styles.weekDayCircle,
                      day.isLogged && styles.weekDayCircleLogged,
                      day.isSelected && styles.weekDayCircleSelected,
                      day.isToday && !day.isLogged && styles.weekDayCircleToday,
                      day.isSelected && day.isToday && styles.weekDayCircleTodaySelected,
                    ]}>
                    {day.isLogged ? <Text style={[styles.weekDayCheck, day.isSelected && styles.weekDayCheckSelected]}>✓</Text> : null}
                    {day.isToday && !day.isLogged ? <View style={[styles.weekDayTodayDot, day.isSelected && styles.weekDayTodayDotSelected]} /> : null}
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
          {renderMacroGridRow(
            {
              fats: `${formatNumber(nutritionSummary.consumed.fats)} g`,
              carbs: `${formatNumber(nutritionSummary.consumed.carbs)} g`,
              protein: `${formatNumber(nutritionSummary.consumed.protein)} g`,
              target: targetPercentLabel,
              calories: `${formatNumber(nutritionSummary.consumed.calories)} kcal`,
            },
            true
          )}
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
              const mealTargetPercent = nutritionTargets.calories > 0 ? Math.round((subtotal.calories / nutritionTargets.calories) * 100) : 0;
              const mealTargetPercentLabel = nutritionTargets.calories > 0 ? `${mealTargetPercent}%` : '--';

              return (
                <View key={mealType} style={styles.mealGroup}>
                  <Pressable
                    accessibilityLabel={`${mealTypeLabels[mealType]} meal`}
                    accessibilityState={{ expanded }}
                    hitSlop={12}
                    onPress={() => toggleMealExpansion(mealType)}
                    style={styles.mealHeader}>
                    <View style={styles.mealHeaderLeft}>
                      <Text style={styles.mealIcon}>{mealTypeIcons[mealType]}</Text>
                      <View style={styles.mealHeaderCopy}>
                        <Text selectable style={styles.mealTitle}>
                          {mealTypeLabels[mealType]}
                        </Text>
                        <Text selectable style={styles.mealHeaderMeta}>
                          {formatMealItemCount(itemCount)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.mealHeaderActions}>
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

                  <View style={styles.mealSummaryStrip}>
                    {renderMacroGridRow(
                      {
                        fats: `${formatNumber(subtotal.fats)} g`,
                        carbs: `${formatNumber(subtotal.carbs)} g`,
                        protein: `${formatNumber(subtotal.protein)} g`,
                        target: mealTargetPercentLabel,
                        calories: `${formatNumber(subtotal.calories)} kcal`,
                      },
                      false
                    )}
                  </View>

                  {expanded ? (
                    <View style={styles.foodList}>
                      {entries.length > 0 ? (
                        entries.map((entry, index) => {
                          const servingInfo = getServingInfo(entry);
                          const foodTargetPercent = nutritionTargets.calories > 0 ? Math.round((entry.calories / nutritionTargets.calories) * 100) : 0;
                          const foodTargetPercentLabel = nutritionTargets.calories > 0 ? `${foodTargetPercent}%` : '--';
                          const foodMetadata = [entry.brandName, servingInfo].filter(Boolean).join(' · ');
                          return (
                            <Pressable
                              key={entry.id}
                              accessibilityHint="Tap to edit this food entry"
                              accessibilityLabel={`Edit ${entry.name}`}
                              hitSlop={10}
                              onPress={() => editFoodEntry(entry)}
                              style={[styles.foodRow, index > 0 && styles.foodRowDivider]}>
                              <View style={styles.foodRowTop}>
                                <View style={styles.foodRowCopy}>
                                  <Text selectable numberOfLines={1} ellipsizeMode="tail" style={styles.foodRowTitle}>
                                    {entry.name}
                                  </Text>
                                  <Text selectable numberOfLines={1} ellipsizeMode="tail" style={styles.foodRowDetail}>
                                    {foodMetadata || '—'}
                                  </Text>
                                </View>
                                <Text selectable numberOfLines={1} style={styles.foodRowCalories}>
                                  {formatNumber(entry.calories)} kcal
                                </Text>
                              </View>

                              {renderMacroGridRow(
                                {
                                  fats: `${formatNumber(entry.fats)} g`,
                                  carbs: `${formatNumber(entry.carbs)} g`,
                                  protein: `${formatNumber(entry.protein)} g`,
                                  target: foodTargetPercentLabel,
                                  calories: `${formatNumber(entry.calories)} kcal`,
                                },
                                false,
                                true
                              )}
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
      backgroundColor: colors.surfaceSecondary,
      borderTopColor: colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
      gap: Spacing.one,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two,
    },
    foodRow: {
      gap: Spacing.one,
      minHeight: 44,
    },
    foodRowCalories: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: '800',
      fontVariant: ['tabular-nums'],
      textAlign: 'right',
    },
    foodRowTop: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: Spacing.two,
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
    foodRowDivider: {
      borderTopColor: colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
      paddingTop: Spacing.two,
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
    mealGroup: {
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.medium,
      borderWidth: StyleSheet.hairlineWidth,
      overflow: 'hidden',
    },
    mealHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.two,
      justifyContent: 'space-between',
      minHeight: 52,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two,
    },
    mealHeaderActions: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.one,
    },
    mealHeaderCopy: {
      flex: 1,
      gap: 1,
      minWidth: 0,
    },
    mealHeaderLeft: {
      alignItems: 'center',
      flex: 1,
      flexDirection: 'row',
      gap: Spacing.two,
      minWidth: 0,
    },
    mealHeaderMeta: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '700',
      lineHeight: 16,
    },
    mealIcon: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '900',
      width: 16,
    },
    mealList: {
      gap: Spacing.two,
    },
    mealSectionList: {
      gap: Spacing.one,
      marginTop: Spacing.five,
    },
    mealSummaryStrip: {
      backgroundColor: colors.backgroundSecondary,
      borderTopColor: colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
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
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.medium,
      borderWidth: StyleSheet.hairlineWidth,
      overflow: 'hidden',
    },
    macroGridRow: {
      flexDirection: 'row',
      gap: 0,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two,
    },
    macroGridRowNested: {
      paddingHorizontal: 0,
    },
    macroGridCell: {
      alignItems: 'center',
      gap: 2,
      minWidth: 0,
      paddingHorizontal: Spacing.one,
    },
    macroGridCellWithBorder: {
      borderLeftColor: colors.borderSubtle,
      borderLeftWidth: StyleSheet.hairlineWidth,
    },
    macroGridLabel: {
      color: colors.textSecondary,
      fontSize: 9,
      fontWeight: '800',
      lineHeight: 11,
      textAlign: 'center',
      textTransform: 'uppercase',
    },
    macroGridValue: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: '800',
      fontVariant: ['tabular-nums'],
      lineHeight: 16,
      textAlign: 'center',
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
    weekDayCircleLogged: {
      borderColor: colors.accentSoft,
      borderWidth: 1,
    },
    weekDayCircleToday: {
      borderColor: colors.accentSoft,
      borderWidth: 1,
    },
    weekDayCircleTodaySelected: {
      borderColor: colors.textOnAccent,
    },
    weekDayCheck: {
      color: colors.accent,
      fontSize: 9,
      fontWeight: '900',
    },
    weekDayCheckSelected: {
      color: colors.textOnAccent,
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
