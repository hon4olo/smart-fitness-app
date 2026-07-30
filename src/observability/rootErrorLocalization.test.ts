import { describe, expect, it } from 'vitest';

import { getRootErrorCopy, resolveRootErrorLocale } from './rootErrorLocalization';

describe('root error localization', () => {
  it('uses persisted English or Russian before providers mount', () => {
    expect(resolveRootErrorLocale('en', 'ru')).toBe('en');
    expect(resolveRootErrorLocale('ru', 'en')).toBe('ru');
  });

  it('falls back to the system locale for system, invalid, and missing values', () => {
    expect(resolveRootErrorLocale('system', 'ru')).toBe('ru');
    expect(resolveRootErrorLocale('unsupported', 'ru')).toBe('ru');
    expect(resolveRootErrorLocale(null, 'en')).toBe('en');
  });

  it('provides complete bounded copy in both languages', () => {
    for (const locale of ['en', 'ru'] as const) {
      const copy = getRootErrorCopy(locale);
      expect(copy.eyebrow).toBe('SMART FITNESS');
      expect(copy.title).toBeTruthy();
      expect(copy.body).toBeTruthy();
      expect(copy.retry).toBeTruthy();
      expect(copy.restart).toBeTruthy();
      expect(Object.keys(copy)).toHaveLength(5);
    }
  });
});
