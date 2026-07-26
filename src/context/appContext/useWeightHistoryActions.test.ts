import { describe, expect, it, vi } from 'vitest';

import { resolveWeightSyncIdentity } from './useWeightHistoryActions';

describe('resolveWeightSyncIdentity', () => {
  it('uses the signed-in session identity when available', async () => {
    const getCurrentSession = vi.fn().mockResolvedValue({
      device: { id: 'device-1' },
      user: { id: 'user-1' },
    });

    await expect(resolveWeightSyncIdentity({ getCurrentSession } as never)).resolves.toEqual({
      actorId: 'user-1',
      deviceId: 'device-1',
    });
  });

  it('falls back to a local identity when session restoration fails', async () => {
    const getCurrentSession = vi.fn().mockRejectedValue(new Error('secure storage unavailable'));

    await expect(resolveWeightSyncIdentity({ getCurrentSession } as never)).resolves.toEqual({
      deviceId: 'local-device',
    });
  });
});
