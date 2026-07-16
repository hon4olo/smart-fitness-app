import { beforeEach, describe, expect, it, vi } from 'vitest';

const storage = vi.hoisted(() => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: storage,
}));

vi.mock('react-native', () => ({
  Appearance: {
    getColorScheme: vi.fn(() => 'light'),
    setColorScheme: vi.fn(),
  },
}));

import { APPEARANCE_STORAGE_KEY, loadAppearanceMode, resolveAppearance, saveAppearanceMode } from '@/theme/appearance';

describe('appearance persistence', () => {
  beforeEach(() => {
    storage.getItem.mockReset();
    storage.setItem.mockReset();
  });

  it('defaults to system when no persisted mode exists', async () => {
    storage.getItem.mockResolvedValueOnce(null);

    await expect(loadAppearanceMode()).resolves.toBe('system');
    expect(storage.getItem).toHaveBeenCalledWith(APPEARANCE_STORAGE_KEY);
  });

  it('loads a persisted appearance mode', async () => {
    storage.getItem.mockResolvedValueOnce('dark');

    await expect(loadAppearanceMode()).resolves.toBe('dark');
  });

  it('saves the selected appearance mode', async () => {
    await saveAppearanceMode('light');

    expect(storage.setItem).toHaveBeenCalledWith(APPEARANCE_STORAGE_KEY, 'light');
  });

  it('resolves system mode against the current system appearance', () => {
    expect(resolveAppearance('system', 'dark')).toBe('dark');
    expect(resolveAppearance('system', 'light')).toBe('light');
  });
});
