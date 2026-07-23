import type { Exercise as DomainExercise } from '@/domain/models';

export type WorkoutRpe = 6 | 6.5 | 7 | 7.5 | 8 | 8.5 | 9 | 9.5 | 10;

export type WorkoutPrescriptionSet = {
  sourceSetId?: string;
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  targetRpe: WorkoutRpe;
  adjustment?: 'decrease' | 'maintain' | 'increase';
  rationaleCode?: string;
};

export type WorkoutCoachMetadata = {
  schemaVersion: 1;
  runId: string;
  sourceSessionId: string;
  strategy: 'deload' | 'maintain' | 'progress';
  confirmedAt: string;
};

export type Workout = {
  id: string;
  title: string;
  description?: string;
  duration: string;
  exercises: Exercise[];
  prescription?: WorkoutPrescriptionSet[];
  coachMetadata?: WorkoutCoachMetadata;
  createdAt?: string;
  isCustom?: boolean;
};

export type Exercise = DomainExercise;

export type WorkoutSet = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  completed?: boolean;
  targetRpe?: WorkoutRpe;
  actualRpe?: WorkoutRpe;
};

export type WorkoutSafetyReviewStatus = 'ready' | 'needs_input' | 'modify' | 'blocked';
export type WorkoutSafetyGateKind =
  | 'review_missing'
  | 'review_stale'
  | 'ready'
  | 'confirmation_required';

export type WorkoutSafetyRestriction = {
  limitationId: string;
  bodyRegion: string;
  side: 'left' | 'right' | 'bilateral' | 'midline' | 'not_applicable';
  severity: 'mild' | 'moderate' | 'severe';
  action: 'monitor' | 'reduce_load' | 'avoid_movement' | 'pause_training';
  movementPatterns: string[];
  maximumLoadMultiplier: number;
};

export type WorkoutSafetyIssue = {
  code: string;
  severity: 'input_required' | 'warning' | 'modify' | 'hard_block';
  message: string;
};

export type WorkoutSafetyMetadata = {
  schemaVersion: 1;
  gateKind: WorkoutSafetyGateKind;
  acknowledgedAt: string;
  acknowledgementRequired: boolean;
  explicitlyAcknowledged: boolean;
  reviewRunId: string | null;
  reviewStatus: WorkoutSafetyReviewStatus | null;
  sourceFingerprint: string | null;
  recommendedLoadMultiplier: number | null;
  restrictions: WorkoutSafetyRestriction[];
  issues: WorkoutSafetyIssue[];
};

export type WorkoutSession = {
  id: string;
  workoutId: string;
  workoutTitle: string;
  startedAt: string;
  finishedAt: string;
  sets: WorkoutSet[];
  notes?: string;
  photoUri?: string;
  safetyRecovery?: WorkoutSafetyMetadata;
};
