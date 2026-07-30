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

export const getWorkoutHistoryCopy = (locale: SupportedLocale) => ({
  back: locale === 'ru' ? 'Назад' : 'Back',
  title: locale === 'ru' ? 'История тренировок' : 'Workout History',
  subtitle:
    locale === 'ru'
      ? 'Просматривайте, изменяйте и удаляйте завершённые тренировки.'
      : 'Review, edit, and delete completed workout sessions.',
  emptyTitle: locale === 'ru' ? 'История пуста' : 'No workout history yet',
  emptyMessage:
    locale === 'ru'
      ? 'Завершённые тренировки появятся здесь.'
      : 'Completed workout sessions will appear here.',
  editWorkout: locale === 'ru' ? 'Изменить тренировку' : 'Edit workout',
  editWorkoutBody:
    locale === 'ru'
      ? 'Измените подходы и сохраните обновлённую тренировку.'
      : 'Edit sets and save the updated workout session.',
  deleteWorkout: locale === 'ru' ? 'Удалить тренировку' : 'Delete workout',
  deleteWorkoutBody:
    locale === 'ru'
      ? 'Удалить эту завершённую тренировку? Это действие нельзя отменить.'
      : 'Delete this completed workout session? This cannot be undone.',
  cancel: locale === 'ru' ? 'Отмена' : 'Cancel',
  delete: locale === 'ru' ? 'Удалить' : 'Delete',
  edit: locale === 'ru' ? 'Изменить' : 'Edit',
  saveChanges: locale === 'ru' ? 'Сохранить изменения' : 'Save Changes',
  saveSet: locale === 'ru' ? 'Сохранить подход' : 'Save Set',
  addSet: locale === 'ru' ? 'Добавить подход' : 'Add Set',
  cancelEdit: locale === 'ru' ? 'Отменить изменение' : 'Cancel Edit',
  exerciseName: locale === 'ru' ? 'Упражнение' : 'Exercise name',
  exercisePlaceholder: locale === 'ru' ? 'Жим лёжа' : 'Bench press',
  weight: locale === 'ru' ? 'Вес' : 'Weight',
  reps: locale === 'ru' ? 'Повторения' : 'Reps',
  sets: (count: number, formatted: string) =>
    locale === 'ru'
      ? `${formatted} ${pluralRu(count, ['подход', 'подхода', 'подходов'])}`
      : `${formatted} ${count === 1 ? 'set' : 'sets'}`,
  volume: (value: string, unit: string) =>
    locale === 'ru' ? `Объём ${value} ${unit}` : `${value} ${unit} volume`,
  setMeta: (weight: string, unit: string, reps: string) =>
    locale === 'ru'
      ? `${weight} ${unit} × ${reps}`
      : `${weight} ${unit} × ${reps}`,
  exerciseRequired:
    locale === 'ru' ? 'Введите название упражнения.' : 'Enter an exercise name.',
  validWeightReps:
    locale === 'ru'
      ? 'Введите корректный вес и количество повторений.'
      : 'Enter valid weight and reps.',
  addSetBeforeSaving:
    locale === 'ru'
      ? 'Добавьте хотя бы один подход перед сохранением.'
      : 'Add at least one set before saving.',
  today: locale === 'ru' ? 'Сегодня' : 'Today',
  yesterday: locale === 'ru' ? 'Вчера' : 'Yesterday',
});
