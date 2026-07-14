import type { NutritionAdvisorResult } from './nutritionAdvisor';
import type { RecoveryAdvisorResult } from './recoveryAdvisor';
import type { TrainingAdvisorResult } from './trainingAdvisor';

import { pickRuleResult, type Rule } from './ruleEngine';

export type MotivationInput = {
  nutrition: NutritionAdvisorResult;
  recovery: RecoveryAdvisorResult;
  training: TrainingAdvisorResult;
  weeklyWorkoutCount: number;
  weeklyVolumeChangePercent?: number | null;
};

const rules: Rule<MotivationInput, string>[] = [
  {
    id: 'weekly-workouts',
    priority: 100,
    when: (context) => context.weeklyWorkoutCount >= 4,
    then: (context) => `You trained ${context.weeklyWorkoutCount} times this week.`,
  },
  {
    id: 'volume-improved',
    priority: 95,
    when: (context) => typeof context.weeklyVolumeChangePercent === 'number' && context.weeklyVolumeChangePercent > 0,
    then: (context) => `Your training volume improved ${Math.round(context.weeklyVolumeChangePercent ?? 0)}% this week.`,
  },
  {
    id: 'recovery-day',
    priority: 90,
    when: (context) => context.recovery.status === 'Ready' || context.recovery.status === 'Fully Recovered',
    then: (context) => `Today is a good recovery day. ${context.recovery.recommendedNextWorkout}.`,
  },
  {
    id: 'protein-close',
    priority: 80,
    when: (context) => context.nutrition.proteinRemaining > 0 && context.nutrition.proteinRemaining <= 20,
    then: (context) => `You are close to your protein goal (${Math.round(context.nutrition.proteinRemaining)} g remaining).`,
  },
  {
    id: 'training-focus',
    priority: 10,
    when: (context) => context.training.primaryRecommendation.length > 0,
    then: (context) => context.training.primaryRecommendation,
  },
];

export const getMotivationInsight = (input: MotivationInput) => {
  return pickRuleResult(input, rules, 'Keep moving forward.');
};
