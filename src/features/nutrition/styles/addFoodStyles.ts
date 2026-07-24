import { Colors } from '@/constants/theme';

import { createAddFoodBaseStyles } from './addFoodBaseStyles';
import { createAddFoodScannerStyles } from './addFoodScannerStyles';
import { createAddFoodSheetStyles } from './addFoodSheetStyles';

export const createAddFoodStyles = (colors: typeof Colors.dark) => ({
  ...createAddFoodBaseStyles(colors),
  ...createAddFoodScannerStyles(colors),
  ...createAddFoodSheetStyles(colors),
});