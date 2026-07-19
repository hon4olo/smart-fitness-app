export const SESSION_TABLE_COLUMNS = {
  set: 24,
  previous: 68,
  weight: 92,
  reps: 92,
  completion: 30,
} as const;

export const SESSION_TABLE_GAPS = {
  setToPrevious: 23,
  previousToWeight: 8,
  weightToReps: 8,
  repsToCompletion: 13,
} as const;

export const SESSION_TABLE_TOTAL_WIDTH =
  SESSION_TABLE_COLUMNS.set +
  SESSION_TABLE_GAPS.setToPrevious +
  SESSION_TABLE_COLUMNS.previous +
  SESSION_TABLE_GAPS.previousToWeight +
  SESSION_TABLE_COLUMNS.weight +
  SESSION_TABLE_GAPS.weightToReps +
  SESSION_TABLE_COLUMNS.reps +
  SESSION_TABLE_GAPS.repsToCompletion +
  SESSION_TABLE_COLUMNS.completion;
