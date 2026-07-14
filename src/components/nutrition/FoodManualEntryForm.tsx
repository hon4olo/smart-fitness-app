import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { ReactNode } from 'react';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing } from '@/constants/theme';
import type { MealType } from '@/context/AppContext';
import type { FoodEntry } from '@/context/AppContext';
import { MealTypeSelector } from '@/components/nutrition/MealTypeSelector';
import { FoodServingInputs } from '@/components/nutrition/FoodServingInputs';

type AddFoodFormSectionSharedProps = {
  calories: string;
  currentMealTotalLabel: string;
  editingFoodEntry?: FoodEntry;
  carbs: string;
  fats: string;
  isExpanded: boolean;
  isSaveDisabled: boolean;
  mealType: MealType;
  mealTypeLabels: Record<MealType, string>;
  name: string;
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
};

type FoodManualEntryFormProps = AddFoodFormSectionSharedProps & {
  children?: ReactNode;
};

export function FoodManualEntryForm({
  calories,
  currentMealTotalLabel,
  editingFoodEntry,
  carbs,
  fats,
  isExpanded,
  isSaveDisabled,
  mealType,
  mealTypeLabels,
  name,
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
  children,
}: FoodManualEntryFormProps) {
  return (
    <AppCard>
      <Pressable onPress={onToggleExpanded} style={styles.collapsibleHeader}>
        <Text selectable style={styles.sectionTitle}>
          {`${editingFoodEntry ? 'Edit food' : 'Add food'} ${isExpanded ? '−' : '+'}`}
        </Text>
      </Pressable>

      {isExpanded ? (
        <>
          <Text selectable style={styles.helperText}>
            Log a custom food or make a quick edit without leaving the diary.
          </Text>

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
            Meal
          </Text>
          <MealTypeSelector mealType={mealType} mealTypeLabels={mealTypeLabels} onMealTypeChange={onMealTypeChange} />

          <View style={styles.mealSummary}>
            <Text selectable style={styles.remainingValue}>
              Current {mealTypeLabels[mealType]} total: {currentMealTotalLabel}
            </Text>
          </View>

          {children}

          <FoodServingInputs
            calories={calories}
            carbs={carbs}
            fats={fats}
            onCaloriesChange={onCaloriesChange}
            onCarbsChange={onCarbsChange}
            onFatsChange={onFatsChange}
            onProteinChange={onProteinChange}
            onQuantityChange={onQuantityChange}
            onServingSizeChange={onServingSizeChange}
            onServingUnitChange={onServingUnitChange}
            protein={protein}
            quantity={quantity}
            servingSize={servingSize}
            servingUnit={servingUnit}
          />

          <AppButton disabled={isSaveDisabled} label="Save food" onPress={onSaveFood} />
          {editingFoodEntry ? <AppButton label="Cancel edit" onPress={onCancelEdit} variant="secondary" /> : null}
        </>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  collapsibleHeader: {
    paddingBottom: Spacing.two,
  },
  helperText: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: Spacing.two,
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
  inputGroup: {
    gap: Spacing.one,
  },
  inputLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  mealSummary: {
    marginBottom: Spacing.two,
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
