import type { SupportedLocale } from './messages';

export const getWorkoutSessionExercisePickerCopy = (locale: SupportedLocale) => ({
  addCount: (count: string) =>
    locale === 'ru' ? `Добавить: ${count}` : `Add ${count}`,
  addSelected: locale === 'ru' ? 'Добавить выбранные' : 'Add selected',
  all: locale === 'ru' ? 'Все' : 'All',
  allExercises: locale === 'ru' ? 'Все упражнения' : 'All exercises',
  attribution:
    locale === 'ru'
      ? 'Данные упражнений и GIF предоставлены AscendAPI / ExerciseDB.'
      : 'Exercise data and GIFs provided by AscendAPI / ExerciseDB.',
  back: locale === 'ru' ? 'Назад' : 'Back',
  databaseUnavailable:
    locale === 'ru' ? 'База упражнений недоступна' : 'Exercise database unavailable',
  details: locale === 'ru' ? 'Подробнее' : 'Details',
  equipment: locale === 'ru' ? 'Оборудование' : 'Equipment',
  loadError:
    locale === 'ru'
      ? 'Не удалось загрузить упражнения.'
      : 'Could not load exercises.',
  loading: locale === 'ru' ? 'Загрузка упражнений…' : 'Loading exercises…',
  muscle: locale === 'ru' ? 'Мышцы' : 'Muscle',
  noEquipment: locale === 'ru' ? 'Без оборудования' : 'No equipment',
  noExercises: locale === 'ru' ? 'Упражнения не найдены' : 'No exercises found',
  noExercisesHint:
    locale === 'ru'
      ? 'Измените запрос, мышцу или фильтр оборудования.'
      : 'Try a different search, muscle, or equipment filter.',
  openDetails: (name: string) =>
    locale === 'ru' ? `Открыть сведения об упражнении «${name}»` : `Open details for ${name}`,
  pickerSubtitle:
    locale === 'ru'
      ? 'Выберите одно или несколько движений для активной тренировки.'
      : 'Pick one or more movements to add to the active workout.',
  recent: locale === 'ru' ? 'Недавние' : 'Recent',
  retry: locale === 'ru' ? 'Повторить' : 'Retry',
  searchError:
    locale === 'ru'
      ? 'Не удалось выполнить поиск упражнений.'
      : 'Could not search exercises.',
  searchPlaceholder: locale === 'ru' ? 'Поиск упражнений' : 'Search exercises',
  searchResults: locale === 'ru' ? 'Результаты поиска' : 'Search results',
  secondaryMuscles: (names: string) =>
    locale === 'ru' ? `Дополнительные: ${names}` : `Secondary: ${names}`,
  title: locale === 'ru' ? 'Библиотека упражнений' : 'Exercise Library',
});

export type WorkoutSessionExercisePickerCopy = ReturnType<
  typeof getWorkoutSessionExercisePickerCopy
>;
