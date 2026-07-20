import { TextInput, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';

type CreateFoodInlineFormProps = {
  colors: Record<string, any>;
  foodBrand: string;
  foodCalories: string;
  foodCarbs: string;
  foodFats: string;
  foodName: string;
  foodProtein: string;
  foodQuantity: string;
  foodServingSize: string;
  foodServingUnit: string;
  onSave: () => void;
  setFoodBrand: (value: string) => void;
  setFoodCalories: (value: string) => void;
  setFoodCarbs: (value: string) => void;
  setFoodFats: (value: string) => void;
  setFoodName: (value: string) => void;
  setFoodProtein: (value: string) => void;
  setFoodQuantity: (value: string) => void;
  setFoodServingSize: (value: string) => void;
  setFoodServingUnit: (value: string) => void;
  styles: Record<string, any>;
};

export function CreateFoodInlineForm({
  colors,
  foodBrand,
  foodCalories,
  foodCarbs,
  foodFats,
  foodName,
  foodProtein,
  foodQuantity,
  foodServingSize,
  foodServingUnit,
  onSave,
  setFoodBrand,
  setFoodCalories,
  setFoodCarbs,
  setFoodFats,
  setFoodName,
  setFoodProtein,
  setFoodQuantity,
  setFoodServingSize,
  setFoodServingUnit,
  styles,
}: CreateFoodInlineFormProps) {
  return (
    <View style={styles.inlineForm}>
      <TextInput
        accessibilityLabel="Food name"
        autoCapitalize="words"
        onChangeText={setFoodName}
        placeholder="Food name"
        placeholderTextColor={colors.textSecondary}
        style={styles.input}
        value={foodName}
      />
      <TextInput
        accessibilityLabel="Brand"
        autoCapitalize="words"
        onChangeText={setFoodBrand}
        placeholder="Brand (optional)"
        placeholderTextColor={colors.textSecondary}
        style={styles.input}
        value={foodBrand}
      />
      <View style={styles.grid}>
        <TextInput
          accessibilityLabel="Serving size"
          keyboardType="decimal-pad"
          onChangeText={setFoodServingSize}
          placeholder="Serving size"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
          value={foodServingSize}
        />
        <TextInput
          accessibilityLabel="Serving unit"
          onChangeText={setFoodServingUnit}
          placeholder="Serving unit"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
          value={foodServingUnit}
        />
      </View>
      <TextInput
        accessibilityLabel="Quantity"
        keyboardType="decimal-pad"
        onChangeText={setFoodQuantity}
        placeholder="Quantity"
        placeholderTextColor={colors.textSecondary}
        style={styles.input}
        value={foodQuantity}
      />
      <View style={styles.grid}>
        <TextInput
          accessibilityLabel="Calories"
          keyboardType="decimal-pad"
          onChangeText={setFoodCalories}
          placeholder="Calories"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
          value={foodCalories}
        />
        <TextInput
          accessibilityLabel="Protein"
          keyboardType="decimal-pad"
          onChangeText={setFoodProtein}
          placeholder="Protein"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
          value={foodProtein}
        />
      </View>
      <View style={styles.grid}>
        <TextInput
          accessibilityLabel="Carbs"
          keyboardType="decimal-pad"
          onChangeText={setFoodCarbs}
          placeholder="Carbs"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
          value={foodCarbs}
        />
        <TextInput
          accessibilityLabel="Fats"
          keyboardType="decimal-pad"
          onChangeText={setFoodFats}
          placeholder="Fats"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
          value={foodFats}
        />
      </View>
      <AppButton label="Add food" onPress={onSave} />
    </View>
  );
}
