import { Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import type { CustomFoodValidationErrors } from '@/features/nutrition/addFoodModel';
import { useLocalization } from '@/localization';
import { getNutritionAddFoodCopy } from '@/localization/nutritionAddFoodCopy';
import { useUnitPreferences } from '@/units';

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
  const { energy } = useUnitPreferences();
  const { locale } = useLocalization();
  const copy = getNutritionAddFoodCopy(locale);

  return (
    <AppCard style={styles.customFoodCard}>
      <View style={styles.sectionHeader}>
        <Text selectable style={styles.sectionTitle}>
          {copy.createFoodTitle}
        </Text>
        <Text selectable style={styles.helperText}>
          {copy.createFoodHint}
        </Text>
      </View>

      <View style={styles.fieldGroup}>
        <Text selectable style={styles.fieldLabel}>{copy.foodName}</Text>
        <TextInput
          accessibilityLabel={copy.foodName}
          autoCapitalize="words"
          onChangeText={setFoodName}
          placeholder={copy.foodExample}
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
          value={foodName}
        />
        {errors.name ? <Text style={styles.formErrorText}>{errors.name}</Text> : null}
      </View>

      <View style={styles.fieldGroup}>
        <Text selectable style={styles.fieldLabel}>{copy.brand}</Text>
        <TextInput
          accessibilityLabel={copy.brand}
          autoCapitalize="words"
          onChangeText={setFoodBrand}
          placeholder={copy.optional}
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
          value={foodBrand}
        />
      </View>

      <View style={styles.grid}>
        <View style={styles.gridField}>
          <Text selectable style={styles.fieldLabel}>{copy.servingSize}</Text>
          <TextInput
            accessibilityLabel={copy.servingSize}
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
          <Text selectable style={styles.fieldLabel}>{copy.unit}</Text>
          <TextInput
            accessibilityLabel={copy.servingUnit}
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
        <Text selectable style={styles.fieldLabel}>{copy.amountToAdd}</Text>
        <TextInput
          accessibilityLabel={copy.quantity}
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
          <Text selectable style={styles.fieldLabel}>{copy.energy}, {energy}</Text>
          <TextInput
            accessibilityLabel={`${copy.energy} (${energy})`}
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
          <Text selectable style={styles.fieldLabel}>{copy.protein}, g</Text>
          <TextInput
            accessibilityLabel={copy.protein}
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
          <Text selectable style={styles.fieldLabel}>{copy.carbs}, g</Text>
          <TextInput
            accessibilityLabel={copy.carbs}
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
          <Text selectable style={styles.fieldLabel}>{copy.fats}, g</Text>
          <TextInput
            accessibilityLabel={copy.fats}
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

      <AppButton label={copy.addFood} onPress={onSave} />
    </AppCard>
  );
}
