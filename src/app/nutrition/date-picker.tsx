import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppCard } from '@/components/ui/AppCard';
import { Colors, MaxContentWidth, Radii, Spacing } from '@/constants/theme';
import { addDays, formatLocalDate } from '@/lib';
import { useAppTheme } from '@/theme/AppThemeProvider';

const formatMonthTitle = (date: Date) =>
  new Intl.DateTimeFormat(undefined, {
    month: 'long',
    year: 'numeric',
  }).format(date);

const formatDayLabel = (dateLabel: string) => {
  const parsedDate = new Date(`${dateLabel}T12:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return dateLabel.slice(-2);
  }

  return new Intl.DateTimeFormat(undefined, { day: 'numeric' }).format(parsedDate);
};

const formatWeekday = (dateLabel: string) => {
  const parsedDate = new Date(`${dateLabel}T12:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return dateLabel.slice(0, 3);
  }

  return new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(parsedDate);
};

const getMonthGridStart = (year: number, monthIndex: number) => {
  const firstOfMonth = new Date(year, monthIndex, 1, 12, 0, 0);
  const dayOfWeek = firstOfMonth.getDay();
  const offset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  return addDays(formatLocalDate(firstOfMonth), offset);
};

export default function NutritionDatePickerScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ date?: string }>();
  const todayKey = useMemo(() => formatLocalDate(new Date()), []);
  const initialDate = typeof params.date === 'string' && params.date.length > 0 ? params.date : todayKey;
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [monthAnchor, setMonthAnchor] = useState(initialDate.slice(0, 7));

  const monthDate = useMemo(() => {
    const parsed = new Date(`${monthAnchor}-01T12:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      return new Date(`${todayKey.slice(0, 7)}-01T12:00:00`);
    }
    return parsed;
  }, [monthAnchor, todayKey]);

  const monthTitle = useMemo(() => formatMonthTitle(monthDate), [monthDate]);
  const dayCells = useMemo(() => {
    const gridStart = getMonthGridStart(monthDate.getFullYear(), monthDate.getMonth());
    return Array.from({ length: 42 }, (_, index) => {
      const dateKey = addDays(gridStart, index);
      const cellDate = new Date(`${dateKey}T12:00:00`);
      return {
        dateKey,
        dayLabel: formatDayLabel(dateKey),
        weekdayLabel: formatWeekday(dateKey),
        inMonth: cellDate.getMonth() === monthDate.getMonth(),
        isSelected: dateKey === selectedDate,
        isToday: dateKey === todayKey,
      };
    });
  }, [monthDate, selectedDate, todayKey]);

  const goToPreviousMonth = () => {
    const previousMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1, 12, 0, 0);
    setMonthAnchor(formatLocalDate(previousMonth).slice(0, 7));
  };

  const goToNextMonth = () => {
    const nextMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1, 12, 0, 0);
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
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.six, paddingTop: insets.top + Spacing.three }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <Pressable accessibilityLabel="Cancel" hitSlop={10} onPress={() => router.back()} style={styles.headerButton}>
              <Text style={styles.headerButtonText}>Cancel</Text>
            </Pressable>
            <View style={styles.headerCopy}>
              <Text selectable style={styles.title}>
                Calendar
              </Text>
              <Text selectable style={styles.subtitle}>
                Jump to any day
              </Text>
            </View>
            <Pressable accessibilityLabel="Done" hitSlop={10} onPress={confirmDate} style={styles.headerButton}>
              <Text style={styles.headerButtonText}>Done</Text>
            </Pressable>
          </View>

          <AppCard style={styles.calendarCard}>
            <View style={styles.monthRow}>
              <Pressable accessibilityLabel="Previous month" hitSlop={10} onPress={goToPreviousMonth} style={styles.monthNavButton}>
                <Text style={styles.monthNavText}>‹</Text>
              </Pressable>
              <Text selectable style={styles.monthTitle}>
                {monthTitle}
              </Text>
              <Pressable accessibilityLabel="Next month" hitSlop={10} onPress={goToNextMonth} style={styles.monthNavButton}>
                <Text style={styles.monthNavText}>›</Text>
              </Pressable>
            </View>

            <View style={styles.weekHeader}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <Text key={day} selectable style={styles.weekHeaderLabel}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.grid}>
              {dayCells.map((day) => (
                <Pressable
                  key={day.dateKey}
                  accessibilityLabel={`${day.weekdayLabel} ${day.dayLabel}${day.isToday ? ', today' : ''}`}
                  accessibilityState={{ selected: day.isSelected }}
                  hitSlop={8}
                  onPress={() => applyDate(day.dateKey)}
                  style={[
                    styles.dayCell,
                    !day.inMonth && styles.dayCellMuted,
                    day.isToday && styles.dayCellToday,
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
                  {day.isToday ? <View style={[styles.todayDot, day.isSelected && styles.todayDotSelected]} /> : null}
                </Pressable>
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
      gap: Spacing.three,
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
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      gap: 3,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    dayCellMuted: {
      opacity: 0.58,
    },
    dayCellSelected: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
      opacity: 1,
    },
    dayCellText: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '800',
      fontVariant: ['tabular-nums'],
    },
    dayCellTextMuted: {
      color: colors.textSecondary,
    },
    dayCellTextSelected: {
      color: colors.textOnAccent,
    },
    dayCellToday: {
      borderColor: colors.accent,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      justifyContent: 'space-between',
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
      height: 44,
      justifyContent: 'center',
      width: 44,
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
      fontSize: 22,
      fontWeight: '900',
    },
    todayDot: {
      backgroundColor: colors.accent,
      borderRadius: 999,
      height: 5,
      width: 5,
    },
    todayDotSelected: {
      backgroundColor: colors.textOnAccent,
    },
    weekHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    weekHeaderLabel: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: '800',
      textAlign: 'center',
      width: 44,
    },
  });
