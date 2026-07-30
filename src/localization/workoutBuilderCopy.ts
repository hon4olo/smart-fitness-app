import type { SupportedLocale } from './messages';

const pluralRu = (count: number, forms: [string, string, string]) => {
  const mod10 = Math.abs(count) % 10;
  const mod100 = Math.abs(count) % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
};

export const getWorkoutBuilderCopy = (locale: SupportedLocale) => ({
  discardChanges: locale === 'ru' ? 'Отменить изменения?' : 'Discard changes?',
  keepEditing: locale === 'ru' ? 'Продолжить редактирование' : 'Keep editing',
  discard: locale === 'ru' ? 'Отменить изменения' : 'Discard',
  noProgramTemplate:
    locale === 'ru' ? 'Шаблон программы недоступен' : 'No program template available',
  noProgramTemplateBody:
    locale === 'ru'
      ? 'Сначала создайте шаблон тренировки, затем вернитесь к созданию программы.'
      : 'Create a workout template first, then come back to build a program.',
  back: locale === 'ru' ? 'Назад' : 'Back',
  cancel: locale === 'ru' ? 'Отмена' : 'Cancel',
  editProgram: locale === 'ru' ? 'Редактировать программу' : 'Edit program',
  createProgram: locale === 'ru' ? 'Создать программу' : 'Create program',
  save: locale === 'ru' ? 'Сохранить' : 'Save',
  programName: locale === 'ru' ? 'Название программы' : 'Program name',
  programNamePlaceholder: locale === 'ru' ? 'Силовой блок' : 'Strength block',
  workouts: locale === 'ru' ? 'Тренировки' : 'Workouts',
  startNextWorkout:
    locale === 'ru' ? 'Начать следующую тренировку' : 'Start next workout',
  noWorkoutsAdded:
    locale === 'ru' ? 'Тренировки ещё не добавлены' : 'No workouts added yet',
  noWorkoutsAddedBody:
    locale === 'ru'
      ? 'Добавьте сохранённые тренировки или создайте новую внутри этого flow.'
      : 'Attach reusable workouts now or create a new one inside this flow.',
  workoutUnavailable: locale === 'ru' ? 'Тренировка недоступна' : 'Workout unavailable',
  workoutUnavailableBody:
    locale === 'ru'
      ? 'Программа ссылается на шаблон, которого больше нет. Уберите его или замените другой тренировкой.'
      : 'This program references a workout template that no longer exists. Remove it or replace it with another workout.',
  workoutMissingBody:
    locale === 'ru'
      ? 'Этот шаблон тренировки отсутствует в библиотеке.'
      : 'This workout template is missing from the library.',
  editWorkout: locale === 'ru' ? 'Редактировать тренировку' : 'Edit workout',
  removeFromProgram: locale === 'ru' ? 'Убрать из программы' : 'Remove from program',
  addWorkout: locale === 'ru' ? 'Добавить тренировку' : 'Add workout',
  exerciseCount: (count: number, formatted: string) =>
    locale === 'ru'
      ? `${formatted} ${pluralRu(count, ['упражнение', 'упражнения', 'упражнений'])}`
      : `${formatted} ${count === 1 ? 'exercise' : 'exercises'}`,
  openWorkout: (title: string) =>
    locale === 'ru' ? `Открыть тренировку «${title}»` : `Open ${title}`,
  workoutActions: (title: string) =>
    locale === 'ru' ? `Действия с тренировкой «${title}»` : `Actions for ${title}`,
  addWorkoutSubtitle:
    locale === 'ru'
      ? 'Выберите сохранённый шаблон или создайте новый.'
      : 'Choose an existing template or create a new one.',
  chooseExistingWorkout:
    locale === 'ru' ? 'Выбрать существующую тренировку' : 'Choose existing workout',
  chooseExistingWorkoutBody:
    locale === 'ru'
      ? 'Добавьте один или несколько сохранённых шаблонов.'
      : 'Attach one or more saved templates.',
  createNewWorkout:
    locale === 'ru' ? 'Создать новую тренировку' : 'Create new workout',
  createNewWorkoutBody:
    locale === 'ru'
      ? 'Создайте новый шаблон, не выходя из программы.'
      : 'Build a new template from inside this flow.',
  noReusableWorkouts:
    locale === 'ru' ? 'Нет доступных тренировок' : 'No reusable workouts yet',
  noReusableWorkoutsBody:
    locale === 'ru'
      ? 'Сначала создайте шаблон тренировки, затем вернитесь, чтобы добавить его.'
      : 'Create a workout template first, then come back to attach it.',
  addSelected: locale === 'ru' ? 'Добавить выбранные' : 'Add selected',
  addWorkoutCount: (count: number, formatted: string) =>
    locale === 'ru'
      ? `Добавить ${formatted} ${pluralRu(count, ['тренировку', 'тренировки', 'тренировок'])}`
      : `Add ${formatted} ${count === 1 ? 'workout' : 'workouts'}`,
  editorSubtitle:
    locale === 'ru'
      ? 'Создайте шаблон здесь, затем вернитесь к черновику программы.'
      : 'Build the template here, then return to the program draft.',
  workoutBuilder: locale === 'ru' ? 'Конструктор тренировки' : 'Workout builder',
  workoutBuilderSubtitle:
    locale === 'ru'
      ? 'Настройте упражнения, подходы, повторы, отдых, заметки и порядок.'
      : 'Create templates with targets, rest, notes, and quick reorder controls.',
  workoutTitle: locale === 'ru' ? 'Название тренировки' : 'Workout title',
  workoutTitlePlaceholder: locale === 'ru' ? 'Жимовой день' : 'Push day',
  workoutNotes: locale === 'ru' ? 'Заметки к тренировке' : 'Workout notes',
  workoutNotesPlaceholder:
    locale === 'ru'
      ? 'Необязательная цель тренировки или технические подсказки'
      : 'Optional training intent or coaching cues',
  quickAddExercise:
    locale === 'ru' ? 'Быстро добавить упражнение' : 'Quick add exercise',
  exercisePlaceholder: locale === 'ru' ? 'Жим лёжа' : 'Bench press',
  add: locale === 'ru' ? 'Добавить' : 'Add',
  startBuilding: locale === 'ru' ? 'Начните создание' : 'Start building',
  noExercisesInWorkout:
    locale === 'ru' ? 'В тренировке пока нет упражнений.' : 'No exercises in this workout yet.',
  noExercisesInWorkoutBody:
    locale === 'ru'
      ? 'Добавьте упражнения вручную, чтобы собрать новый шаблон.'
      : 'Add exercises manually to build a new template.',
  cancelEdit: locale === 'ru' ? 'Отменить редактирование' : 'Cancel edit',
  collapseBuilder:
    locale === 'ru' ? 'Свернуть конструктор тренировки' : 'Collapse workout builder',
  expandBuilder:
    locale === 'ru' ? 'Развернуть конструктор тренировки' : 'Expand workout builder',
  exercise: locale === 'ru' ? 'Упражнение' : 'Exercise',
  sets: locale === 'ru' ? 'Подходы' : 'Sets',
  reps: locale === 'ru' ? 'Повторы' : 'Reps',
  restSeconds: locale === 'ru' ? 'Отдых, сек.' : 'Rest sec',
  notes: locale === 'ru' ? 'Заметки' : 'Notes',
  exerciseNotesPlaceholder:
    locale === 'ru' ? 'Темп, техника или настройка упражнения' : 'Tempo, cues, or setup notes',
  duplicate: locale === 'ru' ? 'Дублировать' : 'Duplicate',
  delete: locale === 'ru' ? 'Удалить' : 'Delete',
  moveUp: locale === 'ru' ? 'Переместить вверх' : 'Move up',
  moveDown: locale === 'ru' ? 'Переместить вниз' : 'Move down',
  singleExerciseOnly:
    locale === 'ru' ? 'В тренировке только одно упражнение' : 'Single exercise only',
  reorderWhenNeeded:
    locale === 'ru' ? 'При необходимости измените порядок' : 'Reorder when needed',
});

export type WorkoutBuilderCopy = ReturnType<typeof getWorkoutBuilderCopy>;
