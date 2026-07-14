import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { Colors, Spacing } from '@/constants/theme';
import type { MealType } from '@/context/AppContext';

type MealTypeSelectorProps = {
  mealType: MealType;
  mealTypeLabels: Record<MealType, string>;
  onMealTypeChange: (value: MealType) => void;
};

export function MealTypeSelector({ mealType, mealTypeLabels, onMealTypeChange }: MealTypeSelectorProps) {
  return (
    <View style={styles.container}>
      {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((type) => (
        <AppButton
          key={type}
          label={mealTypeLabels[type]}
          onPress={() => onMealTypeChange(type)}
          variant={mealType === type ? 'primary' : 'secondary'}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.two,
    marginTop: Spacing.one,
  },
});
