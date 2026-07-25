import { describe, expect, it } from 'vitest';

import {
  localizeAccountDeletionMessage,
  localizeAuthSubmission,
  localizeAuthValidation,
  localizeChangePasswordMessage,
  localizeSessionManagementMessage,
} from '@/localization/authCopy';
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

  it('localizes auth validation and submission messages', () => {
    const t = (key: keyof typeof enMessages) => translate('ru', key);

    expect(localizeAuthValidation('Email is required.', t)).toBe(
      'Укажите электронную почту.',
    );
    expect(
      localizeAuthSubmission(
        'Sign-in details were not accepted. Check your email and password, then try again.',
        t,
      ),
    ).toBe('Данные для входа не приняты. Проверьте почту и пароль.');
  });

  it('localizes security-flow errors without exposing raw backend copy', () => {
    const t = (key: keyof typeof enMessages) => translate('ru', key);

    expect(
      localizeChangePasswordMessage(
        'Current password is incorrect or your session has expired.',
        t,
      ),
    ).toBe('Текущий пароль неверен или срок сессии истёк.');
    expect(localizeAccountDeletionMessage('Current password is incorrect.', t)).toBe(
      'Текущий пароль неверен.',
    );
    expect(localizeSessionManagementMessage('Your session expired. Sign in again.', t)).toBe(
      'Срок сессии истёк. Войдите снова.',
    );
  });

  it('falls back to safe localized generic errors for unknown legacy messages', () => {
    const t = (key: keyof typeof enMessages) => translate('ru', key);

    expect(localizeAuthSubmission('raw backend payload', t)).toBe(
      'Произошла ошибка. Повторите попытку.',
    );
    expect(localizeAccountDeletionMessage('raw backend payload', t)).toBe(
      'Не удалось удалить аккаунт. Повторите попытку.',
    );
  });
});