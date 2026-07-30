import type { SupportedLocale } from './messages';

const pluralRu = (
  count: number,
  forms: [one: string, few: string, many: string],
) => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
};

export const getWorkoutHistoryCopy = (locale: SupportedLocale) => {
  const isRussian = locale === 'ru';
  const safetyLabels = {
    ready: isRussian ? 'Готово' : 'Ready',
    modify: isRussian ? 'Нужна модификация' : 'Modify',
    blocked: isRussian ? 'Заблокировано' : 'Blocked',
    needs_input: isRussian ? 'Нужны данные' : 'Needs input',
  } as const;
  const severityLabels = {
    mild: isRussian ? 'Лёгкая' : 'Mild',
    moderate: isRussian ? 'Средняя' : 'Moderate',
    severe: isRussian ? 'Тяжёлая' : 'Severe',
    input_required: isRussian ? 'Нужны данные' : 'Input required',
    warning: isRussian ? 'Предупреждение' : 'Warning',
    modify: isRussian ? 'Модификация' : 'Modify',
    hard_block: isRussian ? 'Блокировка' : 'Hard block',
  } as const;
  const actionLabels = {
    monitor: isRussian ? 'Наблюдать' : 'Monitor',
    reduce_load: isRussian ? 'Снизить нагрузку' : 'Reduce load',
    avoid_movement: isRussian ? 'Исключить движение' : 'Avoid movement',
    pause_training: isRussian ? 'Приостановить тренировки' : 'Pause training',
  } as const;

  return {
    back: isRussian ? 'Назад' : 'Back',
    title: isRussian ? 'История тренировок' : 'Workout History',
    subtitle: isRussian
      ? 'Завершённые тренировки и сохранённый контекст безопасности.'
      : 'Completed sessions and recorded pre-workout context.',
    emptyTitle: isRussian ? 'История пуста' : 'No workout history yet',
    emptyMessage: isRussian
      ? 'Завершённые тренировки появятся здесь.'
      : 'Completed workout sessions will appear here.',
    editWorkout: isRussian ? 'Изменить тренировку' : 'Edit workout',
    editWorkoutBody: isRussian
      ? 'Измените подходы и сохраните обновлённую тренировку.'
      : 'Edit sets and save the updated workout session.',
    deleteWorkout: isRussian ? 'Удалить тренировку' : 'Delete workout',
    deleteWorkoutBody: isRussian
      ? 'Удалить эту завершённую тренировку? Это действие нельзя отменить.'
      : 'Delete this completed workout session? This cannot be undone.',
    cancel: isRussian ? 'Отмена' : 'Cancel',
    delete: isRussian ? 'Удалить' : 'Delete',
    edit: isRussian ? 'Изменить' : 'Edit',
    saveChanges: isRussian ? 'Сохранить изменения' : 'Save Changes',
    saveSet: isRussian ? 'Сохранить подход' : 'Save Set',
    addSet: isRussian ? 'Добавить подход' : 'Add Set',
    cancelEdit: isRussian ? 'Отменить изменение' : 'Cancel Edit',
    exerciseName: isRussian ? 'Упражнение' : 'Exercise name',
    exercisePlaceholder: isRussian ? 'Жим лёжа' : 'Bench press',
    weight: isRussian ? 'Вес' : 'Weight',
    reps: isRussian ? 'Повторения' : 'Reps',
    sessions: (count: number, formatted: string) =>
      isRussian
        ? `${formatted} ${pluralRu(count, ['тренировка', 'тренировки', 'тренировок'])}`
        : `${formatted} ${count === 1 ? 'session' : 'sessions'}`,
    sets: (count: number, formatted: string) =>
      isRussian
        ? `${formatted} ${pluralRu(count, ['подход', 'подхода', 'подходов'])}`
        : `${formatted} ${count === 1 ? 'set' : 'sets'}`,
    volume: (value: string, unit: string) =>
      isRussian ? `Объём ${value} ${unit}` : `${value} ${unit} volume`,
    setMeta: (weight: string, unit: string, reps: string) =>
      `${weight} ${unit} × ${reps}`,
    exerciseRequired: isRussian ? 'Введите название упражнения.' : 'Enter an exercise name.',
    validWeightReps: isRussian
      ? 'Введите корректный вес и количество повторений.'
      : 'Enter valid weight and reps.',
    addSetBeforeSaving: isRussian
      ? 'Добавьте хотя бы один подход перед сохранением.'
      : 'Add at least one set before saving.',
    today: isRussian ? 'Сегодня' : 'Today',
    yesterday: isRussian ? 'Вчера' : 'Yesterday',
    filters: isRussian ? 'Фильтры' : 'Filters',
    period: isRussian ? 'Период' : 'Period',
    program: isRussian ? 'Программа' : 'Program',
    safety: isRussian ? 'Статус безопасности' : 'Safety status',
    allTime: isRussian ? 'Всё время' : 'All time',
    last7Days: isRussian ? '7 дней' : '7 days',
    last30Days: isRussian ? '30 дней' : '30 days',
    last90Days: isRussian ? '90 дней' : '90 days',
    allPrograms: isRussian ? 'Все программы' : 'All programs',
    unassigned: isRussian ? 'Без программы' : 'Unassigned',
    allStatuses: isRussian ? 'Все статусы' : 'All statuses',
    missingOrStale: isRussian ? 'Нет или устарел' : 'Missing or stale',
    noContext: isRussian ? 'Без контекста' : 'No context',
    clearExternalRange: isRussian ? 'Сбросить внешний диапазон' : 'Clear external range',
    clear: isRussian ? 'Сбросить' : 'Clear',
    week: isRussian ? 'Неделя' : 'Week',
    deleteAll: isRussian ? 'Удалить всю историю' : 'Delete all history',
    deleteAllTitle: isRussian ? 'Удалить всю историю тренировок?' : 'Delete all workout history?',
    deleteAllBody: isRussian
      ? 'Все завершённые тренировки будут удалены с этого устройства. Действие нельзя отменить.'
      : 'All completed workout sessions will be removed from this device. This cannot be undone.',
    deleteAllAction: isRussian ? 'Удалить всё' : 'Delete all',
    noMatches: isRussian ? 'Нет подходящих тренировок' : 'No matching workouts',
    noMatchesBody: isRussian
      ? 'Измените период, программу или фильтр безопасности.'
      : 'Adjust the period, program, or safety filter.',
    clearFilters: isRussian ? 'Сбросить фильтры' : 'Clear filters',
    openSession: (title: string) =>
      isRussian ? `Открыть тренировку ${title}` : `Open ${title} workout session`,
    openSessionHint: isRussian
      ? 'Открывает подробности завершённой тренировки'
      : 'Opens the completed workout details',
    unknownDate: isRussian ? 'Неизвестная дата' : 'Unknown date',
    durationMinutes: (formatted: string) => isRussian ? `${formatted} мин` : `${formatted} min`,
    durationHours: (hours: string, minutes: string | null) =>
      isRussian
        ? minutes ? `${hours} ч ${minutes} мин` : `${hours} ч`
        : minutes ? `${hours} h ${minutes} min` : `${hours} h`,
    safetyLabel: (status: string | null) =>
      status && status in safetyLabels
        ? safetyLabels[status as keyof typeof safetyLabels]
        : isRussian ? 'Статус недоступен' : 'Status unavailable',
    safetyHistoryLabel: (gateKind: string | null, status: string | null) => {
      if (gateKind === 'review_missing') return isRussian ? 'Продолжено без анализа' : 'Continued without review';
      if (gateKind === 'review_stale') return isRussian ? 'Продолжено с устаревшим анализом' : 'Continued with stale review';
      if (status === 'blocked') return isRussian ? 'Блокировка подтверждена' : 'Hard block acknowledged';
      if (status === 'modify') return isRussian ? 'Модификации подтверждены' : 'Modifications acknowledged';
      if (status === 'needs_input') return isRussian ? 'Неполный анализ подтверждён' : 'Incomplete review acknowledged';
      if (status === 'ready') return isRussian ? 'Готово по анализу' : 'Ready review';
      return isRussian ? 'Контекст не записан' : 'No recorded review';
    },
    noReviewStatus: isRussian ? 'Статус анализа отсутствует' : 'No review status',
    reviewMissing: isRussian ? 'Анализ отсутствует' : 'Review missing',
    reviewStale: isRussian ? 'Анализ устарел' : 'Review stale',
    confirmationRequired: isRussian ? 'Требуется подтверждение' : 'Explicit confirmation required',
    readyWithoutConfirmation: isRussian ? 'Готово без подтверждения' : 'Ready without confirmation',
    reviewAtStart: isRussian ? 'Анализ при старте' : 'Review at start',
    gate: isRussian ? 'Ограничение' : 'Gate',
    load: isRussian ? 'Нагрузка' : 'Load',
    acknowledged: isRussian ? 'Подтверждено' : 'Acknowledged',
    yes: isRussian ? 'Да' : 'Yes',
    no: isRussian ? 'Нет' : 'No',
    completedWorkouts: isRussian ? 'Завершённые тренировки' : 'Completed workouts',
    showingOf: (visible: string, total: string) =>
      isRussian ? `Показано ${visible} из ${total}` : `Showing ${visible} of ${total}`,
    withSafetyContext: isRussian ? 'С контекстом безопасности' : 'With Safety context',
    historicalContextNote: isRussian
      ? 'Данные Safety & Recovery здесь — историческая запись перед тренировкой, а не текущая рекомендация готовности.'
      : 'Safety & Recovery data here is a historical record of what was displayed before each workout. It is not a current readiness recommendation.',
    selectedWeeklyRange: (range: string) =>
      isRussian ? `Выбранная неделя · ${range}` : `Selected weekly range · ${range}`,
    filterHint: isRussian
      ? 'Период, программа и сохранённый статус безопасности'
      : 'Period, program and recorded Safety status',
    noCompletedTitle: isRussian ? 'Завершённых тренировок пока нет' : 'No completed workouts yet',
    noCompletedBody: isRussian
      ? 'Завершите и сохраните тренировку, чтобы создать первую запись.'
      : 'Finish and save a workout to create the first history entry.',
    duration: isRussian ? 'Длительность' : 'Duration',
    exercises: isRussian ? 'Упражнения' : 'Exercises',
    volumeLabel: isRussian ? 'Объём' : 'Volume',
    viewDetails: isRussian ? 'Открыть подробности' : 'View workout details',
    detailsTitle: isRussian ? 'Подробности тренировки' : 'Workout details',
    detailsSubtitle: isRussian ? 'Запись завершённой тренировки' : 'Completed session record',
    notFoundTitle: isRussian ? 'Тренировка не найдена' : 'Workout not found',
    notFoundBody: isRussian
      ? 'Эта завершённая тренировка больше недоступна на текущем устройстве.'
      : 'This completed workout is no longer available on the current device.',
    completedWorkoutEyebrow: isRussian ? 'ЗАВЕРШЁННАЯ ТРЕНИРОВКА' : 'COMPLETED WORKOUT',
    workoutNotes: isRussian ? 'Заметки тренировки' : 'Workout notes',
    loggedExercises: isRussian ? 'Записанные упражнения' : 'Logged exercises',
    total: (formatted: string) => isRussian ? `Всего ${formatted}` : `${formatted} total`,
    tableSet: isRussian ? 'ПОДХОД' : 'SET',
    tableReps: isRussian ? 'ПОВТ.' : 'REPS',
    safetyContext: isRussian ? 'Контекст Safety & Recovery' : 'Safety & Recovery context',
    noSafetyContext: isRussian
      ? 'Для этой тренировки не был сохранён предтренировочный контекст Safety & Recovery.'
      : 'No pre-workout Safety & Recovery context was recorded for this historical session.',
    currentReadinessDisclaimer: isRussian
      ? 'Это не описывает текущую готовность пользователя.'
      : "This does not describe the user's current readiness state.",
    immutableContext: isRussian
      ? 'Неизменяемая запись, сохранённая перед началом тренировки.'
      : 'Immutable record captured before this workout started.',
    reviewedLoadCeiling: isRussian ? 'Предел нагрузки' : 'Reviewed load ceiling',
    restrictionsShown: isRussian ? 'Показано ограничений' : 'Restrictions shown',
    gateState: isRussian ? 'Состояние ограничения' : 'Gate state',
    acknowledgement: isRussian ? 'Подтверждение' : 'Acknowledgement',
    explicitlyConfirmed: isRussian ? 'Явно подтверждено' : 'Explicitly confirmed',
    notConfirmed: isRussian ? 'Не подтверждено' : 'Not confirmed',
    notRequired: isRussian ? 'Не требуется' : 'Not required',
    capturedAt: isRussian ? 'Сохранено' : 'Captured at',
    reviewRun: isRussian ? 'Запуск анализа' : 'Review run',
    noReviewRun: isRussian ? 'Нет запуска анализа' : 'No review run',
    notRecorded: isRussian ? 'Не записано' : 'Not recorded',
    restrictionsBefore: isRussian
      ? 'Ограничения перед тренировкой'
      : 'Restrictions shown before the workout',
    maximumLoad: isRussian ? 'максимальная нагрузка' : 'max load',
    affectedLoad: (percent: string) =>
      isRussian ? `затронутая нагрузка до ${percent}%` : `affected load up to ${percent}%`,
    movements: isRussian ? 'Движения' : 'Movements',
    findingsBefore: isRussian
      ? 'Результаты перед тренировкой'
      : 'Findings shown before the workout',
    findingTitle: isRussian ? 'Результат проверки' : 'Review finding',
    findingFallback: isRussian
      ? 'Типизированный результат сохранён для аудита тренировки.'
      : 'A typed finding was saved for the workout audit trail.',
    severityLabel: (value: string) =>
      value in severityLabels
        ? severityLabels[value as keyof typeof severityLabels]
        : isRussian ? 'Не указано' : 'Not specified',
    actionLabel: (value: string) =>
      value in actionLabels
        ? actionLabels[value as keyof typeof actionLabels]
        : isRussian ? 'Не указано' : 'Not specified',
    unknownValue: isRussian ? 'Не указано' : 'Not specified',
    historicalDisclaimer: isRussian
      ? 'Это исторические данные продукта, а не текущая медицинская оценка, диагноз или рекомендация по тренировке.'
      : 'This is historical product metadata. It is not a current medical assessment, diagnosis, or training recommendation.',
    exerciseBreakdown: isRussian ? 'Разбивка по упражнениям' : 'Exercise breakdown',
    completedSets: (formatted: string) => isRussian ? `${formatted} завершено` : `${formatted} completed`,
    target: isRussian ? 'цель' : 'target',
    setNumber: (number: string) => isRussian ? `Подход ${number}` : `Set ${number}`,
    complete: isRussian ? 'Выполнен' : 'Complete',
    incomplete: isRussian ? 'Не выполнен' : 'Incomplete',
    noSets: isRussian ? 'Подходы не записаны.' : 'No sets recorded.',
    notes: isRussian ? 'Заметки' : 'Notes',
  };
};
