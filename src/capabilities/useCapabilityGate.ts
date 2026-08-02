import { useContext, useMemo } from 'react';

import { useLocalization } from '@/localization';

import { CapabilityContext } from './CapabilityContext';
import { getCapabilityStatusCopy } from './copy';
import type { AppCapabilityName } from './contracts';
import {
  getCapability,
  resolveCapabilityAvailability,
  type CapabilityAvailability,
} from './model';

export type CapabilityGate = {
  availability: CapabilityAvailability;
  canUse: boolean;
  title: string;
  body: string;
  retryLabel: string;
  refresh(): Promise<void>;
};

export const useCapabilityGate = (
  name: AppCapabilityName,
): CapabilityGate => {
  const context = useContext(CapabilityContext);
  const { locale } = useLocalization();

  if (!context) {
    throw new Error('useCapabilityGate must be used inside CapabilityProvider');
  }

  return useMemo(() => {
    const availability = resolveCapabilityAvailability(
      getCapability(context.capabilities, name),
      context.status,
    );
    const copy = getCapabilityStatusCopy(locale, availability);
    return {
      availability,
      canUse: availability === 'available',
      title: copy.title,
      body: copy.body,
      retryLabel: copy.retry,
      refresh: context.refresh,
    };
  }, [context.capabilities, context.refresh, context.status, locale, name]);
};
