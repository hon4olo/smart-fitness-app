import type { CustomFoodValidationErrors } from './addFoodModel';
import type { NutritionAddFoodCopy } from '@/localization/nutritionAddFoodCopy';

export const localizeCustomFoodErrors = (
  errors: CustomFoodValidationErrors,
  copy: NutritionAddFoodCopy,
): CustomFoodValidationErrors =>
  Object.fromEntries(
    Object.entries(errors).map(([field, message]) => {
      const localized =
        message === 'Enter a food name.'
          ? copy.validation.foodName
          : message === 'Enter a serving unit.'
            ? copy.validation.servingUnit
            : message === 'Use a number greater than 0.'
              ? copy.validation.greaterThanZero
              : message === 'Enter a number.'
                ? copy.validation.number
                : message === 'Use 0 or more.'
                  ? copy.validation.zeroOrMore
                  : message;
      return [field, localized];
    }),
  ) as CustomFoodValidationErrors;
