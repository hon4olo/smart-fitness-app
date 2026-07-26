import type { RecoveryStatus } from '@/lib/intelligence';
import type { MessageKey, Translate } from '@/localization';

const RECOVERY_STATUS_KEYS = {
  Ready: 'home.recovery.ready',
  Recovering: 'home.recovery.recovering',
  'Fully Recovered': 'home.recovery.fullyRecovered',
  'Recovery Delayed': 'home.recovery.delayed',
  Overloaded: 'home.recovery.overloaded',
} as const satisfies Record<RecoveryStatus, MessageKey>;

const MOTIVATION_MESSAGE_KEYS = {
  'Consider deload': 'home.motivation.deload',
  'Reduce chest volume': 'home.motivation.reduceChest',
  'Increase back volume': 'home.motivation.increaseBack',
  'Train hamstrings': 'home.motivation.trainHamstrings',
  'Add rear delts': 'home.motivation.addRearDelts',
  'Reduce chest frequency': 'home.motivation.reduceChestFrequency',
  'Maintain current program': 'home.motivation.maintain',
  'Keep moving forward.': 'home.motivation',
} as const satisfies Partial<Record<string, MessageKey>>;

export const getHomeRecoveryStatusLabel = (t: Translate, status: RecoveryStatus) =>
  t(RECOVERY_STATUS_KEYS[status]);

export const getHomeMotivationLabel = (t: Translate, motivation: string) => {
  const exactKey = MOTIVATION_MESSAGE_KEYS[motivation as keyof typeof MOTIVATION_MESSAGE_KEYS];
  if (exactKey) return t(exactKey);

  const weeklyWorkouts = motivation.match(/^You trained (\d+) times this week\.$/);
  if (weeklyWorkouts) {
    return t('home.motivationWeeklyWorkouts', { count: weeklyWorkouts[1] });
  }

  const volumeImprovement = motivation.match(
    /^Your training volume improved (-?\d+)% this week\.$/,
  );
  if (volumeImprovement) {
    return t('home.motivationVolume', { percent: volumeImprovement[1] });
  }

  if (motivation.startsWith('Today is a good recovery day.')) {
    return t('home.motivationRecovery');
  }

  const proteinRemaining = motivation.match(
    /^You are close to your protein goal \((\d+) g remaining\)\.$/,
  );
  if (proteinRemaining) {
    return t('home.motivationProtein', { grams: proteinRemaining[1] });
  }

  return t('home.motivation');
};
