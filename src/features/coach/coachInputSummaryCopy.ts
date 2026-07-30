import type { CoachInputCoverage } from '@/api/coach';
import type { SupportedLocale } from '@/localization';

export const getCoachInputSummaryCopy = (locale: SupportedLocale) => ({
  title: locale === 'ru' ? 'Использованные данные' : 'Inputs used',
  description:
    locale === 'ru'
      ? 'Показаны только количество и наличие данных. Значения, названия и идентификаторы не раскрываются.'
      : 'Only coverage counts and availability are shown. Values, names, and identifiers are not exposed.',
  unavailable:
    locale === 'ru'
      ? 'Сводка использованных данных не прошла проверку и не отображается.'
      : 'The input summary failed validation and is not displayed.',
  sourceUnavailable:
    locale === 'ru'
      ? 'Сведения об этом источнике недоступны.'
      : 'Coverage for this source is unavailable.',
  notRecorded: locale === 'ru' ? 'не записано' : 'not recorded',
  lookback: locale === 'ru' ? 'Период анализа' : 'Analysis window',
  foodEntries: locale === 'ru' ? 'Записи питания' : 'Food entries',
  loggedDays: locale === 'ru' ? 'Дни с записями' : 'Logged days',
  weightEntries: locale === 'ru' ? 'Записи веса' : 'Weight entries',
  latestWeight: locale === 'ru' ? 'Последний вес доступен' : 'Latest weight available',
  activeTarget: locale === 'ru' ? 'Текущая цель питания' : 'Active nutrition target',
  fitnessProfile: locale === 'ru' ? 'Фитнес-профиль доступен' : 'Fitness profile available',
  specificSession: locale === 'ru' ? 'Выбрана конкретная сессия' : 'Specific session requested',
  historyLimit: locale === 'ru' ? 'Лимит истории' : 'History limit',
  sessions: locale === 'ru' ? 'Тренировочные сессии' : 'Workout sessions',
  completedSets: locale === 'ru' ? 'Завершённые подходы' : 'Completed sets',
  exercises: locale === 'ru' ? 'Различные упражнения' : 'Distinct exercises',
  rpeSets: locale === 'ru' ? 'Подходы с фактическим RPE' : 'Sets with actual RPE',
  limitations: locale === 'ru' ? 'Активные ограничения' : 'Active limitations',
  pauseTraining: locale === 'ru' ? 'Требовали паузы' : 'Pause-training restrictions',
  avoidMovement: locale === 'ru' ? 'Исключённые движения' : 'Avoid-movement restrictions',
  reduceLoad: locale === 'ru' ? 'Ограничения нагрузки' : 'Reduced-load restrictions',
  checkIns: locale === 'ru' ? 'Проверки восстановления' : 'Recovery check-ins',
  limitationNotes: locale === 'ru' ? 'Ограничения с заметками' : 'Limitations with notes',
  checkInNotes: locale === 'ru' ? 'Проверки с заметками' : 'Check-ins with notes',
  yes: locale === 'ru' ? 'Да' : 'Yes',
  no: locale === 'ru' ? 'Нет' : 'No',
  days: (value: number) =>
    locale === 'ru'
      ? `${value} ${value % 10 === 1 && value % 100 !== 11 ? 'день' : value % 10 >= 2 && value % 10 <= 4 && (value % 100 < 12 || value % 100 > 14) ? 'дня' : 'дней'}`
      : `${value} ${value === 1 ? 'day' : 'days'}`,
  domain: (domain: CoachInputCoverage['domain']) => {
    if (domain === 'nutrition') return locale === 'ru' ? 'Питание' : 'Nutrition';
    if (domain === 'strength') return locale === 'ru' ? 'Силовой тренинг' : 'Strength';
    return locale === 'ru' ? 'Безопасность и восстановление' : 'Safety & Recovery';
  },
});
