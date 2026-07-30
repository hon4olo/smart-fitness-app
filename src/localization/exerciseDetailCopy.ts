import type { SupportedLocale } from './messages';

export type ExerciseDetailErrorCode = 'missing' | 'not_found' | 'load_failed';

export const getExerciseDetailCopy = (locale: SupportedLocale) => {
  const isRussian = locale === 'ru';

  return {
    tabs: {
      about: isRussian ? 'Об упражнении' : 'About',
      history: isRussian ? 'История' : 'History',
      progress: isRussian ? 'Прогресс' : 'Progress',
    },
    loading: isRussian ? 'Загрузка упражнения…' : 'Loading exercise…',
    errorTitle: (code: ExerciseDetailErrorCode) => {
      if (isRussian) {
        if (code === 'missing') return 'Упражнение не выбрано';
        if (code === 'not_found') return 'Упражнение не найдено';
        return 'Не удалось загрузить упражнение';
      }
      if (code === 'missing') return 'No exercise selected';
      if (code === 'not_found') return 'Exercise not found';
      return 'Could not load exercise';
    },
    errorDescription: isRussian
      ? 'Выбранное упражнение не удалось загрузить из локального каталога.'
      : 'The selected exercise could not be loaded from the local catalog.',
    back: isRussian ? 'Назад' : 'Back',
    more: isRussian ? 'Ещё' : 'More',
    sectionsAccessibility: isRussian ? 'Разделы упражнения' : 'Exercise detail sections',
    pause: isRussian ? 'Пауза' : 'Pause',
    play: isRussian ? 'Воспроизвести' : 'Play',
    pauseMedia: isRussian ? 'Приостановить анимацию упражнения' : 'Pause exercise animation',
    playMedia: isRussian ? 'Воспроизвести анимацию упражнения' : 'Play exercise animation',
    attribution: isRussian
      ? 'Данные упражнения и GIF предоставлены AscendAPI / ExerciseDB.'
      : 'Exercise data and GIFs provided by AscendAPI / ExerciseDB.',
    shareExercise: isRussian ? 'Поделиться' : 'Share exercise',
    favorite: isRussian ? 'В избранном' : 'Favorited',
    addFavorite: isRussian ? 'В избранное' : 'Add to favorites',
    primaryMuscles: isRussian ? 'Основные мышцы' : 'Primary muscles',
    secondaryMuscles: isRussian ? 'Дополнительные мышцы' : 'Secondary muscles',
    details: isRussian ? 'Сведения' : 'Details',
    bodyPart: isRussian ? 'Часть тела' : 'Body part',
    equipment: isRussian ? 'Оборудование' : 'Equipment',
    aliases: isRussian ? 'Другие названия' : 'Aliases',
    none: isRussian ? 'Нет' : 'None',
    notSpecified: isRussian ? 'Не указано' : 'Not specified',
    instructions: isRussian ? 'Инструкция' : 'Instructions',
    coachingTips: isRussian ? 'Советы по технике' : 'Coaching tips',
    noEntries: isRussian ? 'Данных пока нет.' : 'No entries yet.',
    noHistoryTitle: isRussian ? 'Истории пока нет' : 'No history yet',
    noHistoryDescription: isRussian
      ? 'Здесь появятся завершённые подходы этого упражнения.'
      : 'Completed sets for this exercise will appear here.',
    noProgressTitle: isRussian ? 'Прогресса пока нет' : 'No progress yet',
    noProgressDescription: isRussian
      ? 'Завершите подходы этого упражнения, чтобы рассчитать лучший вес, повторы, объём и примерный одноповторный максимум.'
      : 'Complete sets for this exercise to calculate best weight, reps, volume and estimated one-rep max.',
    bestWeight: isRussian ? 'Лучший вес' : 'Best weight',
    bestReps: isRussian ? 'Лучшие повторы' : 'Best reps',
    volume: isRussian ? 'Объём' : 'Volume',
    estimatedOneRepMax: isRussian ? 'Примерный 1ПМ' : 'Est. 1RM',
    volumeTrend: isRussian ? 'Динамика объёма' : 'Volume trend',
    volumeTrendEmpty: isRussian
      ? 'Выполните упражнение минимум в двух тренировках, чтобы увидеть динамику.'
      : 'Log this exercise in at least two workouts to show a trend.',
    high: (unit: string) => (isRussian ? `Максимум · ${unit}` : `High · ${unit}`),
    low: (unit: string) => (isRussian ? `Минимум · ${unit}` : `Low · ${unit}`),
    shareMessage: (name: string, equipment: string, primaryMuscles: string) =>
      isRussian
        ? `${name}\nОборудование: ${equipment}\nОсновные мышцы: ${primaryMuscles}`
        : `${name}\nEquipment: ${equipment}\nPrimary muscles: ${primaryMuscles}`,
  };
};
