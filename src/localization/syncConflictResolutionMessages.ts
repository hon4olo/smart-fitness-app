import type { SupportedLocale } from './messages';

export type SyncConflictResolutionUiCopy = {
  accountVersion: string;
  cancel: string;
  choiceAccepted: string;
  choiceRetryable: string;
  choiceStale: string;
  choiceSubmitting: string;
  confirm: string;
  confirmAccountBody: string;
  confirmAccountTitle: string;
  confirmDeviceBody: string;
  confirmDeviceTitle: string;
  deletedData: string;
  finishSynchronization: string;
  otherConflicts: string;
  outcomeAuthenticationRequired: string;
  outcomeInProgress: string;
  outcomeRejected: string;
  outcomeResolved: string;
  outcomeRetryable: string;
  outcomeWaiting: string;
  retrySelectedChoice: string;
  retrySync: string;
  retrying: string;
  savedData: string;
  selectedAccount: string;
  selectedDevice: string;
  selectionExplanation: string;
  thisDevice: string;
  useAccountVersion: string;
  useDeviceVersion: string;
};

const en: SyncConflictResolutionUiCopy = {
  accountVersion: 'Account version',
  cancel: 'Cancel',
  choiceAccepted: 'The choice was accepted. Synchronization must finish before this conflict is removed.',
  choiceRetryable: 'The choice is saved and can be retried with the same protected request.',
  choiceStale: 'The conflict changed or was already resolved. Synchronize to load the account state.',
  choiceSubmitting: 'Submitting the selected choice…',
  confirm: 'Confirm choice',
  confirmAccountBody:
    'The account version will replace this device version for this conflict after synchronization. Unrelated data is not changed.',
  confirmAccountTitle: 'Use the account version?',
  confirmDeviceBody:
    'This device version will replace the account version for this conflict after synchronization. Unrelated data is not changed.',
  confirmDeviceTitle: 'Use this device version?',
  deletedData: 'Deletion',
  finishSynchronization: 'Finish synchronization',
  otherConflicts:
    'Other conflicts cannot be chosen manually. Retry synchronization without deleting either version.',
  outcomeAuthenticationRequired: 'Sign in again before resolving this conflict.',
  outcomeInProgress: 'This choice is already being submitted.',
  outcomeRejected: 'This conflict can no longer accept that choice. Synchronize to refresh its state.',
  outcomeResolved: 'The selected version was applied and synchronized.',
  outcomeRetryable: 'The choice is saved. Retry when the connection is available.',
  outcomeWaiting: 'The choice was accepted. Waiting for authoritative synchronization to finish.',
  retrySelectedChoice: 'Retry selected choice',
  retrySync: 'Retry synchronization',
  retrying: 'Resolving…',
  savedData: 'Saved data',
  selectedAccount: 'Selected version: account',
  selectedDevice: 'Selected version: this device',
  selectionExplanation:
    'Choose which version should remain. The other version is replaced only after explicit confirmation and authoritative synchronization.',
  thisDevice: 'This device',
  useAccountVersion: 'Use account version',
  useDeviceVersion: 'Use this device version',
};

const ru: SyncConflictResolutionUiCopy = {
  accountVersion: 'Версия в аккаунте',
  cancel: 'Отмена',
  choiceAccepted: 'Выбор принят. Конфликт будет удалён только после завершения синхронизации.',
  choiceRetryable: 'Выбор сохранён, его можно безопасно повторить с тем же защищённым запросом.',
  choiceStale: 'Конфликт изменился или уже разрешён. Синхронизируйте данные аккаунта.',
  choiceSubmitting: 'Отправляем выбранную версию…',
  confirm: 'Подтвердить выбор',
  confirmAccountBody:
    'После синхронизации версия из аккаунта заменит версию на этом устройстве только для этого конфликта. Остальные данные не изменятся.',
  confirmAccountTitle: 'Использовать версию из аккаунта?',
  confirmDeviceBody:
    'После синхронизации версия с этого устройства заменит версию в аккаунте только для этого конфликта. Остальные данные не изменятся.',
  confirmDeviceTitle: 'Использовать версию с устройства?',
  deletedData: 'Удаление',
  finishSynchronization: 'Завершить синхронизацию',
  otherConflicts:
    'Для остальных конфликтов нельзя выбрать версию вручную. Повторите синхронизацию без удаления какой-либо версии.',
  outcomeAuthenticationRequired: 'Войдите снова перед разрешением конфликта.',
  outcomeInProgress: 'Этот выбор уже отправляется.',
  outcomeRejected: 'Этот конфликт больше не принимает выбранное действие. Синхронизируйте его актуальное состояние.',
  outcomeResolved: 'Выбранная версия применена и синхронизирована.',
  outcomeRetryable: 'Выбор сохранён. Повторите попытку после восстановления соединения.',
  outcomeWaiting: 'Выбор принят. Ожидаем завершения авторитетной синхронизации.',
  retrySelectedChoice: 'Повторить выбранное действие',
  retrySync: 'Повторить синхронизацию',
  retrying: 'Разрешаем конфликт…',
  savedData: 'Сохранённые данные',
  selectedAccount: 'Выбрана версия из аккаунта',
  selectedDevice: 'Выбрана версия с этого устройства',
  selectionExplanation:
    'Выберите версию, которая должна остаться. Другая версия будет заменена только после явного подтверждения и авторитетной синхронизации.',
  thisDevice: 'Это устройство',
  useAccountVersion: 'Использовать версию из аккаунта',
  useDeviceVersion: 'Использовать версию с устройства',
};

export const getSyncConflictResolutionUiCopy = (
  locale: SupportedLocale,
): SyncConflictResolutionUiCopy => (locale === 'ru' ? ru : en);
