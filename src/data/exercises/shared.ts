import type { Exercise } from '@/domain/models';
export { createExercise } from '@/domain/models';

export const DEFAULT_EXERCISE_CREATED_AT = '2000-01-01T00:00:00.000Z';

const normalize = (value: string) => value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

export const exerciseSearchIndex = (exercise: Exercise) => {
  const fields = [
    exercise.id,
    exercise.name,
    exercise.category ?? '',
    exercise.muscleGroup ?? '',
    exercise.notes ?? '',
    ...(exercise.aliases ?? []),
    ...(exercise.primaryMuscles ?? []),
    ...(exercise.secondaryMuscles ?? []),
    ...(exercise.equipment ?? []),
    ...(exercise.movementPattern ?? []),
    ...(exercise.tags ?? []),
    ...(exercise.instructions ?? []),
    ...(exercise.tips ?? []),
    ...(exercise.commonMistakes ?? []),
  ];

  const normalized = fields.map(normalize).filter(Boolean);
  return {
    compact: normalized.join(' '),
    fields: normalized,
    raw: fields.map((value) => value.toLowerCase()),
  };
};

export const matchesExerciseQuery = (exercise: Exercise, query: string) => {
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) {
    return true;
  }

  const compactQuery = normalizedQuery.replace(/\s+/g, '');
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  const index = exerciseSearchIndex(exercise);
  const compactHaystack = index.compact.replace(/\s+/g, '');

  return tokens.every((token) => {
    const compactToken = token.replace(/\s+/g, '');

    return (
      index.compact.includes(token) ||
      compactHaystack.includes(compactToken) ||
      index.fields.some((field) => field.includes(token) || field.replace(/\s+/g, '').includes(compactToken)) ||
      index.raw.some((field) => field.includes(token) || field.replace(/\s+/g, '').includes(compactToken)) ||
      (compactQuery.length > 0 && compactHaystack.includes(compactQuery))
    );
  });
};

export const createExerciseLookup = (exercises: Exercise[]) => {
  const byId = new Map(exercises.map((exercise) => [exercise.id, exercise] as const));
  const byName = new Map(exercises.map((exercise) => [normalize(exercise.name), exercise] as const));
  const byAlias = new Map(
    exercises.flatMap((exercise) => (exercise.aliases ?? []).map((alias) => [normalize(alias), exercise] as const)),
  );

  return { byAlias, byId, byName };
};

export const mergeExerciseCatalog = (baseExercises: Exercise[], storedExercises: Exercise[] = []) => {
  const { byAlias, byId, byName } = createExerciseLookup(baseExercises);
  const merged = [...baseExercises];

  storedExercises.forEach((exercise) => {
    const aliases = exercise.aliases ?? [];
    const primaryMuscles = exercise.primaryMuscles ?? [];
    const secondaryMuscles = exercise.secondaryMuscles ?? [];
    const equipment = exercise.equipment ?? [];
    const movementPattern = exercise.movementPattern ?? [];
    const tags = exercise.tags ?? [];
    const instructions = exercise.instructions ?? [];
    const tips = exercise.tips ?? [];
    const commonMistakes = exercise.commonMistakes ?? [];
    const aliasMatch = aliases.map((alias) => byAlias.get(normalize(alias))).find(Boolean);
    const match = byId.get(exercise.id) ?? (!exercise.isCustom ? byName.get(normalize(exercise.name)) ?? aliasMatch : undefined);

    if (!match) {
      merged.push(exercise);
      return;
    }

    const index = merged.findIndex((item) => item.id === match.id);

    if (index === -1) {
      merged.push({ ...match, ...exercise });
      return;
    }

    merged[index] = {
      ...match,
      ...exercise,
      aliases: aliases.length > 0 ? aliases : (match.aliases ?? []),
      primaryMuscles: primaryMuscles.length > 0 ? primaryMuscles : (match.primaryMuscles ?? []),
      secondaryMuscles: secondaryMuscles.length > 0 ? secondaryMuscles : (match.secondaryMuscles ?? []),
      equipment: equipment.length > 0 ? equipment : (match.equipment ?? []),
      movementPattern: movementPattern.length > 0 ? movementPattern : (match.movementPattern ?? []),
      tags: tags.length > 0 ? tags : (match.tags ?? []),
      instructions: instructions.length > 0 ? instructions : (match.instructions ?? []),
      tips: tips.length > 0 ? tips : (match.tips ?? []),
      commonMistakes: commonMistakes.length > 0 ? commonMistakes : (match.commonMistakes ?? []),
      createdAt: exercise.createdAt ?? match.createdAt,
      muscleGroup: exercise.muscleGroup ?? match.muscleGroup,
      source: exercise.source ?? match.source,
      metadata: { ...(match.metadata ?? {}), ...(exercise.metadata ?? {}) },
      isCustom: exercise.isCustom ?? match.isCustom,
    };
  });

  return merged;
};
