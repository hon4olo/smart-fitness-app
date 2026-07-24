import { Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import type { CustomFoodValidationErrors } from '@/features/nutrition/addFoodModel';

type CreateFoodInlineFormProps = {
  colors: Record<string, any>;
  errors: CustomFoodValidationErrors;
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
  errors,
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
    <AppCard style={styles.customFoodCard}>
      <View style={styles.sectionHeader}>
        <Text selectable style={styles.sectionTitle}>
          Create food
        </Text>
        <Text selectable style={styles.helperText}>
          Enter nutrition values for one serving, then choose the amount to add.
        </Text>
      </View>

      <View style={styles.fieldGroup}>
        <Text selectable style={styles.fieldLabel}>
          Food name
        </Text>
        <TextInput
          accessibilityLabel="Food name"
          autoCapitalize="words"
          onChangeText={setFoodName}
          placeholder="Example: Greek yogurt"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
          value={foodName}
        />
        {errors.name ? <Text style={styles.formErrorText}>{errors.name}</Text> : null}
      </View>

      <View style={styles.fieldGroup}>
        <Text selectable style={styles.fieldLabel}>
          Brand
        </Text>
        <TextInput
          accessibilityLabel="Brand"
          autoCapitalize="words"
          onChangeText={setFoodBrand}
          placeholder="Optional"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
          value={foodBrand}
        />
      </View>

      <View style={styles.grid}>
        <View style={styles.gridField}>
          <Text selectable style={styles.fieldLabel}>
            Serving size
          </Text>
          <TextInput
            accessibilityLabel="Serving size"
            keyboardType="decimal-pad"
            onChangeText={setFoodServingSize}
            placeholder="100"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={foodServingSize}
          />
          {errors.servingSize ? (
            <Text style={styles.formErrorText}>{errors.servingSize}</Text>
          ) : null}
        </View>
        <View style={styles.gridField}>
          <Text selectable style={styles.fieldLabel}>
            Unit
          </Text>
          <TextInput
            accessibilityLabel="Serving unit"
            autoCapitalize="none"
            onChangeText={setFoodServingUnit}
            placeholder="g"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={foodServingUnit}
          />
          {errors.servingUnit ? (
            <Text style={styles.formErrorText}>{errors.servingUnit}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text selectable style={styles.fieldLabel}>
          Amount to add
        </Text>
        <TextInput
          accessibilityLabel="Quantity"
          keyboardType="decimal-pad"
          onChangeText={setFoodQuantity}
          placeholder="100"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
          value={foodQuantity}
        />
        {errors.quantity ? <Text style={styles.formErrorText}>{errors.quantity}</Text> : null}
      </View>

      <View style={styles.grid}>
        <View style={styles.gridField}>
          <Text selectable style={styles.fieldLabel}>
            Calories
          </Text>
          <TextInput
            accessibilityLabel="Calories"
            keyboardType="decimal-pad"
            onChangeText={setFoodCalories}
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={foodCalories}
          />
          {errors.calories ? <Text style={styles.formErrorText}>{errors.calories}</Text> : null}
        </View>
        <View style={styles.gridField}>
          <Text selectable style={styles.fieldLabel}>
            Protein, g
          </Text>
          <TextInput
            accessibilityLabel="Protein"
            keyboardType="decimal-pad"
            onChangeText={setFoodProtein}
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={foodProtein}
          />
          {errors.protein ? <Text style={styles.formErrorText}>{errors.protein}</Text> : null}
        </View>
      </View>

      <View style={styles.grid}>
        <View style={styles.gridField}>
          <Text selectable style={styles.fieldLabel}>
            Carbs, g
          </Text>
          <TextInput
            accessibilityLabel="Carbs"
            keyboardType="decimal-pad"
            onChangeText={setFoodCarbs}
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={foodCarbs}
          />
          {errors.carbs ? <Text style={styles.formErrorText}>{errors.carbs}</Text> : null}
        </View>
        <View style={styles.gridField}>
          <Text selectable style={styles.fieldLabel}>
            Fats, g
          </Text>
          <TextInput
            accessibilityLabel="Fats"
            keyboardType="decimal-pad"
            onChangeText={setFoodFats}
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={foodFats}
          />
          {errors.fats ? <Text style={styles.formErrorText}>{errors.fats}</Text> : null}
        </View>
      </View>

      <AppButton label="Add food" onPress={onSave} />
    </AppCard>
  );
}