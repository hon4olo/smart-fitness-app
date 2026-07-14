import type { Exercise, TrainingProgram, Workout, WorkoutSession } from '@/types';

import { getMuscleAnalytics, type MuscleAnalytics } from '@/lib/progress';
import { createDefaultTrainingProgram, getTrainingProgramOverview } from '@/lib/workouts';

import { DeterministicRecommendation, evaluateRules, uniqueValues, type Rule } from './ruleEngine';

export type TrainingAdvisorInput = {
  exercises: Exercise[];
  program?: TrainingProgram | null;
  workoutSessions: WorkoutSession[];
  workouts: Workout[];
};

export type TrainingAdvisorResult = {
  improvementOpportunities: string[];
  muscleSummary: {
    balanced: string[];
    overtrained: string[];
    undertrained: string[];
    missing: string[];
  };
  primaryRecommendation: string;
  recommendations: DeterministicRecommendation[];
  status: 'balanced' | 'deload' | 'needs-attention' | 'maintain';
  trainingFocus: string;
  warnings: string[];
  weeklySets: number;
  weeklyVolume: number;
};

type AdvisorContext = {
  analytics: MuscleAnalytics;
  programOverview: ReturnType<typeof getTrainingProgramOverview>;
};

const getGroup = (analytics: MuscleAnalytics, label: string) => analytics.groups.find((group) => group.label === label) ?? null;

const buildFocusFromGroups = (groups: string[]) => {
  if (groups.length === 0) {
    return 'Maintain current program';
  }

  return `Focus on ${groups[0].toLowerCase()}`;
};

