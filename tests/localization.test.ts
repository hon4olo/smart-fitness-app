import { describe, expect, it } from 'vitest';

import { enMessages, ruMessages } from '@/localization/messages';
import { resolveLocale, translate } from '@/localization/LocalizationProvider';

describe('localization foundation', () => {
  it('keeps Russian and English catalogs key-complete', () => {
    expect(Object.keys(ruMessages).sort()).toEqual(Object.keys(enMessages).sort());
  });

  it('uses the detected system locale for system preference', () => {
    expect(resolveLocale('system', 'ru')).toBe('ru');
    expect(resolveLocale('system', 'en')).toBe('en');
  });

  it('honors an explicit language override', () => {
    expect(resolveLocale('en', 'ru')).toBe('en');
    expect(resolveLocale('ru', 'en')).toBe('ru');
  });

  it('returns typed catalog messages', () => {
    expect(translate('en', 'settings.title')).toBe('Settings');
    expect(translate('ru', 'settings.title')).toBe('Настройки');
  });
});
