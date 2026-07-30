import type { SupportedLocale } from './messages';

export type CombinedCapabilityPresentation =
  | 'checking'
  | 'sign_in'
  | 'available'
  | 'unavailable';

const KNOWN_SYNC_STATES = [
  'idle',
  'syncing',
  'success',
  'error',
  'offline',
  'conflict',
] as const;

type KnownSyncState = (typeof KNOWN_SYNC_STATES)[number];

const isKnownSyncState = (value: string): value is KnownSyncState =>
  KNOWN_SYNC_STATES.some((state) => state === value);

export const getCombinedCoachTrustCopy = (locale: SupportedLocale) => {
  const isRussian = locale === 'ru';
  const capabilityLabels: Record<CombinedCapabilityPresentation, string> = {
    checking: isRussian ? 'проверяется' : 'checking',
    sign_in: isRussian ? 'доступно после входа' : 'available after sign-in',
    available: isRussian ? 'доступно' : 'available',
    unavailable: isRussian ? 'недоступно' : 'unavailable',
  };
  const syncLabels: Record<KnownSyncState, string> = {
    idle: isRussian ? 'готово' : 'ready',
    syncing: isRussian ? 'выполняется' : 'in progress',
    success: isRussian ? 'завершена' : 'complete',
    error: isRussian ? 'нужна повторная попытка' : 'retry needed',
    offline: isRussian ? 'нет подключения' : 'offline',
    conflict: isRussian ? 'нужно разрешить конфликт' : 'conflict needs review',
  };

  return {
    capabilityLabel: (state: CombinedCapabilityPresentation) =>
      capabilityLabels[state],
    syncLabel: (status: string) =>
      isKnownSyncState(status)
        ? syncLabels[status]
        : isRussian
          ? 'статус недоступен'
          : 'status unavailable',
    unavailableHint: isRussian
      ? 'Эта функция пока недоступна для текущей конфигурации аккаунта и сервера.'
      : 'This feature is not available for the current account and server configuration.',
  };
};
