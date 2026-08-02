import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const readSource = (path: string): string =>
  readFileSync(join(process.cwd(), path), 'utf8');

describe('capability gating source boundaries', () => {
  it('scopes capability loading inside the authenticated app provider', () => {
    const appContext = readSource('src/context/AppContext.tsx');
    expect(appContext).toContain('<AuthProvider service={authService}>');
    expect(appContext).toContain(
      '<CapabilityProvider service={capabilityService}>',
    );
  });

  it('blocks direct password-reset requests when capability is unavailable', () => {
    const forgot = readSource('src/app/auth/forgot-password.tsx');
    const reset = readSource('src/app/auth/reset-password.tsx');

    expect(forgot).toContain('if (isSubmitting || !passwordReset.canUse) return;');
    expect(reset).toContain('if (isSubmitting || !passwordReset.canUse) return;');
    expect(forgot).toContain('<CapabilityStatusNotice gate={passwordReset} />');
    expect(reset).toContain('<CapabilityStatusNotice gate={passwordReset} />');
  });

  it('hard-gates managed avatar and workout-image hooks before provider requests', () => {
    const avatar = readSource(
      'src/features/social/useSocialManagedAvatar.ts',
    );
    const workoutImage = readSource(
      'src/features/social/useSocialWorkoutPostMedia.ts',
    );

    expect(avatar).toContain('if (!accountId || !enabled)');
    expect(avatar).toContain('if (!accountId || !enabled || !profileExists) return;');
    expect(workoutImage).toContain('if (!accountId || !sessionId || !enabled)');
    expect(workoutImage).toContain(
      'hasImageDraft: enabled && Boolean(asset || previewUri)',
    );
  });

  it('keeps unavailable state copy bounded in English and Russian', () => {
    const copy = readSource('src/capabilities/copy.ts');
    expect(copy).toContain("title: 'Feature unavailable'");
    expect(copy).toContain("title: 'Функция недоступна'");
    expect(copy).toContain("title: 'Temporarily unavailable'");
    expect(copy).toContain("title: 'Временно недоступна'");
    expect(copy).not.toContain('provider payload');
  });
});
