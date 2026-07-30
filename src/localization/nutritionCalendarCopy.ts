import type { SupportedLocale } from './messages';

export const getNutritionCalendarCopy = (locale: SupportedLocale) => ({
  cancel: locale === 'ru' ? 'Отмена' : 'Cancel',
  done: locale === 'ru' ? 'Готово' : 'Done',
  title: locale === 'ru' ? 'Календарь' : 'Calendar',
  subtitle: locale === 'ru' ? 'Перейдите к любому дню' : 'Jump to any day',
  previousMonth: locale === 'ru' ? 'Предыдущий месяц' : 'Previous month',
  nextMonth: locale === 'ru' ? 'Следующий месяц' : 'Next month',
  weekDays: locale === 'ru'
    ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  dayAccessibility: ({
    day,
    isLogged,
    isToday,
    weekday,
  }: {
    day: string;
    isLogged: boolean;
    isToday: boolean;
    weekday: string;
  }) => {
    if (locale === 'ru') {
      return `${weekday} ${day}${isToday ? ', сегодня' : ''}${isLogged ? ', питание записано' : ', записей питания нет'}`;
    }
    return `${weekday} ${day}${isToday ? ', today' : ''}${isLogged ? ', food logged' : ', no food logged'}`;
  },
});
