export const enMessages = {
  'common.back': 'Back',
  'common.system': 'System',
  'common.light': 'Light',
  'common.dark': 'Dark',
  'common.english': 'English',
  'common.russian': 'Russian',
  'tabs.home': 'Home',
  'tabs.workouts': 'Workouts',
  'tabs.nutrition': 'Nutrition',
  'tabs.progress': 'Progress',
  'tabs.profile': 'Profile',
  'profile.title': 'Profile',
  'profile.settingsSection': 'Settings',
  'profile.settingsAction': 'Open app settings',
  'profile.settingsDescription': 'Language, appearance, and other device preferences.',
  'settings.title': 'Settings',
  'settings.subtitle': 'Choose how the app looks and which language it uses on this device.',
  'settings.general': 'General',
  'settings.language': 'Language',
  'settings.languageDescription': 'Use the device language or choose a language manually.',
  'settings.languageSystem': 'Device language',
  'settings.appearance': 'Appearance',
  'settings.appearanceDescription': 'Follow the device theme or override it for this app.',
  'settings.aboutPreferences': 'These preferences are stored on this device and apply immediately.',
} as const;

export type MessageKey = keyof typeof enMessages;
export type SupportedLocale = 'en' | 'ru';
export type LanguagePreference = 'system' | SupportedLocale;

export const ruMessages: Record<MessageKey, string> = {
  'common.back': 'Назад',
  'common.system': 'Система',
  'common.light': 'Светлая',
  'common.dark': 'Тёмная',
  'common.english': 'Английский',
  'common.russian': 'Русский',
  'tabs.home': 'Главная',
  'tabs.workouts': 'Тренировки',
  'tabs.nutrition': 'Питание',
  'tabs.progress': 'Прогресс',
  'tabs.profile': 'Профиль',
  'profile.title': 'Профиль',
  'profile.settingsSection': 'Настройки',
  'profile.settingsAction': 'Открыть настройки приложения',
  'profile.settingsDescription': 'Язык, оформление и другие настройки устройства.',
  'settings.title': 'Настройки',
  'settings.subtitle': 'Выберите оформление приложения и язык интерфейса на этом устройстве.',
  'settings.general': 'Основные',
  'settings.language': 'Язык',
  'settings.languageDescription': 'Используйте язык устройства или выберите язык вручную.',
  'settings.languageSystem': 'Язык устройства',
  'settings.appearance': 'Оформление',
  'settings.appearanceDescription': 'Следуйте системной теме или выберите тему только для приложения.',
  'settings.aboutPreferences': 'Эти настройки хранятся на устройстве и применяются сразу.',
};

export const MESSAGE_CATALOGS: Record<SupportedLocale, Record<MessageKey, string>> = {
  en: enMessages,
  ru: ruMessages,
};
