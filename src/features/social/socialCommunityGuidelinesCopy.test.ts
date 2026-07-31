import { describe, expect, it } from 'vitest';

import { getSocialCommunityGuidelinesCopy } from './socialCommunityGuidelinesCopy';

const expectedSectionIds = [
  'respect',
  'safety',
  'authenticity',
  'privacy',
  'fitness',
  'controls',
];

describe('social community guidelines copy', () => {
  it.each(['en', 'ru'] as const)(
    'keeps the %s guideline structure complete and bounded',
    (locale) => {
      const copy = getSocialCommunityGuidelinesCopy(locale);

      expect(copy.sections.map((section) => section.id)).toEqual(
        expectedSectionIds,
      );
      expect(copy.entryAction.trim()).not.toBe('');
      expect(copy.title.trim()).not.toBe('');
      expect(copy.updatedValue.trim()).not.toBe('');
      expect(copy.reportBody.toLowerCase()).toContain(
        locale === 'ru' ? 'не удаляет' : 'does not automatically remove',
      );
      for (const section of copy.sections) {
        expect(section.title.trim()).not.toBe('');
        expect(section.body.trim().length).toBeGreaterThan(20);
      }
    },
  );
});
