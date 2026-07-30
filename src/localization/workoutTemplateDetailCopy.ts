import type { SupportedLocale } from './messages';

const pluralRu = (count: number, forms: [string, string, string]) => {
  const mod10 = Math.abs(count) % 10;
  const mod100 = Math.abs(count) % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
};

export const getWorkoutTemplateDetailCopy = (locale: SupportedLocale) => ({
  loading: locale === 'ru' ? 'Загрузка тренировки…' : 'Loading workout…',
  notFound: locale === 'ru' ? 'Тренировка не найдена' : 'Workout not found',
  backToWorkouts: locale === 'ru' ? 'Назад к тренировкам' : 'Back to Workouts',
  back: locale === 'ru' ? 'Назад' : 'Back',
  headerTitle: locale === 'ru' ? 'Тренировка' : 'Workout',
  shareUnavailable:
    locale === 'ru' ? 'Поделиться — пока недоступно' : 'Share — not available yet',
  moreOptions: locale === 'ru' ? 'Другие действия' : 'More actions',
  cancel: locale === 'ru' ? 'Отмена' : 'Cancel',
  addFavorite: locale === 'ru' ? 'Добавить в избранное' : 'Add to favorites',
  removeFavorite: locale === 'ru' ? 'Убрать из избранного' : 'Remove from favorites',
  deleteWorkout: locale === 'ru' ? 'Удалить тренировку' : 'Delete workout',
  deleteTitle: locale === 'ru' ? 'Удалить тренировку?' : 'Delete workout?',
  deleteBody:
    locale === 'ru'
      ? 'Будет удалён только шаблон. Завершённые тренировки останутся в истории.'
      : 'This removes the template only. Completed sessions stay in history.',
  delete: locale === 'ru' ? 'Удалить' : 'Delete',
  startWorkout: locale === 'ru' ? 'Начать тренировку' : 'Start Workout',
  startWorkoutHint:
    locale === 'ru'
      ? 'Создаёт активную тренировку из этого шаблона'
      : 'Creates an active workout from this template',
  setCount: (count: number, formatted: string) =>
    locale === 'ru'
      ? `${formatted} ${pluralRu(count, ['подход', 'подхода', 'подходов'])}`
      : `${formatted} ${count === 1 ? 'set' : 'sets'}`,
});

export type WorkoutTemplateDetailCopy = ReturnType<typeof getWorkoutTemplateDetailCopy>;
