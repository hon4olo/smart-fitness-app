import { Platform, Share } from 'react-native';

import { showComingSoon } from './comingSoon';

export const shareWorkoutSummary = async (workoutTitle: string, setCount: number, durationLabel: string) => {
  if (Platform.OS === 'web') {
    showComingSoon('Share', 'Sharing is coming soon.');
    return;
  }

  try {
    await Share.share({
      message: `${workoutTitle} — ${setCount} set${setCount === 1 ? '' : 's'} · ${durationLabel}`,
      title: workoutTitle,
    });
  } catch {
    showComingSoon('Share', 'Sharing is coming soon.');
  }
};
