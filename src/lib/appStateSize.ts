import type { AppState } from '@/types';

export type AppStateDomainSize = {
  key: keyof AppState;
  serializedCharacters: number;
  share: number;
};

export type AppStateSizeReport = {
  domains: AppStateDomainSize[];
  totalSerializedCharacters: number;
};

export const analyzeAppStateSize = (state: AppState): AppStateSizeReport => {
  const totalSerializedCharacters = JSON.stringify(state).length;
  const domains = (Object.keys(state) as (keyof AppState)[])
    .map((key) => {
      const serializedCharacters = JSON.stringify(state[key]).length;
      return {
        key,
        serializedCharacters,
        share:
          totalSerializedCharacters === 0
            ? 0
            : serializedCharacters / totalSerializedCharacters,
      };
    })
    .sort((left, right) => right.serializedCharacters - left.serializedCharacters);

  return { domains, totalSerializedCharacters };
};
