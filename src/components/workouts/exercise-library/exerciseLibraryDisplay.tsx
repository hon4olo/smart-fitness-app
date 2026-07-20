import { Text } from 'react-native';

import type { Exercise } from '@/types';

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

export const getExerciseSummary = (exercise: Exercise) => {
  const primaryMuscles = uniqueStrings(exercise.primaryMuscles ?? []).map(titleCase);
  const secondaryMuscles = uniqueStrings(exercise.secondaryMuscles ?? []).map(titleCase);
  const equipment = uniqueStrings(exercise.equipment ?? []).map(titleCase);

  return {
    equipment,
    primaryMuscles,
    secondaryMuscles,
  };
};

export const getExerciseTypeLabel = (exercise: Exercise) => titleCase(exercise.exerciseType ?? '');
export const getDifficultyLabel = (exercise: Exercise) => titleCase(exercise.difficulty ?? '');

export const buildQueryHighlight = (text: string, query: string, styles: Record<string, any>) => {
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) {
    return <Text>{text}</Text>;
  }

  const tokens = uniqueStrings(normalizedQuery.split(/\s+/).filter((token) => token.length > 1)).sort((left, right) => right.length - left.length);
  const lowerText = text.toLowerCase();

  let bestIndex = -1;
  let bestToken = '';

  tokens.forEach((token) => {
    const index = lowerText.indexOf(token);

    if (index !== -1 && (bestIndex === -1 || index < bestIndex)) {
      bestIndex = index;
      bestToken = token;
    }
  });

  if (bestIndex === -1) {
    return <Text>{text}</Text>;
  }

  const matchEnd = bestIndex + bestToken.length;

  return (
    <Text>
      {text.slice(0, bestIndex)}
      <Text style={styles.highlight}>{text.slice(bestIndex, matchEnd)}</Text>
      {text.slice(matchEnd)}
    </Text>
  );
};