export const getTrainingAdvisor = ({ exercises, program, workoutSessions, workouts }: TrainingAdvisorInput): TrainingAdvisorResult => {
  const analytics = getMuscleAnalytics({ exercises, workoutSessions });
  const effectiveProgram = program ?? createDefaultTrainingProgram(workouts);
  const programOverview = getTrainingProgramOverview(effectiveProgram, workouts, exercises);
  const context: AdvisorContext = { analytics, programOverview };

  const balancedGroups = analytics.groups.filter((group) => group.balanceStatus === 'balanced').map((group) => group.label);
  const undertrainedGroups = analytics.groups.filter((group) => group.balanceStatus === 'undertrained').map((group) => group.label);
  const overtrainedGroups = analytics.groups.filter((group) => group.balanceStatus === 'overtrained').map((group) => group.label);
  const missingGroups = programOverview.missingMuscleGroups;
  const rules: Rule<AdvisorContext, DeterministicRecommendation>[] = [
    {
      id: 'deload',
      priority: 100,
      when: (value) => value.analytics.totalWorkingSets >= 120 || value.analytics.groups.filter((group) => group.balanceStatus === 'overtrained').length >= 2,
      then: (value) => ({
        id: 'deload',
        title: 'Consider deload',
        detail: `Weekly load is ${value.analytics.totalWorkingSets} working sets with ${value.analytics.groups.filter((group) => group.balanceStatus === 'overtrained').length} overtrained muscle groups.`,
        priority: 100,
        tone: 'warning' as const,
      }),
    },
    {
      id: 'reduce-chest',
      priority: 90,
      when: (value) => getGroup(value.analytics, 'Chest')?.balanceStatus === 'overtrained',
      then: () => ({
        id: 'reduce-chest',
        title: 'Reduce chest volume',
        detail: 'Chest is carrying too much of the weekly load.',
        priority: 90,
        tone: 'warning' as const,
      }),
    },
    {
      id: 'increase-back',
      priority: 88,
      when: (value) => getGroup(value.analytics, 'Back')?.balanceStatus === 'undertrained' || missingGroups.includes('Back'),
      then: () => ({
        id: 'increase-back',
        title: 'Increase back volume',
        detail: 'Back volume and frequency lag behind the rest of the week.',
        priority: 88,
        tone: 'neutral' as const,
      }),
    },
    {
      id: 'train-hamstrings',
      priority: 86,
      when: (value) => getGroup(value.analytics, 'Hamstrings')?.balanceStatus === 'undertrained' || missingGroups.includes('Hamstrings'),
      then: () => ({
        id: 'train-hamstrings',
        title: 'Train hamstrings',
        detail: 'Hamstrings are either missing or underdosed this week.',
        priority: 86,
        tone: 'neutral' as const,
      }),
    },
    {
      id: 'add-rear-delts',
      priority: 84,
      when: (value) => getGroup(value.analytics, 'Shoulders')?.balanceStatus === 'undertrained' || missingGroups.includes('Shoulders'),
      then: () => ({
        id: 'add-rear-delts',
        title: 'Add rear delts',
        detail: 'Shoulder work looks light compared with the rest of the plan.',
        priority: 84,
        tone: 'neutral' as const,
      }),
    },
    {
      id: 'reduce-chest-frequency',
      priority: 82,
      when: (value) => {
        const chestFrequency = value.programOverview.muscleFrequency.find((group) => group.label === 'Chest')?.trainingFrequency ?? 0;
        return chestFrequency >= 3 && getGroup(value.analytics, 'Chest')?.balanceStatus === 'overtrained';
      },
      then: () => ({
        id: 'reduce-chest-frequency',
        title: 'Reduce chest frequency',
        detail: 'Chest is being trained too often relative to the rest of the week.',
        priority: 82,
        tone: 'warning' as const,
      }),
    },
    {
      id: 'maintain',
      priority: 1,
      when: (value) => value.analytics.totalWorkingSets > 0,
      then: () => ({
        id: 'maintain',
        title: 'Maintain current program',
        detail: 'No obvious imbalance is standing out right now.',
        priority: 1,
        tone: 'positive' as const,
      }),
    },
  ];

  const recommendations = evaluateRules(context, rules);

  const dedupedRecommendations = uniqueValues(recommendations.map((entry) => JSON.stringify(entry.result))).map((value) => JSON.parse(value) as DeterministicRecommendation).sort((left, right) => right.priority - left.priority);
  const primaryRecommendation = dedupedRecommendations[0] ?? {
    id: 'no-training-data',
    title: 'Maintain current program',
    detail: 'No training data is available yet.',
    priority: 0,
    tone: 'neutral' as const,
  };

  const warnings = [
    ...(overtrainedGroups.length > 0 ? [`Overtrained: ${overtrainedGroups.join(', ')}`] : []),
    ...(missingGroups.length > 0 ? [`Missing muscle groups: ${missingGroups.join(', ')}`] : []),
    ...(analytics.totalWorkingSets >= 120 ? [`Weekly volume is high at ${analytics.totalWorkingSets} working sets.`] : []),
  ];

  const improvementOpportunities = uniqueValues([
    ...undertrainedGroups.map((group) => `Increase ${group.toLowerCase()} volume`),
    ...programOverview.muscleFrequency.filter((group) => group.trainingFrequency < 2 && group.workingSets > 0).map((group) => `Raise ${group.label.toLowerCase()} frequency`),
  ]).filter(Boolean);

  const status: TrainingAdvisorResult['status'] = recommendations.some((entry) => entry.result.id === 'deload')
    ? 'deload'
    : overtrainedGroups.length > 0 || missingGroups.length > 0
      ? 'needs-attention'
      : balancedGroups.length > 0
        ? 'balanced'
        : 'maintain';

  return {
    improvementOpportunities,
    muscleSummary: {
      balanced: balancedGroups,
      overtrained: overtrainedGroups,
      undertrained: undertrainedGroups,
      missing: missingGroups,
    },
    primaryRecommendation: primaryRecommendation.title,
    recommendations: dedupedRecommendations,
    status,
    trainingFocus: buildFocusFromGroups([...undertrainedGroups, ...missingGroups]),
    warnings,
    weeklySets: analytics.totalWorkingSets,
    weeklyVolume: analytics.totalVolume,
  };
};
