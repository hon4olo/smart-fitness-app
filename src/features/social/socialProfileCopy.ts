import type { SupportedLocale } from '@/localization';

const en = {
  settingsSection: 'Social profile',
  settingsTitle: 'Social profile',
  settingsDescription:
    'Choose how other Smart Fitness users see you. Social data stays separate from private fitness synchronization.',
  settingsAction: 'Manage social profile',
  eyebrow: 'SOCIAL',
  title: 'Social profile',
  subtitle:
    'Create the public identity used for profiles, follows, and workout sharing.',
  signInTitle: 'Sign in required',
  signInBody: 'Sign in before creating or editing a social profile.',
  signInAction: 'Sign in',
  loading: 'Loading social profile…',
  loadError: 'The social profile could not be loaded. Your private app data was not affected.',
  retry: 'Retry',
  username: 'Username',
  usernamePlaceholder: 'coach_ivan',
  usernameHelp: '3–30 letters, numbers, or underscores. Usernames are stored in lowercase.',
  displayName: 'Display name',
  displayNamePlaceholder: 'Ivan',
  bio: 'Bio',
  bioPlaceholder: 'Training focus, experience, or a short introduction',
  bioHelp: 'Up to 280 characters.',
  visibility: 'Profile visibility',
  visibilityHelp:
    'Public profiles can be followed immediately. Private profiles approve follow requests.',
  visibilityPublic: 'Public',
  visibilityPrivate: 'Private',
  privacyNote:
    'This profile never includes email, sessions, nutrition, measurements, limitations, recovery, Coach context, or private workout data.',
  save: 'Save social profile',
  saving: 'Saving…',
  savedTitle: 'Social profile saved',
  savedBody: 'Your server-authoritative social profile is up to date.',
  validationUsernameRequired: 'Enter a username.',
  validationUsernameFormat: 'Use 3–30 letters, numbers, or underscores.',
  validationDisplayNameRequired: 'Enter a display name.',
  validationDisplayNameLength: 'Display name must be 80 characters or less.',
  validationBioLength: 'Bio must be 280 characters or less.',
  errorUsernameTaken: 'That username is already taken.',
  errorOffline: 'Connect to the internet and try again.',
  errorSessionExpired: 'Your session expired. Sign in again.',
  errorGeneric: 'The social profile could not be saved right now. Try again.',
} as const;

export type SocialProfileCopy = Record<keyof typeof en, string>;

const ru: SocialProfileCopy = {
  settingsSection: 'Социальный профиль',
  settingsTitle: 'Социальный профиль',
  settingsDescription:
    'Настройте, как вас видят другие пользователи Smart Fitness. Социальные данные отделены от синхронизации личных фитнес-данных.',
  settingsAction: 'Управлять социальным профилем',
  eyebrow: 'СОЦИАЛЬНЫЙ ПРОФИЛЬ',
  title: 'Социальный профиль',
  subtitle:
    'Создайте публичную идентичность для профилей, подписок и публикации тренировок.',
  signInTitle: 'Требуется вход',
  signInBody: 'Войдите в аккаунт, чтобы создать или изменить социальный профиль.',
  signInAction: 'Войти',
  loading: 'Загрузка социального профиля…',
  loadError: 'Не удалось загрузить социальный профиль. Личные данные приложения не затронуты.',
  retry: 'Повторить',
  username: 'Имя пользователя',
  usernamePlaceholder: 'coach_ivan',
  usernameHelp: 'От 3 до 30 букв, цифр или символов подчёркивания. Имя хранится в нижнем регистре.',
  displayName: 'Отображаемое имя',
  displayNamePlaceholder: 'Иван',
  bio: 'О себе',
  bioPlaceholder: 'Направление тренировок, опыт или короткое описание',
  bioHelp: 'Не более 280 символов.',
  visibility: 'Видимость профиля',
  visibilityHelp:
    'На публичные профили подписываются сразу. Закрытые профили подтверждают запросы.',
  visibilityPublic: 'Публичный',
  visibilityPrivate: 'Закрытый',
  privacyNote:
    'Профиль не содержит email, сессии, питание, измерения, ограничения, восстановление, контекст Coach или личные данные тренировок.',
  save: 'Сохранить социальный профиль',
  saving: 'Сохранение…',
  savedTitle: 'Социальный профиль сохранён',
  savedBody: 'Серверный социальный профиль обновлён.',
  validationUsernameRequired: 'Введите имя пользователя.',
  validationUsernameFormat: 'Используйте от 3 до 30 букв, цифр или символов подчёркивания.',
  validationDisplayNameRequired: 'Введите отображаемое имя.',
  validationDisplayNameLength: 'Отображаемое имя должно содержать не более 80 символов.',
  validationBioLength: 'Описание должно содержать не более 280 символов.',
  errorUsernameTaken: 'Это имя пользователя уже занято.',
  errorOffline: 'Подключитесь к интернету и повторите попытку.',
  errorSessionExpired: 'Сессия истекла. Войдите снова.',
  errorGeneric: 'Сейчас не удалось сохранить социальный профиль. Повторите попытку.',
};

export const getSocialProfileCopy = (locale: SupportedLocale): SocialProfileCopy =>
  locale === 'ru' ? ru : en;
