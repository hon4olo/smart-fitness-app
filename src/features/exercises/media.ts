import { Colors } from '@/constants/theme';

import type { Exercise } from './types';

export const getExerciseMediaUri = (exercise: Exercise, options: { playing?: boolean } = {}) => {
  const media = exercise.media;
  const animationUrl = media.animationUrl ?? media.gifUri;
  const imageUrl = media.imageUrl;
  const thumbnailUrl = media.thumbnailUrl ?? media.thumbnailUri;

  if (options.playing !== false && animationUrl) {
    return animationUrl;
  }

  return imageUrl ?? thumbnailUrl ?? animationUrl;
};

export const getExercisePlaceholderUri = (title: string, colors: typeof Colors.dark) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420">
      <rect width="640" height="420" rx="28" fill="${colors.surfaceSecondary}"/>
      <circle cx="320" cy="140" r="54" fill="${colors.surfaceElevated}" stroke="${colors.borderSubtle}" stroke-width="4"/>
      <rect x="252" y="208" width="136" height="116" rx="42" fill="${colors.surfaceElevated}" stroke="${colors.borderSubtle}" stroke-width="4"/>
      <text x="320" y="370" text-anchor="middle" font-family="Arial" font-size="26" font-weight="700" fill="${colors.textSecondary}">${title}</text>
    </svg>
  `)}`;
