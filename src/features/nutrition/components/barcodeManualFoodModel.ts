import type { CreateCustomBarcodeFoodPayload } from '@/api/foods';
import type { NutritionAddFoodCopy } from '@/localization/nutritionAddFoodCopy';

export type BarcodeServingUnit = 'g' | 'ml';

export type BarcodeManualFormState = {
  name: string;
  brand: string;
  servingUnit: BarcodeServingUnit;
  calories: string;
  protein: string;
  fat: string;
  carbs: string;
};

export type BarcodeManualFormErrors = Partial<
  Record<keyof BarcodeManualFormState | 'form', string>
>;

export type BarcodeNutritionFieldKey = 'calories' | 'protein' | 'fat' | 'carbs';

export const EMPTY_BARCODE_MANUAL_FORM: BarcodeManualFormState = {
  name: '',
  brand: '',
  servingUnit: 'g',
  calories: '',
  protein: '',
  fat: '',
  carbs: '',
};

export const BARCODE_NUTRITION_FIELDS: Array<{
  key: BarcodeNutritionFieldKey;
  max: number;
}> = [
  { key: 'calories', max: 1000 },
  { key: 'protein', max: 100 },
  { key: 'fat', max: 100 },
  { key: 'carbs', max: 100 },
];

export const parseBarcodeManualNumber = (value: string): number | null => {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) return null;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

export const validateBarcodeManualForm = (
  form: BarcodeManualFormState,
  copy: NutritionAddFoodCopy,
): BarcodeManualFormErrors => {
  const errors: BarcodeManualFormErrors = {};

  if (!form.name.trim()) errors.name = copy.scanner.required;

  for (const field of BARCODE_NUTRITION_FIELDS) {
    const value = parseBarcodeManualNumber(form[field.key]);
    const label = copy.scanner.fieldLabels[field.key];
    if (value === null) {
      errors[field.key] = copy.scanner.required;
    } else if (value < 0) {
      errors[field.key] = copy.scanner.zeroOrMore;
    } else if (value > field.max) {
      errors[field.key] = copy.scanner.max(label, field.max);
    }
  }

  return errors;
};

export const hasBarcodeManualFormErrors = (
  errors: BarcodeManualFormErrors,
): boolean => Object.keys(errors).length > 0;

export const createBarcodeManualFoodPayload = (
  form: BarcodeManualFormState,
): CreateCustomBarcodeFoodPayload => ({
  name: form.name.trim(),
  brand: form.brand.trim() || undefined,
  servingUnit: form.servingUnit,
  caloriesPer100g: parseBarcodeManualNumber(form.calories) ?? 0,
  proteinPer100g: parseBarcodeManualNumber(form.protein) ?? 0,
  fatPer100g: parseBarcodeManualNumber(form.fat) ?? 0,
  carbsPer100g: parseBarcodeManualNumber(form.carbs) ?? 0,
});
