export type ProfileGoalType = 'lose_fat' | 'maintain' | 'gain_muscle';

export type ProfileState = {
  height: string;
  weight: string;
  goal: string;
  activityLevel: string;
  targetWeight: number;
  goalType: ProfileGoalType;
  weeklyWeightChangeGoal: number;
  trainingDaysPerWeek: number;
};
