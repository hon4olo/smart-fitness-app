import { describe, expect, it } from 'vitest';

import { formatPlural, selectPluralForm } from '../src/localization/pluralization';

const forms = {
  one: '{count} item',
  few: '{count} items-few',
  many: '{count} items-many',
  other: '{count} items',
};

describe('localization pluralization', () => {
  it('selects English singular and plural forms', () => {
    expect(selectPluralForm('en', 1, forms)).toBe('{count} item');
    expect(selectPluralForm('en', 2, forms)).toBe('{count} items');
  });

  it('selects Russian one, few, and many forms', () => {
    expect(selectPluralForm('ru', 1, forms)).toBe('{count} item');
    expect(selectPluralForm('ru', 2, forms)).toBe('{count} items-few');
    expect(selectPluralForm('ru', 5, forms)).toBe('{count} items-many');
    expect(selectPluralForm('ru', 11, forms)).toBe('{count} items-many');
    expect(selectPluralForm('ru', 14, forms)).toBe('{count} items-many');
    expect(selectPluralForm('ru', 21, forms)).toBe('{count} item');
    expect(selectPluralForm('ru', 22, forms)).toBe('{count} items-few');
  });

  it('does not depend on Intl.PluralRules being available in the runtime', () => {
    expect(selectPluralForm('ru', 3, forms)).toBe('{count} items-few');
    expect(selectPluralForm('en', 4, forms)).toBe('{count} items');
  });

  it('interpolates the count', () => {
    expect(formatPlural('ru', 3, forms)).toBe('3 items-few');
  });
});
