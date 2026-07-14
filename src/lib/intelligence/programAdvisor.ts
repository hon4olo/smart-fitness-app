import type { Exercise, TrainingProgram, Workout } from '@/types';

import { getTrainingProgramOverview, getTrainingProgramValidation } from '@/lib/workouts';

import { DeterministicRecommendation, uniqueValues } from './ruleEngine';

export type ProgramAdvisorInput = {
  exercises: Exercise[];
  program: TrainingProgram;
  workouts: Workout[];
};

export type ProgramAdvisorResult = {
  coverage: {
    assignedDays: number;
    missingMuscleGroups: string[];
    workoutNames: string[];
  };
  improvementOpportunities: string[];
  primaryRecommendation: string;
  recommendations: DeterministicRecommendation[];
  status: 'ready' | 'needs-attention';
  warnings: string[];
};

export const getProgramAdvisor = ({ exercises, program, workouts }: ProgramAdvisorInput): ProgramAdvisorResult => {
  const overview = getTrainingProgramOverview(program, workouts, exercises);
  const validation = getTrainingProgramValidation(program, workouts, exercises);

  const recommendations: DeterministicRecommendation[] = [
    ...(validation.some((warning) => warning.id === 'empty-days')
      ? [
          {
            id: 'empty-day',
            title: 'Fill empty training days',
            detail: 'At least one day in the program has no exercises assigned.',
            priority: 100,
            tone: 'warning' as const,
          },
        ]
      : []),
    ...(validation.some((warning) => warning.id === 'missing-muscles')
      ? [
          {
            id: 'missing-muscle-groups',
            title: 'Cover missing muscle groups',
            detail: `Missing coverage: ${overview.missingMuscleGroups.join(', ')}.`,
            priority: 95,
            tone: 'warning' as const,
          },
        ]
      : []),
    ...(validation.some((warning) => warning.id === 'high-volume')
      ? [
          {
            id: 'high-volume',
            title: 'Reduce weekly volume',
            detail: 'Program volume is high enough to consider trimming sets.',
            priority: 90,
            tone: 'warning' as const,
          },
        ]
      : []),
    ...(validation.length === 0
      ? [
          {
            id: 'program-ready',
            title: 'Program looks ready',
            detail: 'The current layout is balanced and covers the available muscle groups.',
            priority: 50,
            tone: 'positive' as const,
          },
        ]
      : []),
  ].sort((left, right) => right.priority - left.priority);

  return {
    coverage: {
      assignedDays: program.days.filter((day) => Boolean(day.workoutTemplateId)).length,
      missingMuscleGroups: overview.missingMuscleGroups,
      workoutNames: uniqueValues(program.days.flatMap((day) => (day.workoutTemplateName ? [day.workoutTemplateName] : []))),
    },
    improvementOpportunities: uniqueValues([
      ...(overview.missingMuscleGroups.length > 0 ? overview.missingMuscleGroups.map((group) => `Add ${group.toLowerCase()} coverage`) : []),
      ...(validation.some((warning) => warning.id === 'empty-days') ? ['Assign workouts to empty days'] : []),
      ...(validation.some((warning) => warning.id === 'high-volume') ? ['Trim total weekly volume'] : []),
    ]),
    primaryRecommendation: recommendations[0]?.title ?? 'Program looks ready',
    recommendations,
    status: validation.length > 0 ? 'needs-attention' : 'ready',
    warnings: validation.map((warning) => warning.message),
  };
};
