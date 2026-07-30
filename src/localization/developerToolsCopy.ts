import type { SupportedLocale } from './messages';

export const getDeveloperToolsCopy = (locale: SupportedLocale) => ({
  checkForOtaUpdate:
    locale === 'ru' ? 'Проверить наличие OTA-обновления' : 'Check for OTA update',
});

export type DeveloperToolsCopy = ReturnType<typeof getDeveloperToolsCopy>;
