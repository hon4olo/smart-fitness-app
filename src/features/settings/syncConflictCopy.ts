import type { SupportedLocale } from '@/localization';

export type SyncConflictCopy = {
  title: string;
  healthy: string;
  loading: string;
  loadFailed: string;
  explanation: string;
  detected: string;
  source: string;
  retry: string;
  retrying: string;
  retryExplanation: string;
  unknownEntity: string;
  sourceLabels: Record<'client' | 'push' | 'pull', string>;
  entityLabels: Record<string, string>;
};

const COPY: Record<SupportedLocale, SyncConflictCopy> = {
  en: {
    title: 'Conflicts requiring review',
    healthy: 'No unresolved synchronization conflicts are stored for this account.',
    loading: 'Checking saved conflicts…',
    loadFailed: 'Saved conflict details could not be loaded. Your local data was not removed.',
    explanation: 'These changes could not be merged automatically. The app keeps the conflict record and retries the existing deterministic resolver during synchronization.',
    detected: 'Detected',
    source: 'Detected during',
    retry: 'Retry conflict resolution',
    retrying: 'Resolving…',
    retryExplanation: 'Retrying does not delete local data or discard the server version.',
    unknownEntity: 'Account data',
    sourceLabels: { client: 'local resolution', push: 'upload', pull: 'download' },
    entityLabels: {
      weightHistory: 'Weight history',
      bodyMeasurements: 'Body measurements',
      customExercises: 'Custom exercises',
      workoutSessions: 'Workout history',
      workouts: 'Workout templates',
      trainingPrograms: 'Training programs',
      foodEntries: 'Food diary',
      mealTemplates: 'Saved meals',
      nutritionTargets: 'Nutrition targets',
      fitnessProfiles: 'Fitness profile',
      userLimitations: 'User limitations',
      recoveryCheckIns: 'Recovery check-ins',
    },
  },
  ru: {
    title: 'Конфликты, требующие проверки',
    healthy: 'Для этого аккаунта нет сохранённых неразрешённых конфликтов.',
    loading: 'Проверяем сохранённые конфликты…',
    loadFailed: 'Не удалось загрузить сведения о конфликтах. Локальные данные не удалены.',
    explanation: 'Эти изменения не удалось объединить автоматически. Приложение сохраняет запись конфликта и повторяет существующий детерминированный resolver при синхронизации.',
    detected: 'Обнаружено',
    source: 'Этап обнаружения',
    retry: 'Повторить разрешение конфликтов',
    retrying: 'Разрешение…',
    retryExplanation: 'Повторная попытка не удаляет локальные данные и не отбрасывает серверную версию.',
    unknownEntity: 'Данные аккаунта',
    sourceLabels: { client: 'локальное разрешение', push: 'отправка', pull: 'загрузка' },
    entityLabels: {
      weightHistory: 'История веса',
      bodyMeasurements: 'Замеры тела',
      customExercises: 'Пользовательские упражнения',
      workoutSessions: 'История тренировок',
      workouts: 'Шаблоны тренировок',
      trainingPrograms: 'Тренировочные программы',
      foodEntries: 'Дневник питания',
      mealTemplates: 'Сохранённые приёмы пищи',
      nutritionTargets: 'Цели питания',
      fitnessProfiles: 'Фитнес-профиль',
      userLimitations: 'Ограничения пользователя',
      recoveryCheckIns: 'Отметки восстановления',
    },
  },
};

export const getSyncConflictCopy = (locale: SupportedLocale): SyncConflictCopy => COPY[locale];

export const getSyncConflictEntityLabel = (
  copy: SyncConflictCopy,
  entityType: string,
): string => copy.entityLabels[entityType] ?? copy.unknownEntity;
