import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  MESSAGE_CATALOGS,
  type LanguagePreference,
  type MessageKey,
  type SupportedLocale,
} from './messages';
import { selectPluralForm } from './pluralization';

export const LANGUAGE_PREFERENCE_STORAGE_KEY = '@smart_fitness_language_preference';

const isLanguagePreference = (value: unknown): value is LanguagePreference =>
  value === 'system' || value === 'en' || value === 'ru';

export const detectSystemLocale = (): SupportedLocale => {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase();
    return locale.startsWith('ru') ? 'ru' : 'en';
  } catch {
    return 'en';
  }
};

export const resolveLocale = (
  preference: LanguagePreference,
  systemLocale = detectSystemLocale(),
): SupportedLocale => (preference === 'system' ? systemLocale : preference);

export const translate = (
  locale: SupportedLocale,
  key: MessageKey,
  values: Record<string, string | number> = {},
): string => {
  const template = MESSAGE_CATALOGS[locale][key] ?? MESSAGE_CATALOGS.en[key];
  return Object.entries(values).reduce(
    (message, [name, value]) => message.replaceAll(`{${name}}`, String(value)),
    template,
  );
};

type PluralMessageBaseKey<Key extends MessageKey = MessageKey> =
  Key extends `${infer Base}.one` ? Base : never;

type LocalizationContextValue = {
  locale: SupportedLocale;
  languagePreference: LanguagePreference;
  setLanguagePreference: (preference: LanguagePreference) => void;
  t: (key: MessageKey, values?: Record<string, string | number>) => string;
  formatDate: (value: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatPlural: (baseKey: PluralMessageBaseKey, count: number) => string;
};

const LocalizationContext = createContext<LocalizationContextValue | null>(null);

const localeTag: Record<SupportedLocale, string> = {
  en: 'en-US',
  ru: 'ru-RU',
};

export function LocalizationProvider({ children }: PropsWithChildren) {
  const systemLocale = detectSystemLocale();
  const [languagePreference, setLanguagePreferenceState] =
    useState<LanguagePreference>('system');
  const [hydrated, setHydrated] = useState(false);
  const locale = resolveLocale(languagePreference, systemLocale);

  useEffect(() => {
    let cancelled = false;

    void AsyncStorage.getItem(LANGUAGE_PREFERENCE_STORAGE_KEY)
      .then((stored) => {
        if (!cancelled && isLanguagePreference(stored)) {
          setLanguagePreferenceState(stored);
        }
      })
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void AsyncStorage.setItem(LANGUAGE_PREFERENCE_STORAGE_KEY, languagePreference);
  }, [hydrated, languagePreference]);

  const value = useMemo<LocalizationContextValue>(
    () => ({
      locale,
      languagePreference,
      setLanguagePreference: setLanguagePreferenceState,
      t: (key, values) => translate(locale, key, values),
      formatDate: (input, options) =>
        new Intl.DateTimeFormat(localeTag[locale], options).format(new Date(input)),
      formatNumber: (input, options) =>
        new Intl.NumberFormat(localeTag[locale], options).format(input),
      formatPlural: (baseKey, count) => {
        const key = selectPluralForm(locale, count, {
          one: `${baseKey}.one`,
          few: `${baseKey}.few`,
          many: `${baseKey}.many`,
          other: `${baseKey}.other`,
        }) as MessageKey;
        const localizedCount = new Intl.NumberFormat(localeTag[locale]).format(count);
        return translate(locale, key, { count: localizedCount });
      },
    }),
    [languagePreference, locale],
  );

  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>;
}

export function useLocalization() {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used within LocalizationProvider');
  }
  return context;
}
