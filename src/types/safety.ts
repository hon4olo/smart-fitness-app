export type UserLimitationKind =
  | 'injury'
  | 'pain'
  | 'mobility'
  | 'medical_restriction'
  | 'other';

export type UserLimitationBodyRegion =
  | 'neck'
  | 'shoulder'
  | 'elbow'
  | 'wrist_hand'
  | 'upper_back'
  | 'lower_back'
  | 'hip'
  | 'knee'
  | 'ankle_foot'
  | 'chest'
  | 'abdomen'
  | 'systemic'
  | 'other';

export type UserLimitationSide =
  | 'left'
  | 'right'
  | 'bilateral'
  | 'midline'
  | 'not_applicable';

export type UserLimitationSeverity = 'mild' | 'moderate' | 'severe';
export type UserLimitationStatus = 'active' | 'resolved';
export type UserLimitationTrainingImpact =
  | 'monitor'
  | 'reduce_load'
  | 'avoid_movement'
  | 'pause_training';

export type UserLimitationMovementPattern =
  | 'squat'
  | 'hinge'
  | 'lunge'
  | 'horizontal_push'
  | 'vertical_push'
  | 'horizontal_pull'
  | 'vertical_pull'
  | 'carry'
  | 'rotation'
  | 'locomotion'
  | 'impact'
  | 'overhead'
  | 'spinal_flexion'
  | 'spinal_extension'
  | 'other';

export type UserLimitation = {
  id: string;
  kind: UserLimitationKind;
  bodyRegion: UserLimitationBodyRegion;
  side: UserLimitationSide;
  severity: UserLimitationSeverity;
  status: UserLimitationStatus;
  trainingImpact: UserLimitationTrainingImpact;
  movementPatterns: UserLimitationMovementPattern[];
  onsetDate: string | null;
  resolvedDate: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type RecoveryScaleOneToFive = 1 | 2 | 3 | 4 | 5;
export type RecoveryScaleZeroToFive = 0 | 1 | 2 | 3 | 4 | 5;

export type RecoveryCheckIn = {
  id: string;
  recordedAt: string;
  sleepDurationHours: number | null;
  sleepQuality: RecoveryScaleOneToFive | null;
  fatigue: RecoveryScaleOneToFive | null;
  soreness: RecoveryScaleZeroToFive | null;
  stress: RecoveryScaleOneToFive | null;
  painInterference: RecoveryScaleZeroToFive | null;
  readiness: RecoveryScaleOneToFive | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};
