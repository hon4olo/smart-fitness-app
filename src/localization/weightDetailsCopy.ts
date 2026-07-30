import type { SupportedLocale } from './messages';

export const getWeightDetailsCopy = (locale: SupportedLocale) => ({
  title: locale === 'ru' ? 'Динамика веса' : 'Weight details',
  subtitle: locale === 'ru' ? 'Подробный анализ изменений веса.' : 'Detailed trend view.',
  currentWeight: locale === 'ru' ? 'Текущий вес' : 'Current weight',
  trend: locale === 'ru' ? 'Динамика' : 'Trend',
  trend30Days: (delta: string, unit: string) =>
    locale === 'ru'
      ? `${delta} ${unit} за 30 дней`
      : `${delta} ${unit} over 30 days`,
  noComparison:
    locale === 'ru' ? 'Сравнение за 30 дней пока недоступно' : 'No 30-day comparison yet',
  chartEmpty:
    locale === 'ru'
      ? 'Добавьте несколько записей веса, чтобы увидеть динамику.'
      : 'Add a few weigh-ins to see the trend.',
  addAnother:
    locale === 'ru'
      ? 'Добавьте ещё одну запись веса, чтобы построить график.'
      : 'Add another weigh-in to reveal the chart.',
  recentWeighIns: locale === 'ru' ? 'Последние записи веса' : 'Recent weigh-ins',
  noWeighIns:
    locale === 'ru' ? 'Записей веса пока нет.' : 'No weigh-ins recorded yet.',
  trainingHistory: locale === 'ru' ? 'История тренировок' : 'Training history',
  trainingHistoryBody:
    locale === 'ru'
      ? 'Откройте завершённые тренировки, записанные подходы, значения RPE и контекст безопасности и восстановления перед каждой сессией.'
      : 'Open completed workouts, logged sets, RPE values and the Safety & Recovery context recorded before each session.',
  openWorkoutHistory:
    locale === 'ru' ? 'Открыть историю тренировок' : 'Open workout history',
  back: locale === 'ru' ? 'Назад' : 'Back',
});
