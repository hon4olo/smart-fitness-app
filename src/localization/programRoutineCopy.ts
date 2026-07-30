import type { SupportedLocale } from './messages';

const pluralRu = (count: number, forms: [string, string, string]) => {
  const mod10 = Math.abs(count) % 10;
  const mod100 = Math.abs(count) % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
};

export const getProgramRoutineCopy = (locale: SupportedLocale) => ({
  loadingProgram: locale === 'ru' ? 'Загрузка программы…' : 'Loading program…',
  programNotFound: locale === 'ru' ? 'Программа не найдена' : 'Program not found',
  backToWorkouts: locale === 'ru' ? 'Назад к тренировкам' : 'Back to Workouts',
  back: locale === 'ru' ? 'Назад' : 'Back',
  moreOptions: locale === 'ru' ? 'Другие действия' : 'More actions',
  viewMore: locale === 'ru' ? 'Подробнее' : 'View more',
  cancel: locale === 'ru' ? 'Отмена' : 'Cancel',
  addFavorite: locale === 'ru' ? 'Добавить в избранное' : 'Add to favorites',
  removeFavorite: locale === 'ru' ? 'Убрать из избранного' : 'Remove from favorites',
  deleteProgram: locale === 'ru' ? 'Удалить программу' : 'Delete program',
  deleteProgramTitle: locale === 'ru' ? 'Удалить программу?' : 'Delete program?',
  deleteProgramBody:
    locale === 'ru'
      ? 'Будет удалена только программа. История тренировок останется сохранена.'
      : 'This removes the program only. Workout history stays saved.',
  delete: locale === 'ru' ? 'Удалить' : 'Delete',
  addRoutine: locale === 'ru' ? 'Добавить тренировку в программу' : 'Add routine to program',
  addRoutineHint:
    locale === 'ru'
      ? 'Открывает создание новой тренировки для этой программы'
      : 'Opens a new routine builder for this program',
  workoutUnavailable: locale === 'ru' ? 'Тренировка недоступна' : 'Workout unavailable',
  workoutUnavailableBody:
    locale === 'ru'
      ? 'Эта запись ссылается на шаблон тренировки, которого больше нет.'
      : 'This routine points to a workout template that no longer exists.',
  removeFromProgram: locale === 'ru' ? 'Убрать из программы' : 'Remove from program',
  workoutSaved: locale === 'ru' ? 'Тренировка сохранена' : 'Workout saved',
  exerciseCount: (count: number, formatted: string) =>
    locale === 'ru'
      ? `${formatted} ${pluralRu(count, ['упражнение', 'упражнения', 'упражнений'])}`
      : `${formatted} ${count === 1 ? 'exercise' : 'exercises'}`,
  openWorkout: (title: string) =>
    locale === 'ru' ? `Открыть тренировку «${title}»` : `Open ${title}`,
  removeWorkout: (title: string) =>
    locale === 'ru' ? `Убрать тренировку «${title}» из программы` : `Remove ${title} from program`,
  defaultRoutineTitle: (formatted: string) =>
    locale === 'ru' ? `Моя тренировка №${formatted}` : `My routine #${formatted}`,
  newRoutine: locale === 'ru' ? 'Новая тренировка' : 'New Routine',
  save: locale === 'ru' ? 'Сохранить' : 'Save',
  routineName: locale === 'ru' ? 'Название тренировки' : 'Routine name',
  routineNotes: locale === 'ru' ? 'Заметки' : 'Notes',
  exerciseNotes: locale === 'ru' ? 'Заметки к упражнению' : 'Exercise notes',
  noExercises: locale === 'ru' ? 'Упражнения не добавлены' : 'No exercises added',
  noExercisesBody:
    locale === 'ru'
      ? 'Нажмите кнопку ниже, чтобы добавить упражнения в тренировку.'
      : 'Use the button below to add exercises to this routine.',
  exerciseFallback: locale === 'ru' ? 'Упражнение' : 'Exercise',
  set: locale === 'ru' ? 'Подход' : 'Set',
  previous: locale === 'ru' ? 'Предыдущий' : 'Previous',
  repsHeader: locale === 'ru' ? 'Повторы' : 'Reps',
  reps: (count: number, formatted: string) =>
    locale === 'ru'
      ? `${formatted} ${pluralRu(count, ['повторение', 'повторения', 'повторений'])}`
      : `${formatted} ${count === 1 ? 'rep' : 'reps'}`,
  emptySetLine: (index: string, weightUnit: string) =>
    `${index}   - ${weightUnit}  ·  - ${locale === 'ru' ? 'повт.' : 'reps'}`,
  restTimerOff: locale === 'ru' ? '⏱ Таймер отдыха: выкл.' : '⏱ Rest timer: off',
  addSet: locale === 'ru' ? '+ Добавить подход' : '+ Add set',
  addExercises: locale === 'ru' ? 'Добавить упражнения' : 'Add exercises',
  replaceExercise: locale === 'ru' ? 'Заменить упражнение' : 'Replace exercise',
  done: locale === 'ru' ? 'Готово' : 'Done',
  exerciseOptions: (title: string) =>
    locale === 'ru' ? `Действия с упражнением «${title}»` : `Actions for ${title}`,
  deleteExercise: locale === 'ru' ? 'Удалить упражнение' : 'Delete exercise',
  deleteExerciseTitle: locale === 'ru' ? 'Удалить упражнение?' : 'Delete exercise?',
  deleteExerciseBody:
    locale === 'ru'
      ? 'Упражнение будет удалено только из этой тренировки.'
      : 'This removes the exercise from this routine only.',
  expandExercise: (title: string) =>
    locale === 'ru' ? `Развернуть настройки «${title}»` : `Expand ${title} settings`,
  collapseExercise: (title: string) =>
    locale === 'ru' ? `Свернуть настройки «${title}»` : `Collapse ${title} settings`,
  addSetForExercise: (title: string) =>
    locale === 'ru' ? `Добавить подход для «${title}»` : `Add a set for ${title}`,
});

export type ProgramRoutineCopy = ReturnType<typeof getProgramRoutineCopy>;
