import { Pressable, Text, View } from 'react-native';

export type NutritionWeekDay = {
  dateKey: string;
  dayLabel: string;
  isLogged: boolean;
  isSelected: boolean;
  isToday: boolean;
};

type NutritionWeekStripProps = {
  formatWeekdayLong: (dateKey: string) => string;
  onSelectDate: (dateKey: string) => void;
  styles: Record<string, any>;
  weekDays: NutritionWeekDay[];
};

export function NutritionWeekStrip({ formatWeekdayLong, onSelectDate, styles, weekDays }: NutritionWeekStripProps) {
  return (
    <View style={styles.weekSection}>
      <View style={styles.weekStrip}>
        {weekDays.map((day) => (
          <Pressable
            key={day.dateKey}
            accessibilityLabel={`${formatWeekdayLong(day.dateKey)}, ${day.isLogged ? 'food logged' : 'no food logged'}${day.isToday ? ', today' : ''}`}
            accessibilityState={{ selected: day.isSelected }}
            hitSlop={12}
            onPress={() => onSelectDate(day.dateKey)}
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
  );
}
