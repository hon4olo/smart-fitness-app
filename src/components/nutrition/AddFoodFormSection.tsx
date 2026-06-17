import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing } from '@/constants/theme';
import type { FoodEntry, MealType } from '@/context/AppContext';

type AddFoodFormSectionProps = {
  calories: string;
  carbs: string;
  editingFoodEntry?: FoodEntry;
  fats: string;
  isExpanded: boolean;
  isSaveDisabled: boolean;
  mealType: MealType;
  mealTypeLabels: Record<MealType, string>;
  onCaloriesChange: (value: string) => void;
  onCarbsChange: (value: string) => void;
  onCancelEdit: () => void;
  onFatsChange: (value: string) => void;
  onMealTypeChange: (value: MealType) => void;
  onNameChange: (value: string) => void;
  onProteinChange: (value: string) => void;
  onQuantityChange: (value: string) => void;
  onSaveFood: () => void;
  onServingSizeChange: (value: string) => void;
  onServingUnitChange: (value: string) => void;
  onToggleExpanded: () => void;
  protein: string;
  quantity: string;
  servingSize: string;
  servingUnit: string;
  currentMealTotalLabel: string;
  name: string;
};

export function AddFoodFormSection({
  calories,
  carbs,
  editingFoodEntry,
  fats,
  isExpanded,
  isSaveDisabled,
  mealType,
  mealTypeLabels,
  onCaloriesChange,
  onCarbsChange,
  onCancelEdit,
  onFatsChange,
  onMealTypeChange,
  onNameChange,
  onProteinChange,
  onQuantityChange,
  onSaveFood,
  onServingSizeChange,
  onServingUnitChange,
  onToggleExpanded,
  protein,
  quantity,
  servingSize,
  servingUnit,
  currentMealTotalLabel,
  name,
}: AddFoodFormSectionProps) {
  return (
    <AppCard>
      <Pressable onPress={onToggleExpanded} style={styles.collapsibleHeader}>
        <Text selectable style={styles.sectionTitle}>
          {`${editingFoodEntry ? 'Edit Food' : 'Add Food form'} ${isExpanded ? '−' : '+'}`}
        </Text>
      </Pressable>

      {isExpanded ? (
        <>
          <View style={styles.inputGroup}>
            <Text selectable style={styles.inputLabel}>
              Name
            </Text>
            <TextInput
              onChangeText={onNameChange}
              placeholder="Food name"
              placeholderTextColor={Colors.dark.textSecondary}
              style={styles.input}
              value={name}
            />
          </View>

          <Text selectable style={styles.inputLabel}>
            Meal type
          </Text>
          <View style={styles.mealTypeRow}>
            {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((type) => (
              <AppButton
                key={type}
                label={mealTypeLabels[type]}
                onPress={() => onMealTypeChange(type)}
                variant={mealType === type ? 'primary' : 'secondary'}
              />
            ))}
          </View>

          <View style={styles.mealSummary}>
            <Text selectable style={styles.remainingValue}>
              Current {mealTypeLabels[mealType]} total: {currentMealTotalLabel}
            </Text>
          </View>

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

          <AppButton disabled={isSaveDisabled} label="Save Food" onPress={onSaveFood} />
          {editingFoodEntry ? <AppButton label="Cancel Edit" onPress={onCancelEdit} variant="secondary" /> : null}
        </>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  collapsibleHeader: {
    paddingBottom: Spacing.two,
  },
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
  mealSummary: {
    marginBottom: Spacing.two,
  },
  mealTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.two,
    marginTop: Spacing.one,
  },
  remainingValue: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    width: '100%',
  },
  sectionTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '800',
  },
});
