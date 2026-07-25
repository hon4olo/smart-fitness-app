import type { SupportedLocale } from '@/localization';

export type DataRecoveryCopy = {
  title: string;
  healthy: string;
  localFailure: string;
  outboxFailure: string;
  recovered: string;
  checkFailed: string;
  failedAction: string;
  unknownAction: string;
  retrySave: string;
  waiting: string;
  journalCount: string;
  recover: string;
  recovering: string;
  protectedChanges(count: number): string;
};

const COPY: Record<SupportedLocale, DataRecoveryCopy> = {
  en: {
    title: 'Local data recovery',
    healthy: 'No local save or protected queue recovery is currently required.',
    localFailure: 'A local save did not finish. The app still has the current in-memory change; retry before closing the app.',
    outboxFailure: 'The local change was saved, but its cloud-queue write did not finish. The prepared operation remains protected for retry.',
    recovered: 'Protected changes were restored to the synchronization queue.',
    checkFailed: 'Recovery status could not be checked. No protected record was deleted.',
    failedAction: 'Affected action',
    unknownAction: 'Local data change',
    retrySave: 'Retry local save',
    waiting: 'Waiting…',
    journalCount: 'Protected queue records',
    recover: 'Recover protected changes',
    recovering: 'Recovering…',
    protectedChanges: (count) => `${count} protected ${count === 1 ? 'change is' : 'changes are'} waiting to be restored to the sync queue.`,
  },
  ru: {
    title: 'Восстановление локальных данных',
    healthy: 'Сейчас не требуется повторное сохранение или восстановление защищённой очереди.',
    localFailure: 'Локальное сохранение не завершилось. Текущее изменение ещё находится в памяти приложения; повторите сохранение до закрытия приложения.',
    outboxFailure: 'Изменение сохранено локально, но запись в облачную очередь не завершилась. Подготовленная операция защищена и доступна для повтора.',
    recovered: 'Защищённые изменения возвращены в очередь синхронизации.',
    checkFailed: 'Не удалось проверить состояние восстановления. Защищённые записи не удалялись.',
    failedAction: 'Затронутое действие',
    unknownAction: 'Изменение локальных данных',
    retrySave: 'Повторить сохранение',
    waiting: 'Ожидание…',
    journalCount: 'Защищённые записи очереди',
    recover: 'Восстановить изменения',
    recovering: 'Восстановление…',
    protectedChanges: (count) => `${count} защищённых изменений ожидают возврата в очередь синхронизации.`,
  },
};

export const getDataRecoveryCopy = (locale: SupportedLocale): DataRecoveryCopy => COPY[locale];
