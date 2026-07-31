import type { SocialProfileDto } from './contracts';

export const SOCIAL_WORKOUT_POST_DTO_SCHEMA_VERSION = 1 as const;
export const SOCIAL_WORKOUT_SNAPSHOT_SCHEMA_VERSION = 1 as const;

export type SocialWorkoutPostSetDto = {
  weight?: number;
  reps?: number;
  rpe?: number;
};

export type SocialWorkoutPostExerciseDto = {
  name: string;
  sets?: SocialWorkoutPostSetDto[];
};

export type SocialWorkoutSnapshotDto = {
  schemaVersion: typeof SOCIAL_WORKOUT_SNAPSHOT_SCHEMA_VERSION;
  title?: string;
  durationMinutes?: number;
  exercises?: SocialWorkoutPostExerciseDto[];
  totalVolume?: number;
};

export type SocialWorkoutPostDto = {
  schemaVersion: typeof SOCIAL_WORKOUT_POST_DTO_SCHEMA_VERSION;
  id: string;
  author: SocialProfileDto;
  caption: string | null;
  workout: SocialWorkoutSnapshotDto;
  createdAt: string;
};

export type SocialWorkoutPostPageDto = {
  items: SocialWorkoutPostDto[];
  nextCursor: string | null;
};

export type SocialWorkoutShareControls = {
  title: boolean;
  duration: boolean;
  exercises: boolean;
  sets: boolean;
  load: boolean;
  repetitions: boolean;
  rpe: boolean;
  volume: boolean;
};

export type CreateSocialWorkoutPostInput = {
  sourceWorkoutSessionId: string;
  caption?: string | null;
  idempotencyKey: string;
  share: SocialWorkoutShareControls;
};

export type ListSocialWorkoutPostsInput = {
  limit?: number;
  cursor?: string;
};
