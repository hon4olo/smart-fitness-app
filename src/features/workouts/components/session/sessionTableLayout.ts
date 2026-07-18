export const SESSION_TABLE_COLUMNS = {
  set: 34,
  previous: 94,
  weight: 50,
  reps: 50,
  completion: 36,
} as const;

export const SESSION_TABLE_TOTAL_WIDTH =
  SESSION_TABLE_COLUMNS.set +
  SESSION_TABLE_COLUMNS.previous +
  SESSION_TABLE_COLUMNS.weight +
  SESSION_TABLE_COLUMNS.reps +
  SESSION_TABLE_COLUMNS.completion;
