import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppCard } from '@/components/ui/AppCard';
import { ListRow } from '@/components/ui/ListRow';
import { Colors, MaxContentWidth, Radii, Spacing, Typography } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { addDays, formatLocalDate, getServingInfo, sumNutritionTotals } from '@/lib';
import { formatCompactMacroTotals, formatMacroTargetPair, formatNumber, formatRemaining, getNutritionSummary } from '@/lib/nutrition';
import type { FoodEntry, MealType } from '@/types';
import { useAppTheme } from '@/theme/AppThemeProvider';

const mealTypeOrder: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const mealTypeLabels: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snacks',
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

const isToday = (dateLabel: string) => dateLabel === formatLocalDate(new Date());

export default function NutritionScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const safeAreaInsets = useSafeAreaInsets();
  const { deleteFoodEntry, foodEntries, nutritionTargets } = useAppContext();
  const [selectedDate, setSelectedDate] = useState(formatLocalDate(new Date()));

  const selectedDateEntries = useMemo(
    () => foodEntries.filter((entry) => entry.date === selectedDate),
    [foodEntries, selectedDate]
  );

  const selectedDateNutrition = useMemo(() => sumNutritionTotals(selectedDateEntries), [selectedDateEntries]);
  const nutritionSummary = useMemo(
    () => getNutritionSummary(selectedDateNutrition, nutritionTargets),
    [nutritionTargets, selectedDateNutrition]
  );
  const selectedDateLabel = useMemo(() => (isToday(selectedDate) ? 'Today' : formatDisplayDate(selectedDate)), [selectedDate]);

  const meals = useMemo(
    () =>
      mealTypeOrder.map((mealType) => {
        const entries = selectedDateEntries.filter((entry) => entry.mealType === mealType);
        return { entries, mealType, subtotal: sumNutritionTotals(entries) };
      }),
    [selectedDateEntries]
  );

  const goToPreviousDay = () => setSelectedDate((current) => addDays(current, -1));
  const goToToday = () => setSelectedDate(formatLocalDate(new Date()));
  const goToNextDay = () => setSelectedDate((current) => addDays(current, 1));
  const openMealPicker = (mealType: MealType) => router.push({ pathname: '/nutrition/add-food', params: { date: selectedDate, meal: mealType } });
  const editFoodEntry = (entry: FoodEntry) =>
    router.push({ pathname: '/nutrition/add-food', params: { date: selectedDate, meal: entry.mealType, entryId: entry.id } });
  const handleDeleteFoodEntry = (entryId: string) => deleteFoodEntry(entryId);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[styles.content, { paddingBottom: safeAreaInsets.bottom + Spacing.six }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text selectable style={styles.title}>
            Nutrition
          </Text>
        </View>

        <View style={styles.dateRow}>
          <Pressable accessibilityLabel="Previous day" hitSlop={10} onPress={goToPreviousDay} style={styles.dateButton}>
            <Text style={styles.dateButtonText}>‹</Text>
          </Pressable>
          <View style={styles.dateCenter}>
            <Text selectable style={styles.dateLabel}>
              {selectedDateLabel}
            </Text>
            <Text selectable style={styles.dateMeta}>
              {formatDisplayDate(selectedDate)}
            </Text>
          </View>
          {!isToday(selectedDate) ? (
            <Pressable accessibilityLabel="Today" hitSlop={10} onPress={goToToday} style={styles.todayButton}>
              <Text style={styles.todayButtonText}>Today</Text>
            </Pressable>
          ) : (
            <View style={styles.todaySpacer} />
          )}
          <Pressable accessibilityLabel="Next day" hitSlop={10} onPress={goToNextDay} style={styles.dateButton}>
            <Text style={styles.dateButtonText}>›</Text>
          </Pressable>
        </View>

        <AppCard>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryCopy}>
              <Text selectable style={styles.summaryTitle}>
                Daily summary
              </Text>
              <Text selectable style={styles.summaryCalories}>
                {formatMacroTargetPair(nutritionSummary.consumed.calories, nutritionSummary.target.calories, 'kcal')}
              </Text>
              <Text selectable style={styles.summaryRemaining}>
                {formatRemaining(nutritionSummary.remaining.calories, ' kcal')}
              </Text>
            </View>
            <View style={styles.summaryBadge}>
              <Text selectable style={styles.summaryBadgeLabel}>
                Calories
              </Text>
              <Text selectable style={styles.summaryBadgeValue}>
                {formatNumber(nutritionSummary.consumed.calories)}
              </Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(nutritionSummary.calorieProgress * 100)}%` }]} />
          </View>

          <View style={styles.macroRow}>
            {[
              { key: 'protein', label: 'Protein', unit: 'g' },
              { key: 'carbs', label: 'Carbs', unit: 'g' },
              { key: 'fats', label: 'Fats', unit: 'g' },
            ].map((macro) => {
              const consumed = nutritionSummary.consumed[macro.key as keyof typeof nutritionSummary.consumed];
              const target = nutritionSummary.target[macro.key as keyof typeof nutritionSummary.target];
              const remaining = nutritionSummary.remaining[macro.key as keyof typeof nutritionSummary.remaining];

              return (
                <View key={macro.label} style={styles.macroPill}>
                  <Text selectable style={styles.macroLabel}>
                    {macro.label}
                  </Text>
                  <Text selectable style={styles.macroValue}>
                    {formatMacroTargetPair(consumed, target, macro.unit)}
                  </Text>
                  <Text selectable style={styles.macroDetail}>
                    {formatRemaining(remaining, ` ${macro.unit}`)}
                  </Text>
                </View>
              );
            })}
          </View>
        </AppCard>

        <AppCard>
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
                    {subtotal.calories > 0 ? (
                      <Text selectable style={styles.mealSubtotal}>
                        {formatNumber(subtotal.calories)} kcal
                      </Text>
                    ) : null}
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
                    {entries.map((entry) => (
                      <ListRow
                        key={entry.id}
                        accessibilityHint="Tap to edit this food entry"
                        detail={[
                          entry.brandName,
                          getServingInfo(entry),
                          formatCompactMacroTotals({ calories: entry.calories, protein: entry.protein, carbs: entry.carbs, fats: entry.fats }),
                        ]
                          .filter(Boolean)
                          .join(' · ')}
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
                            <Text style={styles.deleteButtonText}>Delete</Text>
                          </Pressable>
                        }
                        value={`${formatNumber(entry.calories)} kcal`}
                      />
                    ))}
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
    dateButton: {
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
    dateButtonText: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '900',
      lineHeight: 18,
    },
    dateCenter: {
      alignItems: 'center',
      flex: 1,
      gap: 2,
    },
    dateLabel: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '800',
      textAlign: 'center',
    },
    dateMeta: {
      color: colors.textSecondary,
      fontSize: 12,
      fontVariant: ['tabular-nums'],
    },
    dateRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.one,
    },
    deleteButton: {
      alignItems: 'center',
      minHeight: 44,
      justifyContent: 'center',
      minWidth: 64,
    },
    deleteButtonText: {
      color: colors.error,
      fontSize: 13,
      fontWeight: '800',
    },
    emptyMealLine: {
      color: colors.textSecondary,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
      paddingVertical: Spacing.two,
    },
    foodList: {
      gap: Spacing.two,
      paddingTop: Spacing.two,
    },
    header: {
      alignItems: 'flex-start',
    },
    macroDetail: {
      color: colors.textSecondary,
      fontSize: 12,
      fontVariant: ['tabular-nums'],
    },
    macroLabel: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    macroPill: {
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      flex: 1,
      gap: 2,
      minWidth: 92,
      padding: Spacing.two,
    },
    macroRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.two,
    },
    macroValue: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '800',
      fontVariant: ['tabular-nums'],
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
    progressFill: {
      backgroundColor: colors.accent,
      borderRadius: 999,
      height: '100%',
      minWidth: 12,
    },
    progressTrack: {
      backgroundColor: colors.backgroundSelected,
      borderRadius: 999,
      height: 6,
      marginTop: Spacing.two,
      overflow: 'hidden',
    },
    screen: {
      backgroundColor: colors.background,
      flex: 1,
    },
    sectionHeader: {
      marginBottom: Spacing.two,
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '800',
    },
    summaryBadge: {
      alignItems: 'flex-end',
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      gap: 2,
      paddingHorizontal: Spacing.two,
      paddingVertical: Spacing.one,
    },
    summaryBadgeLabel: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    summaryBadgeValue: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '900',
      fontVariant: ['tabular-nums'],
    },
    summaryCalories: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: '900',
      fontVariant: ['tabular-nums'],
    },
    summaryCopy: {
      flex: 1,
      gap: 2,
    },
    summaryHeader: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: Spacing.two,
      justifyContent: 'space-between',
    },
    summaryRemaining: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '700',
    },
    summaryTitle: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '800',
    },
    todayButton: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      height: 44,
      justifyContent: 'center',
      paddingHorizontal: Spacing.two,
    },
    todayButtonText: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: '800',
    },
    todaySpacer: {
      width: 44,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: '900',
    },
  });
