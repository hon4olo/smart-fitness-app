import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppCard } from '@/components/ui/AppCard';
import { Colors, MaxContentWidth, Radii, Spacing } from '@/constants/theme';
import { useNutritionState } from '@/context/AppContext';
import { addDays, formatLocalDate } from '@/lib';
import { getLoggedFoodDates } from '@/lib/nutrition';
import { useLocalization } from '@/localization';
import { getNutritionCalendarCopy } from '@/localization/nutritionCalendarCopy';
import { useAppTheme } from '@/theme/AppThemeProvider';

const getMonthGridStart = (year: number, monthIndex: number) => {
  const firstOfMonth = new Date(year, monthIndex, 1, 12, 0, 0);
  const dayOfWeek = firstOfMonth.getDay();
  const offset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  return addDays(formatLocalDate(firstOfMonth), offset);
};

export default function NutritionDatePickerScreen() {
  const { colors } = useAppTheme();
  const { formatDate, locale } = useLocalization();
  const copy = getNutritionCalendarCopy(locale);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { foodEntries } = useNutritionState();
  const params = useLocalSearchParams<{ date?: string }>();
  const todayKey = useMemo(() => formatLocalDate(new Date()), []);
  const initialDate =
    typeof params.date === 'string' && params.date.length > 0 ? params.date : todayKey;
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [monthAnchor, setMonthAnchor] = useState(initialDate.slice(0, 7));

  const monthDate = useMemo(() => {
    const parsed = new Date(`${monthAnchor}-01T12:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      return new Date(`${todayKey.slice(0, 7)}-01T12:00:00`);
    }
    return parsed;
  }, [monthAnchor, todayKey]);

  const monthTitle = formatDate(monthDate, { month: 'long', year: 'numeric' });
  const loggedDaySet = useMemo(() => getLoggedFoodDates(foodEntries), [foodEntries]);
  const dayCells = useMemo(() => {
    const gridStart = getMonthGridStart(monthDate.getFullYear(), monthDate.getMonth());
    return Array.from({ length: 42 }, (_, index) => {
      const dateKey = addDays(gridStart, index);
      const cellDate = new Date(`${dateKey}T12:00:00`);
      return {
        dateKey,
        dayLabel: formatDate(cellDate, { day: 'numeric' }),
        weekdayLabel: formatDate(cellDate, { weekday: 'short' }),
        inMonth: cellDate.getMonth() === monthDate.getMonth(),
        isSelected: dateKey === selectedDate,
        isToday: dateKey === todayKey,
        isLogged: loggedDaySet.has(dateKey),
      };
    });
  }, [formatDate, loggedDaySet, monthDate, selectedDate, todayKey]);

  const goToPreviousMonth = () => {
    const previousMonth = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth() - 1,
      1,
      12,
      0,
      0,
    );
    setMonthAnchor(formatLocalDate(previousMonth).slice(0, 7));
  };

  const goToNextMonth = () => {
    const nextMonth = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth() + 1,
      1,
      12,
      0,
      0,
    );
    setMonthAnchor(formatLocalDate(nextMonth).slice(0, 7));
  };

  const applyDate = (dateKey: string) => {
    setSelectedDate(dateKey);
    setMonthAnchor(dateKey.slice(0, 7));
  };

  const confirmDate = () => {
    router.replace({ pathname: '/nutrition', params: { date: selectedDate } });
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: insets.bottom + Spacing.six,
            paddingTop: insets.top + Spacing.three,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <Pressable
              accessibilityLabel={copy.cancel}
              hitSlop={10}
              onPress={() => router.back()}
              style={styles.headerButton}>
              <Text style={styles.headerButtonText}>{copy.cancel}</Text>
            </Pressable>
            <View style={styles.headerCopy}>
              <Text selectable style={styles.title}>{copy.title}</Text>
              <Text selectable style={styles.subtitle}>{copy.subtitle}</Text>
            </View>
            <Pressable
              accessibilityLabel={copy.done}
              hitSlop={10}
              onPress={confirmDate}
              style={styles.headerButton}>
              <Text style={styles.headerButtonText}>{copy.done}</Text>
            </Pressable>
          </View>

          <AppCard style={styles.calendarCard}>
            <View style={styles.monthRow}>
              <Pressable
                accessibilityLabel={copy.previousMonth}
                hitSlop={10}
                onPress={goToPreviousMonth}
                style={styles.monthNavButton}>
                <Text style={styles.monthNavText}>‹</Text>
              </Pressable>
              <Text selectable style={styles.monthTitle}>{monthTitle}</Text>
              <Pressable
                accessibilityLabel={copy.nextMonth}
                hitSlop={10}
                onPress={goToNextMonth}
                style={styles.monthNavButton}>
                <Text style={styles.monthNavText}>›</Text>
              </Pressable>
            </View>

            <View style={styles.weekHeader}>
              {copy.weekDays.map((day) => (
                <View key={day} style={styles.weekHeaderCell}>
                  <Text selectable style={styles.weekHeaderLabel}>{day}</Text>
                </View>
              ))}
            </View>

            <View style={styles.grid}>
              {dayCells.map((day) => (
                <View key={day.dateKey} style={styles.daySlot}>
                  <Pressable
                    accessibilityLabel={copy.dayAccessibility({
                      day: day.dayLabel,
                      isLogged: day.isLogged,
                      isToday: day.isToday,
                      weekday: day.weekdayLabel,
                    })}
                    accessibilityState={{ selected: day.isSelected }}
                    hitSlop={4}
                    onPress={() => applyDate(day.dateKey)}
                    style={[
                      styles.dayCell,
                      !day.inMonth && styles.dayCellMuted,
                      day.isLogged && styles.dayCellLogged,
                      day.isToday && !day.isLogged && styles.dayCellToday,
                      day.isSelected && styles.dayCellSelected,
                    ]}>
                    <Text
                      selectable
                      style={[
                        styles.dayCellText,
                        !day.inMonth && styles.dayCellTextMuted,
                        day.isSelected && styles.dayCellTextSelected,
                      ]}>
                      {day.dayLabel}
                    </Text>
                    {day.isLogged ? (
                      <Text
                        style={[
                          styles.dayCellCheck,
                          day.isSelected && styles.dayCellCheckSelected,
                        ]}>
                        ✓
                      </Text>
                    ) : null}
                    {day.isToday && !day.isLogged ? (
                      <View
                        style={[
                          styles.todayDot,
                          day.isSelected && styles.todayDotSelected,
                        ]}
                      />
                    ) : null}
                  </Pressable>
                </View>
              ))}
            </View>
          </AppCard>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: typeof Colors.dark) =>
  StyleSheet.create({
    calendarCard: {
      borderRadius: Radii.medium,
      gap: Spacing.two,
      padding: Spacing.three,
    },
    content: {
      alignItems: 'center',
      paddingHorizontal: Spacing.three,
    },
    container: {
      gap: Spacing.three,
      maxWidth: MaxContentWidth,
      width: '100%',
    },
    dayCell: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      gap: 1,
      height: 38,
      justifyContent: 'center',
      width: 38,
    },
    dayCellMuted: {
      opacity: 0.5,
    },
    dayCellSelected: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
      opacity: 1,
    },
    dayCellText: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: '800',
      fontVariant: ['tabular-nums'],
      lineHeight: 15,
    },
    dayCellTextMuted: {
      color: colors.textSecondary,
    },
    dayCellTextSelected: {
      color: colors.textOnAccent,
    },
    dayCellCheck: {
      color: colors.accent,
      fontSize: 7,
      fontWeight: '900',
      lineHeight: 7,
      textAlign: 'center',
    },
    dayCellCheckSelected: {
      color: colors.textOnAccent,
    },
    dayCellLogged: {
      borderColor: colors.accentSoft,
      borderWidth: 1,
    },
    dayCellToday: {
      borderColor: colors.accent,
    },
    daySlot: {
      alignItems: 'center',
      paddingVertical: 3,
      width: '14.285714%',
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      width: '100%',
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
      minWidth: 64,
      paddingHorizontal: Spacing.three,
    },
    headerButtonText: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: '800',
    },
    headerCopy: {
      alignItems: 'center',
      flex: 1,
      gap: 2,
    },
    headerRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.two,
    },
    monthNavButton: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      height: 40,
      justifyContent: 'center',
      width: 40,
    },
    monthNavText: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: '900',
      lineHeight: 20,
    },
    monthRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    monthTitle: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: 18,
      fontWeight: '900',
      textAlign: 'center',
    },
    screen: {
      backgroundColor: colors.background,
      flex: 1,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '700',
    },
    title: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: '900',
    },
    todayDot: {
      backgroundColor: colors.accent,
      borderRadius: 999,
      height: 4,
      width: 4,
    },
    todayDotSelected: {
      backgroundColor: colors.textOnAccent,
    },
    weekHeader: {
      flexDirection: 'row',
      width: '100%',
    },
    weekHeaderCell: {
      alignItems: 'center',
      width: '14.285714%',
    },
    weekHeaderLabel: {
      color: colors.textSecondary,
      fontSize: 10,
      fontWeight: '800',
      textAlign: 'center',
    },
  });
