import type {
  UserLimitationBodyRegion,
  UserLimitationKind,
  UserLimitationMovementPattern,
  UserLimitationSeverity,
  UserLimitationSide,
  UserLimitationTrainingImpact,
} from '@/types';

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

export const getUserLimitationsCopy = (locale: SupportedLocale) => {
  const kindLabels: Record<UserLimitationKind, string> = {
    injury: locale === 'ru' ? 'Травма' : 'Injury',
    pain: locale === 'ru' ? 'Боль' : 'Pain',
    mobility: locale === 'ru' ? 'Ограничение подвижности' : 'Mobility',
    medical_restriction: locale === 'ru' ? 'Медицинское ограничение' : 'Medical restriction',
    other: locale === 'ru' ? 'Другое' : 'Other',
  };
  const bodyRegionLabels: Record<UserLimitationBodyRegion, string> = {
    neck: locale === 'ru' ? 'Шея' : 'Neck',
    shoulder: locale === 'ru' ? 'Плечо' : 'Shoulder',
    elbow: locale === 'ru' ? 'Локоть' : 'Elbow',
    wrist_hand: locale === 'ru' ? 'Запястье / кисть' : 'Wrist / hand',
    upper_back: locale === 'ru' ? 'Верх спины' : 'Upper back',
    lower_back: locale === 'ru' ? 'Поясница' : 'Lower back',
    hip: locale === 'ru' ? 'Тазобедренная область' : 'Hip',
    knee: locale === 'ru' ? 'Колено' : 'Knee',
    ankle_foot: locale === 'ru' ? 'Голеностоп / стопа' : 'Ankle / foot',
    chest: locale === 'ru' ? 'Грудь' : 'Chest',
    abdomen: locale === 'ru' ? 'Живот' : 'Abdomen',
    systemic: locale === 'ru' ? 'Системное' : 'Systemic',
    other: locale === 'ru' ? 'Другое' : 'Other',
  };
  const sideLabels: Record<UserLimitationSide, string> = {
    left: locale === 'ru' ? 'Слева' : 'Left',
    right: locale === 'ru' ? 'Справа' : 'Right',
    bilateral: locale === 'ru' ? 'С обеих сторон' : 'Both',
    midline: locale === 'ru' ? 'По центру' : 'Midline',
    not_applicable: locale === 'ru' ? 'Не применимо' : 'N/A',
  };
  const severityLabels: Record<UserLimitationSeverity, string> = {
    mild: locale === 'ru' ? 'Лёгкая' : 'Mild',
    moderate: locale === 'ru' ? 'Умеренная' : 'Moderate',
    severe: locale === 'ru' ? 'Тяжёлая' : 'Severe',
  };
  const impactLabels: Record<UserLimitationTrainingImpact, string> = {
    monitor: locale === 'ru' ? 'Наблюдать' : 'Monitor',
    reduce_load: locale === 'ru' ? 'Снизить нагрузку' : 'Reduce load',
    avoid_movement: locale === 'ru' ? 'Избегать движения' : 'Avoid movement',
    pause_training: locale === 'ru' ? 'Приостановить тренировки' : 'Pause training',
  };
  const movementLabels: Record<UserLimitationMovementPattern, string> = {
    squat: locale === 'ru' ? 'Приседание' : 'Squat',
    hinge: locale === 'ru' ? 'Тазовый наклон' : 'Hinge',
    lunge: locale === 'ru' ? 'Выпад' : 'Lunge',
    horizontal_push: locale === 'ru' ? 'Горизонтальный жим' : 'Horizontal push',
    vertical_push: locale === 'ru' ? 'Вертикальный жим' : 'Vertical push',
    horizontal_pull: locale === 'ru' ? 'Горизонтальная тяга' : 'Horizontal pull',
    vertical_pull: locale === 'ru' ? 'Вертикальная тяга' : 'Vertical pull',
    carry: locale === 'ru' ? 'Перенос веса' : 'Carry',
    rotation: locale === 'ru' ? 'Вращение' : 'Rotation',
    locomotion: locale === 'ru' ? 'Перемещение' : 'Locomotion',
    impact: locale === 'ru' ? 'Ударная нагрузка' : 'Impact',
    overhead: locale === 'ru' ? 'Движение над головой' : 'Overhead',
    spinal_flexion: locale === 'ru' ? 'Сгибание позвоночника' : 'Spinal flexion',
    spinal_extension: locale === 'ru' ? 'Разгибание позвоночника' : 'Spinal extension',
    other: locale === 'ru' ? 'Другое' : 'Other',
  };

  return {
    kindLabels,
    bodyRegionLabels,
    sideLabels,
    severityLabels,
    impactLabels,
    movementLabels,
    back: locale === 'ru' ? 'Назад' : 'Back',
    title: locale === 'ru' ? 'Ограничения тренировок' : 'Training limitations',
    subtitle:
      locale === 'ru' ? 'Явно указанные пользователем ограничения' : 'Explicit self-reported restrictions',
    currentRecords: locale === 'ru' ? 'Текущие записи' : 'Current records',
    recordCounts: (active: number, activeFormatted: string, total: number, totalFormatted: string) =>
      locale === 'ru'
        ? `Активных: ${activeFormatted} · всего: ${totalFormatted}`
        : `Active: ${activeFormatted} · total: ${totalFormatted}`,
    syncStatus: (status: string, pending: string) =>
      locale === 'ru'
        ? `Синхронизация: ${status} · ожидающих операций: ${pending}`
        : `Sync: ${status} · pending operations: ${pending}`,
    syncLabels: {
      idle: locale === 'ru' ? 'готово' : 'idle',
      syncing: locale === 'ru' ? 'выполняется' : 'syncing',
      success: locale === 'ru' ? 'завершена' : 'success',
      error: locale === 'ru' ? 'ошибка' : 'error',
      offline: locale === 'ru' ? 'нет подключения' : 'offline',
    } as Record<string, string>,
    syncIssue:
      locale === 'ru'
        ? 'Синхронизация временно недоступна. Локальные данные сохранены.'
        : 'Sync is temporarily unavailable. Local data is preserved.',
    noLimitations:
      locale === 'ru' ? 'Ограничения пока не добавлены.' : 'No limitations have been added.',
    addLimitation: locale === 'ru' ? 'Добавить ограничение' : 'Add limitation',
    addExplanation:
      locale === 'ru'
        ? 'Указывайте только то, что вам точно известно. Приложение не определяет диагноз и не выбирает влияние на тренировку за вас.'
        : 'Record only what you explicitly know. The app does not infer a diagnosis or select an impact for you.',
    type: locale === 'ru' ? 'Тип' : 'Type',
    bodyRegion: locale === 'ru' ? 'Область тела' : 'Body region',
    affectedSide: locale === 'ru' ? 'Затронутая сторона' : 'Affected side',
    severity: locale === 'ru' ? 'Тяжесть' : 'Severity',
    trainingImpact: locale === 'ru' ? 'Влияние на тренировку' : 'Training impact',
    movementPatterns: locale === 'ru' ? 'Движения' : 'Movement patterns',
    movementHelper:
      locale === 'ru'
        ? 'Обязательно при выборе «Избегать движения». В остальных случаях — необязательный контекст.'
        : 'Required for “Avoid movement”. Optional context for other impacts.',
    onsetDate: locale === 'ru' ? 'Дата начала' : 'Onset date',
    onsetHelper:
      locale === 'ru'
        ? 'Необязательно · ГГГГ-ММ-ДД · дата не может быть в будущем'
        : 'Optional · YYYY-MM-DD · no future dates',
    onsetAccessibility:
      locale === 'ru' ? 'Дата начала ограничения' : 'Limitation onset date',
    save: locale === 'ru' ? 'Сохранить ограничение' : 'Save limitation',
    openReview:
      locale === 'ru' ? 'Открыть анализ безопасности и восстановления' : 'Open Safety & Recovery review',
    openReviewHint:
      locale === 'ru'
        ? 'Открывает детерминированный анализ готовности и восстановления'
        : 'Opens the deterministic Safety and Recovery readiness review',
    boundary: locale === 'ru' ? 'Ограничения использования' : 'Boundary',
    boundaryBody:
      locale === 'ru'
        ? 'Этот список заполняется пользователем и не является медицинской рекомендацией. Здесь не собираются медицинские заметки в свободной форме. Coach получает только типизированные поля ограничения и не может автоматически применить изменение к тренировке.'
        : 'This list is self-reported and is not medical advice. Free-text medical notes are not collected here. The Coach context receives only the typed restriction fields and cannot apply a workout change automatically.',
    statusLabels: {
      active: locale === 'ru' ? 'Активно' : 'Active',
      resolved: locale === 'ru' ? 'Решено' : 'Resolved',
    },
    movements: locale === 'ru' ? 'Движения' : 'Movements',
    onset: locale === 'ru' ? 'Начало' : 'Onset',
    notSpecified: locale === 'ru' ? 'не указано' : 'not specified',
    resolved: locale === 'ru' ? 'решено' : 'resolved',
    markResolved: locale === 'ru' ? 'Отметить решённым' : 'Mark resolved',
    reactivate: locale === 'ru' ? 'Активировать снова' : 'Reactivate',
    delete: locale === 'ru' ? 'Удалить' : 'Delete',
    savedAndSynced:
      locale === 'ru'
        ? 'Изменение ограничения сохранено и синхронизировано.'
        : 'Limitation change saved and synchronized.',
    savedLocallyRetry:
      locale === 'ru'
        ? 'Изменение сохранено локально. Синхронизация повторится при восстановлении подключения.'
        : 'Limitation change saved locally. Sync will retry when available.',
    savedLocally:
      locale === 'ru' ? 'Ограничение сохранено локально.' : 'Limitation saved locally.',
    statusUpdated:
      locale === 'ru' ? 'Статус ограничения обновлён локально.' : 'Limitation status updated locally.',
    deletedLocally:
      locale === 'ru' ? 'Ограничение удалено локально.' : 'Limitation deleted locally.',
    localValidationFailed:
      locale === 'ru'
        ? 'Ограничение не прошло локальную валидацию.'
        : 'The limitation did not pass local validation.',
    validation: {
      timestamp:
        locale === 'ru' ? 'Время ограничения некорректно.' : 'The limitation timestamp is invalid.',
      onsetDate:
        locale === 'ru'
          ? 'Дата начала должна быть корректной текущей или прошедшей датой в формате ГГГГ-ММ-ДД.'
          : 'Onset date must be a valid past or current YYYY-MM-DD date.',
      type: locale === 'ru' ? 'Выберите тип ограничения.' : 'Select a limitation type.',
      bodyRegion: locale === 'ru' ? 'Выберите область тела.' : 'Select a body region.',
      side: locale === 'ru' ? 'Выберите затронутую сторону.' : 'Select the affected side.',
      severity: locale === 'ru' ? 'Выберите тяжесть.' : 'Select a severity.',
      impact:
        locale === 'ru' ? 'Выберите влияние на тренировку.' : 'Select the training impact.',
      movement:
        locale === 'ru'
          ? 'Выберите минимум одно движение, которого следует избегать.'
          : 'Select at least one movement pattern to avoid.',
      resolvedBeforeOnset:
        locale === 'ru'
          ? 'Дата решения не может быть раньше даты начала.'
          : 'Resolved date cannot be before the onset date.',
    },
    activeSummary: (count: number, formatted: string) =>
      locale === 'ru'
        ? `${formatted} ${pluralRu(count, ['активное ограничение', 'активных ограничения', 'активных ограничений'])}`
        : `${formatted} active limitation${count === 1 ? '' : 's'}`,
  };
};

export type UserLimitationsCopy = ReturnType<typeof getUserLimitationsCopy>;
