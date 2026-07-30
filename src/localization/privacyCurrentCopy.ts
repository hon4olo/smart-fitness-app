import type { SupportedLocale } from './messages';

export const getPrivacyCurrentCopy = (locale: SupportedLocale) => ({
  crashTitle:
    locale === 'ru' ? 'Сбои и локальная диагностика' : 'Crashes and local diagnostics',
  crashBody:
    locale === 'ru'
      ? 'Внешняя отправка отчётов о сбоях не включена. Приложение сохраняет только локальные агрегированные размеры, длительность и категории ошибок без показателей здоровья, названий еды и упражнений, свободного текста, email, токенов, идентификаторов и содержимого аккаунта.'
      : 'External crash reporting is not enabled. The app stores only local aggregate sizes, durations, and failure categories without health values, food or exercise names, free text, email, tokens, identifiers, or account content.',
});
