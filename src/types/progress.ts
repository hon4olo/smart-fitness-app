export type WeightEntry = {
  id: string;
  date: string;
  weight: number;
  createdAt: string;
};

export type BodyMeasurementMetric =
  | 'waist'
  | 'chest'
  | 'hips'
  | 'shoulders'
  | 'neck'
  | 'upper_arm'
  | 'thigh'
  | 'calf'
  | 'body_fat'
  | 'custom';

export type BodyMeasurementUnit = 'cm' | 'in' | 'percent';

export type BodyMeasurement = {
  id: string;
  label: string;
  value: string;
  createdAt: string;
  metric?: BodyMeasurementMetric;
  numericValue?: number;
  unit?: BodyMeasurementUnit;
};
