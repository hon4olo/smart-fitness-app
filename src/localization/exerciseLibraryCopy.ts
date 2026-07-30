import type { SupportedLocale } from './messages';

const ruFacetLabels: Record<string, string> = {
  all: 'Все',
  beginner: 'Начальный',
  intermediate: 'Средний',
  advanced: 'Продвинутый',
  compound: 'Многосуставное',
  isolation: 'Изолирующее',
  cardio: 'Кардио',
  mobility: 'Мобильность',
  skill: 'Навык',
};

const titleCase = (value: string) =>
  value
    .replace(/[_-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');

export const getExerciseLibraryCopy = (locale: SupportedLocale) => ({
  toggleBrowser: locale === 'ru' ? 'Показать или скрыть библиотеку упражнений' : 'Toggle exercise browser',
  browserTitle: locale === 'ru' ? 'Библиотека упражнений' : 'Exercise browser',
  browserSubtitle:
    locale === 'ru'
      ? 'Поиск по названиям, тегам, оборудованию, мышцам и похожим движениям.'
      : 'Search aliases, tags, equipment, muscles, and similar movements.',
  searchLabel: locale === 'ru' ? 'Поиск упражнений' : 'Search exercises',
  searchPlaceholder:
    locale === 'ru'
      ? 'Название, тег, оборудование или мышца…'
      : 'Search aliases, tags, equipment, muscles…',
  searchHint:
    locale === 'ru'
      ? 'Поддерживается частичное совпадение по названиям, альтернативным названиям, тегам, оборудованию и мышцам.'
      : 'Partial matches are supported across names, aliases, tags, equipment, and muscle names.',
  filterBar: locale === 'ru' ? 'Фильтры' : 'Filter bar',
  clearFilters: locale === 'ru' ? 'Сбросить фильтры' : 'Clear filters',
  clearFiltersAccessibility:
    locale === 'ru' ? 'Сбросить фильтры упражнений' : 'Clear exercise filters',
  filterHint:
    locale === 'ru' ? 'Включает или выключает фильтр упражнений' : 'Toggle this exercise filter',
  muscle: locale === 'ru' ? 'Мышцы' : 'Muscle',
  equipment: locale === 'ru' ? 'Оборудование' : 'Equipment',
  difficulty: locale === 'ru' ? 'Сложность' : 'Difficulty',
  exerciseType: locale === 'ru' ? 'Тип упражнения' : 'Exercise type',
  all: locale === 'ru' ? 'Все' : 'All',
  favorites: locale === 'ru' ? 'Избранное' : 'Favorites',
  favoriteHint:
    locale === 'ru'
      ? 'Нажмите звезду у упражнения, чтобы закрепить его здесь.'
      : 'Tap the star on any exercise to pin it here.',
  favoriteSection: locale === 'ru' ? 'Сохранённое' : 'Saved',
  favoriteExercises: locale === 'ru' ? 'Избранные упражнения' : 'Favorite exercises',
  recentlyUsed: locale === 'ru' ? 'Недавно использованные' : 'Recently used',
  recentHint:
    locale === 'ru'
      ? 'Здесь появятся 10 последних уникальных упражнений из истории тренировок.'
      : 'Your last 10 unique exercises from workout history will appear here.',
  recentSection: locale === 'ru' ? 'Недавнее' : 'Recent',
  recentlyUsedExercises:
    locale === 'ru' ? 'Недавно использованные упражнения' : 'Recently used exercises',
  browseResults: locale === 'ru' ? 'Результаты' : 'Browse results',
  browseSection: locale === 'ru' ? 'Каталог' : 'Browse',
  allExercises: locale === 'ru' ? 'Все упражнения' : 'All exercises',
  alreadySectioned:
    locale === 'ru'
      ? 'Все подходящие упражнения уже показаны в избранном или недавних.'
      : 'Everything matching the current search already appears in Favorites or Recently Used.',
  noMatchesTitle: locale === 'ru' ? 'Ничего не найдено' : 'Nothing matches',
  noFilteredMatches:
    locale === 'ru'
      ? 'Нет упражнений, соответствующих текущему поиску и фильтрам.'
      : 'No exercises match your current search and filters.',
  noExercises: locale === 'ru' ? 'Упражнения не найдены.' : 'No exercises found.',
  broadenSearch:
    locale === 'ru'
      ? 'Измените запрос или сбросьте фильтры, чтобы увидеть больше упражнений.'
      : 'Broaden the search or reset the filter bar to see more exercises.',
  addFirst:
    locale === 'ru'
      ? 'Добавьте первое упражнение, чтобы библиотека стала полезнее.'
      : 'Add the first exercise to your library to make browsing faster.',
  addCustom: locale === 'ru' ? 'Добавить своё упражнение' : 'Add custom exercise',
  exerciseName: locale === 'ru' ? 'Название упражнения' : 'Exercise name',
  exerciseNamePlaceholder: locale === 'ru' ? 'Жим лёжа' : 'Bench press',
  muscleGroup: locale === 'ru' ? 'Группа мышц' : 'Muscle group',
  muscleGroupPlaceholder: locale === 'ru' ? 'Грудь' : 'Chest',
  saveExercise: locale === 'ru' ? 'Сохранить упражнение' : 'Save exercise',
  add: locale === 'ru' ? 'Добавить' : 'Add',
  added: locale === 'ru' ? 'Добавлено' : 'Added',
  details: locale === 'ru' ? 'Подробнее' : 'Details',
  delete: locale === 'ru' ? 'Удалить' : 'Delete',
  openDetails: (name: string) =>
    locale === 'ru' ? `Открыть сведения об упражнении «${name}»` : `Open details for ${name}`,
  addFavorite: (name: string) =>
    locale === 'ru' ? `Добавить «${name}» в избранное` : `Add ${name} to favorites`,
  removeFavorite: (name: string) =>
    locale === 'ru' ? `Удалить «${name}» из избранного` : `Remove ${name} from favorites`,
  closeDetails: (name: string) =>
    locale === 'ru' ? `Закрыть сведения об упражнении «${name}»` : `Close exercise details for ${name}`,
  databaseEntry: locale === 'ru' ? 'Упражнение из базы' : 'Exercise database entry',
  summary: locale === 'ru' ? 'Сводка' : 'Summary',
  primaryMuscles: locale === 'ru' ? 'Основные мышцы' : 'Primary muscles',
  secondaryMuscles: locale === 'ru' ? 'Дополнительные мышцы' : 'Secondary muscles',
  bodyweight: locale === 'ru' ? 'Собственный вес' : 'Bodyweight',
  intermediate: locale === 'ru' ? 'Средний' : 'Intermediate',
  compound: locale === 'ru' ? 'Многосуставное' : 'Compound',
  type: locale === 'ru' ? 'Тип' : 'Type',
  instructions: locale === 'ru' ? 'Инструкция' : 'Instructions',
  noInstructions:
    locale === 'ru'
      ? 'Для этого упражнения инструкция не сохранена.'
      : 'No instructions saved for this exercise.',
  tips: locale === 'ru' ? 'Советы' : 'Tips',
  noTips:
    locale === 'ru' ? 'Для этого упражнения советы не сохранены.' : 'No tips saved for this exercise.',
  commonMistakes: locale === 'ru' ? 'Частые ошибки' : 'Common mistakes',
  noMistakes:
    locale === 'ru'
      ? 'Для этого упражнения частые ошибки не сохранены.'
      : 'No common mistakes saved for this exercise.',
  similarExercises: locale === 'ru' ? 'Похожие упражнения' : 'Similar exercises',
  noSimilar:
    locale === 'ru'
      ? 'В текущей библиотеке нет близких вариантов.'
      : 'No close matches in the current library.',
  addSimilar: (name: string) =>
    locale === 'ru' ? `Добавить похожее упражнение «${name}»` : `Add similar exercise ${name}`,
  addToWorkout: locale === 'ru' ? 'Добавить в тренировку' : 'Add to workout',
  close: locale === 'ru' ? 'Закрыть' : 'Close',
  facetLabel: (value: string) =>
    locale === 'ru' ? ruFacetLabels[value.toLowerCase()] ?? titleCase(value) : titleCase(value),
});
