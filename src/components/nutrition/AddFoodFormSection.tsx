import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing } from '@/constants/theme';
import type { FoodEntry, MealType } from '@/context/AppContext';

type FoodSearchResult = {
  brandName?: string;
  calories: number;
  carbs: number;
  fats: number;
  name: string;
  protein: number;
  servingSize?: number;
  servingUnit?: string;
  source: FoodEntry['source'];
};

type AddFoodFormSectionProps = {
  calories: string;
  carbs: string;
  currentMealTotalLabel: string;
  editingFoodEntry?: FoodEntry;
  fats: string;
  filteredFoods: FoodSearchResult[];
  foodSearchQuery: string;
  isExpanded: boolean;
  isSaveDisabled: boolean;
  isSearchExpanded: boolean;
  mealType: MealType;
  mealTypeLabels: Record<MealType, string>;
  onCaloriesChange: (value: string) => void;
  onCarbsChange: (value: string) => void;
  onCancelEdit: () => void;
  onFatsChange: (value: string) => void;
  onFoodSearchQueryChange: (value: string) => void;
  onMealTypeChange: (value: MealType) => void;
  onNameChange: (value: string) => void;
  onProteinChange: (value: string) => void;
  onQuantityChange: (value: string) => void;
  onSaveFood: () => void;
  onServingSizeChange: (value: string) => void;
  onServingUnitChange: (value: string) => void;
  onToggleExpanded: () => void;
  onToggleSearchExpanded: () => void;
  onUseFood: (food: FoodSearchResult) => void;
  protein: string;
  quantity: string;
  servingSize: string;
  servingUnit: string;
  name: string;
};

export function AddFoodFormSection({
  calories,
  carbs,
  editingFoodEntry,
  fats,
  filteredFoods,
  foodSearchQuery,
  isExpanded,
  isSaveDisabled,
  isSearchExpanded,
  mealType,
  mealTypeLabels,
  onCaloriesChange,
  onCarbsChange,
  onCancelEdit,
  onFatsChange,
  onFoodSearchQueryChange,
  onMealTypeChange,
  onNameChange,
  onProteinChange,
  onQuantityChange,
  onSaveFood,
  onServingSizeChange,
  onServingUnitChange,
  onToggleExpanded,
  onToggleSearchExpanded,
  onUseFood,
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

          <Pressable onPress={onToggleSearchExpanded} style={styles.collapsibleHeader}>
            <Text selectable style={styles.sectionTitle}>
              {`Search food ${isSearchExpanded ? '−' : '+'}`}
            </Text>
          </Pressable>

          {isSearchExpanded ? (
            <>
              <Text selectable style={styles.helperText}>
                Search by name or brand, then tap Use.
              </Text>
              <View style={styles.inputGroup}>
                <TextInput
                  onChangeText={onFoodSearchQueryChange}
                  placeholder="Search name or brand"
                  placeholderTextColor={Colors.dark.textSecondary}
                  style={styles.input}
                  value={foodSearchQuery}
                />
              </View>

              {filteredFoods.length === 0 ? (
                <Text selectable style={styles.helperText}>
                  No results yet.
                </Text>
              ) : null}

              {filteredFoods.map((food) => (
                <View key={`${food.name}-${food.servingUnit}`} style={styles.searchResult}>
                  <View style={styles.searchResultContent}>
                    <Text selectable style={styles.foodName}>
                      {food.name}
                    </Text>
                    {food.brandName ? (
                      <Text selectable style={styles.foodBrand}>
                        {food.brandName}
                      </Text>
                    ) : null}
                    <Text selectable style={styles.foodMeta}>
                      {food.calories} kcal / {food.protein} g protein / {food.carbs} g carbs / {food.fats} g fats
                    </Text>
                    <Text selectable style={styles.foodServing}>
                      Serving: {[food.servingSize, food.servingUnit].filter(Boolean).join(' ')}
                    </Text>
                  </View>
                  <AppButton label="Use" onPress={() => onUseFood(food)} variant="secondary" />
                </View>
              ))}
            </>
          ) : null}

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
  helperText: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: Spacing.two,
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
  foodBrand: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  foodMeta: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
    lineHeight: 20,
  },
  foodName: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
    width: '100%',
  },
  foodServing: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  searchResult: {
    borderColor: Colors.dark.border,
    borderTopWidth: 1,
    gap: Spacing.two,
    paddingTop: Spacing.three,
  },
  searchResultContent: {
    gap: Spacing.one,
  },
  sectionTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '800',
  },
});