export type ProfileGoalType = 'lose_fat' | 'maintain' | 'gain_muscle';
export type ProfileCalculationSex = 'male' | 'female';
export type ProfileTrainingExperience = 'beginner' | 'intermediate' | 'advanced';

export type ProfileState = {
  height: string;
  weight: string;
  goal: string;
  activityLevel: string;
  targetWeight: number;
  goalType: ProfileGoalType;
  weeklyWeightChangeGoal: number;
  trainingDaysPerWeek: number;
  dateOfBirth: string | null;
  calculationSex: ProfileCalculationSex | null;
  trainingExperience: ProfileTrainingExperience | null;
};
