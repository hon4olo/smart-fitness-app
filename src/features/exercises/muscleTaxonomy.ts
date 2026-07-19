export type MuscleSide = 'front' | 'back';

export type CanonicalMuscleId =
  | 'chest'
  | 'front-delts'
  | 'side-delts'
  | 'rear-delts'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'obliques'
  | 'lats'
  | 'traps'
  | 'lower-back'
  | 'glutes'
  | 'quads'
  | 'hamstrings'
  | 'calves';

export type MuscleHighlightRole = 'primary' | 'secondary';

export type MuscleHighlightMap = Partial<Record<CanonicalMuscleId, MuscleHighlightRole>>;

export type CanonicalMuscle = {
  id: CanonicalMuscleId;
  label: string;
  side: MuscleSide;
};

export const CANONICAL_MUSCLES: CanonicalMuscle[] = [
  { id: 'chest', label: 'Chest', side: 'front' },
  { id: 'front-delts', label: 'Front delts', side: 'front' },
  { id: 'side-delts', label: 'Side delts', side: 'front' },
  { id: 'rear-delts', label: 'Rear delts', side: 'back' },
  { id: 'biceps', label: 'Biceps', side: 'front' },
  { id: 'triceps', label: 'Triceps', side: 'back' },
  { id: 'forearms', label: 'Forearms', side: 'front' },
  { id: 'abs', label: 'Abs', side: 'front' },
  { id: 'obliques', label: 'Obliques', side: 'front' },
  { id: 'lats', label: 'Lats', side: 'back' },
  { id: 'traps', label: 'Traps', side: 'back' },
  { id: 'lower-back', label: 'Lower back', side: 'back' },
  { id: 'glutes', label: 'Glutes', side: 'back' },
  { id: 'quads', label: 'Quads', side: 'front' },
  { id: 'hamstrings', label: 'Hamstrings', side: 'back' },
  { id: 'calves', label: 'Calves', side: 'back' },
];

export const MUSCLE_ALIASES: Record<string, CanonicalMuscleId> = {
  abdominal: 'abs',
  abdominals: 'abs',
  abs: 'abs',
  adductors: 'quads',
  back: 'lats',
  biceps: 'biceps',
  brachialis: 'biceps',
  calves: 'calves',
  chest: 'chest',
  core: 'abs',
  delts: 'side-delts',
  forearms: 'forearms',
  'front delts': 'front-delts',
  'front shoulders': 'front-delts',
  glute: 'glutes',
  glutes: 'glutes',
  hamstrings: 'hamstrings',
  lats: 'lats',
  'lower back': 'lower-back',
  'lower chest': 'chest',
  obliques: 'obliques',
  quads: 'quads',
  quadriceps: 'quads',
  'rear delts': 'rear-delts',
  shoulders: 'side-delts',
  traps: 'traps',
  trapezius: 'traps',
  triceps: 'triceps',
  'upper back': 'traps',
  'upper chest': 'chest',
};

const normalizeMuscleName = (value: string) =>
  value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

export const mapMuscleNameToCanonicalId = (name: string): CanonicalMuscleId | null => {
  const normalized = normalizeMuscleName(name);
  return MUSCLE_ALIASES[normalized] ?? null;
};

export const mapMuscleNamesToCanonicalIds = (names: string[]) =>
  Array.from(new Set(names.map(mapMuscleNameToCanonicalId).filter((id): id is CanonicalMuscleId => Boolean(id))));

export const buildMuscleHighlights = (primaryMuscles: string[], secondaryMuscles: string[]): MuscleHighlightMap => {
  const highlights: MuscleHighlightMap = {};

  for (const id of mapMuscleNamesToCanonicalIds(secondaryMuscles)) {
    highlights[id] = 'secondary';
  }

  for (const id of mapMuscleNamesToCanonicalIds(primaryMuscles)) {
    highlights[id] = 'primary';
  }

  return highlights;
};
