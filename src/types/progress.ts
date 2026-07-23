export type WeightEntry = {
  id: string;
  date: string;
  weight: number;
  createdAt: string;
};

export type BodyMeasurementKind =
  | 'waist'
  | 'chest'
  | 'hips'
  | 'neck'
  | 'upper_arm'
  | 'thigh'
  | 'calf'
  | 'body_fat'
  | 'custom';

export type BodyMeasurementUnit = 'cm' | 'in' | 'percent';

export type BodyMeasurement = {
  id: string;
  kind: BodyMeasurementKind;
  label: string;
  value: number;
  unit: BodyMeasurementUnit;
  createdAt: string;
};
