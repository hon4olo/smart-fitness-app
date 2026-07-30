import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  detectSystemLocale,
  LANGUAGE_PREFERENCE_STORAGE_KEY,
  resolveLocale,
  type LanguagePreference,
  type SupportedLocale,
} from '@/localization';

export type RootErrorCopy = {
  eyebrow: string;
  title: string;
  body: string;
  retry: string;
  restart: string;
};

const ROOT_ERROR_COPY: Record<SupportedLocale, RootErrorCopy> = {
  en: {
    eyebrow: 'SMART FITNESS',
    title: 'Something went wrong',
    body: 'Your saved data has not been intentionally removed. Try reopening this screen or restart the app.',
    retry: 'Try again',
    restart: 'Restart app',
  },
  ru: {
    eyebrow: 'SMART FITNESS',
    title: 'Произошла ошибка',
    body: 'Сохранённые данные не удалялись намеренно. Попробуйте открыть экран снова или перезапустите приложение.',
    retry: 'Повторить',
    restart: 'Перезапустить приложение',
  },
};

const isLanguagePreference = (value: unknown): value is LanguagePreference =>
  value === 'system' || value === 'en' || value === 'ru';

export const resolveRootErrorLocale = (
  storedPreference: unknown,
  systemLocale: SupportedLocale = detectSystemLocale(),
): SupportedLocale =>
  resolveLocale(isLanguagePreference(storedPreference) ? storedPreference : 'system', systemLocale);

export const getRootErrorCopy = (locale: SupportedLocale): RootErrorCopy =>
  ROOT_ERROR_COPY[locale];

export const loadRootErrorCopy = async (): Promise<RootErrorCopy> => {
  const systemLocale = detectSystemLocale();
  try {
    const storedPreference = await AsyncStorage.getItem(LANGUAGE_PREFERENCE_STORAGE_KEY);
    return getRootErrorCopy(resolveRootErrorLocale(storedPreference, systemLocale));
  } catch {
    return getRootErrorCopy(systemLocale);
  }
};
