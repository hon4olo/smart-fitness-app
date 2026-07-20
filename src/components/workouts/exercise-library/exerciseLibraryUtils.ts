import type { Exercise } from '@/types';
import { matchesExerciseQuery } from '@/data/exercises';

export type FilterValue = 'all' | string;

export const FILTER_ALL: FilterValue = 'all';
export const DIFFICULTY_FILTERS = ['beginner', 'intermediate', 'advanced'] as const;
export const EXERCISE_TYPE_FILTERS = ['compound', 'isolation', 'cardio', 'mobility', 'skill'] as const;

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const titleCase = (value: string) =>
  normalize(value)
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const uniqueStrings = (values: Array<string | undefined | null>) =>
  Array.from(new Set(values.filter((value): value is string => Boolean(value)).map((value) => value.trim()).filter(Boolean)));

export const formatFilterLabel = (value: string) => titleCase(value) || value;

const isFieldMatch = (value: string, query: string) => normalize(value).includes(normalize(query));

export const getFacetOptions = (exercises: Exercise[]) => {
  const muscles = uniqueStrings(exercises.flatMap((exercise) => [exercise.muscleGroup, ...(exercise.primaryMuscles ?? []), ...(exercise.secondaryMuscles ?? [])]))
    .map(titleCase)
    .sort((left, right) => left.localeCompare(right));
  const equipment = uniqueStrings(exercises.flatMap((exercise) => exercise.equipment ?? [])).map(titleCase).sort((left, right) => left.localeCompare(right));

  return { equipment, muscles };
};

export const matchesFacet = (exercise: Exercise, facet: FilterValue, facetType: 'muscle' | 'equipment' | 'difficulty' | 'exerciseType') => {
  if (facet === FILTER_ALL) {
    return true;
  }

  if (facetType === 'difficulty') {
    return normalize(exercise.difficulty ?? '') === normalize(facet);
  }

  if (facetType === 'exerciseType') {
    return normalize(exercise.exerciseType ?? '') === normalize(facet);
  }

  if (facetType === 'muscle') {
    return matchesExerciseQuery(exercise, facet) || isFieldMatch(exercise.muscleGroup ?? '', facet);
  }

  return matchesExerciseQuery(exercise, facet);
};
