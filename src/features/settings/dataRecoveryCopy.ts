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
  retrySync: string;
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
    localFailure:
      'The change is still open in the app, but local storage did not finish. Retry before closing the app.',
    outboxFailure:
      'Your change is saved on this device. Cloud synchronization is pending and can be retried safely.',
    recovered: 'Protected changes were restored to the synchronization queue.',
    checkFailed: 'Recovery status could not be checked. No protected record was deleted.',
    failedAction: 'Affected action',
    unknownAction: 'Local data change',
    retrySave: 'Retry save',
    retrySync: 'Retry sync',
    waiting: 'Waiting…',
    journalCount: 'Protected queue records',
    recover: 'Recover protected changes',
    recovering: 'Recovering…',
    protectedChanges: (count) =>
      `${count} protected ${count === 1 ? 'change is' : 'changes are'} waiting to be restored to the sync queue.`,
  },
  ru: {
    title: 'Восстановление локальных данных',
    healthy: 'Сейчас не требуется повторное сохранение или восстановление защищённой очереди.',
    localFailure:
      'Изменение остаётся открытым в приложении, но локальное сохранение не завершилось. Повторите его до закрытия приложения.',
    outboxFailure:
      'Изменение сохранено на этом устройстве. Синхронизация с облаком ожидает повтора и не блокирует работу.',
    recovered: 'Защищённые изменения возвращены в очередь синхронизации.',
    checkFailed: 'Не удалось проверить состояние восстановления. Защищённые записи не удалялись.',
    failedAction: 'Затронутое действие',
    unknownAction: 'Изменение локальных данных',
    retrySave: 'Повторить сохранение',
    retrySync: 'Повторить синхронизацию',
    waiting: 'Ожидание…',
    journalCount: 'Защищённые записи очереди',
    recover: 'Восстановить изменения',
    recovering: 'Восстановление…',
    protectedChanges: (count) =>
      `${count} защищённых изменений ожидают возврата в очередь синхронизации.`,
  },
};

export const getDataRecoveryCopy = (locale: SupportedLocale): DataRecoveryCopy => COPY[locale];
