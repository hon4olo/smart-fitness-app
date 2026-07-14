import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';

type FoodServingInputsProps = {
  onCaloriesChange: (value: string) => void;
  onCarbsChange: (value: string) => void;
  onFatsChange: (value: string) => void;
  onProteinChange: (value: string) => void;
  onQuantityChange: (value: string) => void;
  onServingSizeChange: (value: string) => void;
  onServingUnitChange: (value: string) => void;
  calories: string;
  carbs: string;
  fats: string;
  protein: string;
  quantity: string;
  servingSize: string;
  servingUnit: string;
};

export function FoodServingInputs({
  onCaloriesChange,
  onCarbsChange,
  onFatsChange,
  onProteinChange,
  onQuantityChange,
  onServingSizeChange,
  onServingUnitChange,
  calories,
  carbs,
  fats,
  protein,
  quantity,
  servingSize,
  servingUnit,
}: FoodServingInputsProps) {
  return (
    <>
      <View style={styles.inputGrid}>
        <View style={styles.inputGroup}>
          <Text selectable style={styles.inputLabel}>
            Calories
          </Text>
          <TextInput
            keyboardType="decimal-pad"
            onChangeText={onCaloriesChange}
            placeholder="0"
            placeholderTextColor={Colors.dark.textSecondary}
            style={styles.input}
            value={calories}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text selectable style={styles.inputLabel}>
            Protein
          </Text>
          <TextInput
            keyboardType="decimal-pad"
            onChangeText={onProteinChange}
            placeholder="0"
            placeholderTextColor={Colors.dark.textSecondary}
            style={styles.input}
            value={protein}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text selectable style={styles.inputLabel}>
            Carbs
          </Text>
          <TextInput
            keyboardType="decimal-pad"
            onChangeText={onCarbsChange}
            placeholder="0"
            placeholderTextColor={Colors.dark.textSecondary}
            style={styles.input}
            value={carbs}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text selectable style={styles.inputLabel}>
            Fats
          </Text>
          <TextInput
            keyboardType="decimal-pad"
            onChangeText={onFatsChange}
            placeholder="0"
            placeholderTextColor={Colors.dark.textSecondary}
            style={styles.input}
            value={fats}
          />
        </View>
      </View>

      <View style={styles.inputGrid}>
        <View style={styles.inputGroup}>
          <Text selectable style={styles.inputLabel}>
            Serving size
          </Text>
          <TextInput
            keyboardType="decimal-pad"
            onChangeText={onServingSizeChange}
            placeholder="100"
            placeholderTextColor={Colors.dark.textSecondary}
            style={styles.input}
            value={servingSize}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text selectable style={styles.inputLabel}>
            Serving unit
          </Text>
          <TextInput
            onChangeText={onServingUnitChange}
            placeholder="g"
            placeholderTextColor={Colors.dark.textSecondary}
            style={styles.input}
            value={servingUnit}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text selectable style={styles.inputLabel}>
            Quantity
          </Text>
          <TextInput
            keyboardType="decimal-pad"
            onChangeText={onQuantityChange}
            placeholder="0"
            placeholderTextColor={Colors.dark.textSecondary}
            style={styles.input}
            value={quantity}
          />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: 1,
    color: Colors.dark.text,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: Spacing.two,
  },
  inputGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  inputGroup: {
    flex: 1,
    gap: Spacing.one,
    minWidth: 130,
  },
  inputLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
});
