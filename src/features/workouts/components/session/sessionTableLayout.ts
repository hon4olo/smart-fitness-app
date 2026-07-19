export const SESSION_TABLE_COLUMNS = {
  set: 24,
  previous: 68,
  weight: 76,
  reps: 76,
  completion: 30,
} as const;

export const SESSION_TABLE_GAPS = {
  setToPrevious: 29,
  previousToWeight: 15,
  weightToReps: 16,
  repsToCompletion: 24,
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
