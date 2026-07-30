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

  return {
    back: isRussian ? 'Назад' : 'Back',
    title: isRussian ? 'История тренировок' : 'Workout History',
    subtitle: isRussian
      ? 'Просматривайте, изменяйте и удаляйте завершённые тренировки.'
      : 'Review, edit, and delete completed workout sessions.',
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
    safety: isRussian ? 'Безопасность' : 'Safety',
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
    workoutSummary: isRussian ? 'Сводка тренировки' : 'Workout summary',
    duration: isRussian ? 'Длительность' : 'Duration',
    exercises: isRussian ? 'Упражнения' : 'Exercises',
    safetyContext: isRussian ? 'Контекст безопасности' : 'Safety context',
    noSafetyContext: isRussian ? 'Контекст безопасности не сохранён' : 'No safety context saved',
    noSafetyContextBody: isRussian
      ? 'Эта тренировка была сохранена до появления снимков Safety & Recovery или продолжена без снимка.'
      : 'This session was saved before Safety & Recovery snapshots were available or continued without one.',
    savedSafetyBody: isRussian
      ? 'Этот снимок сохраняется вместе с завершённой тренировкой и не заменяет медицинскую оценку.'
      : 'This snapshot is stored with the completed workout and does not replace medical evaluation.',
    restrictions: isRussian ? 'Сохранённые ограничения' : 'Saved restrictions',
    maximumLoad: isRussian ? 'максимальная нагрузка' : 'max load',
    movements: isRussian ? 'движения' : 'movements',
    findings: isRussian ? 'Сохранённые результаты' : 'Saved findings',
    findingFallback: isRussian
      ? 'Типизированный результат сохранён для аудита тренировки.'
      : 'A typed finding was saved for the workout audit trail.',
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
