import { Pressable, Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { ListRow } from '@/components/ui/ListRow';
import { formatCompactMacroTotals, formatNumber, sumNutritionTotals } from '@/lib/nutrition';
import type { MealTemplate } from '@/types';

type SavedMealsModeSectionProps = {
  colors: Record<string, any>;
  createMealOpen: boolean;
  manageMealsOpen: boolean;
  mealTemplateName: string;
  mealTemplates: MealTemplate[];
  onDeleteMealTemplate: (templateId: string) => void;
  onQuickAddMealTemplate: (template: MealTemplate) => void;
  onSaveMealTemplate: () => void;
  onToggleCreateMeal: () => void;
  onToggleManageMeals: () => void;
  selectedMealLabel: string;
  setMealTemplateName: (value: string) => void;
  styles: Record<string, any>;
};

export function SavedMealsModeSection({
  colors,
  createMealOpen,
  manageMealsOpen,
  mealTemplateName,
  mealTemplates,
  onDeleteMealTemplate,
  onQuickAddMealTemplate,
  onSaveMealTemplate,
  onToggleCreateMeal,
  onToggleManageMeals,
  selectedMealLabel,
  setMealTemplateName,
  styles,
}: SavedMealsModeSectionProps) {
  return (
    <AppCard>
      <View style={styles.sectionHeader}>
        <Text selectable style={styles.sectionTitle}>
          Meals
        </Text>
      </View>

      <View style={styles.quietActionRow}>
        <Pressable accessibilityLabel="Create meal" hitSlop={10} onPress={onToggleCreateMeal} style={styles.quietActionButton}>
          <Text style={styles.quietActionText}>Create meal</Text>
        </Pressable>
        <Pressable accessibilityLabel="Manage meals" hitSlop={10} onPress={onToggleManageMeals} style={styles.quietActionButton}>
          <Text style={styles.quietActionText}>{manageMealsOpen ? 'Hide delete' : 'Manage meals'}</Text>
        </Pressable>
      </View>

      {createMealOpen ? (
        <View style={styles.inlineForm}>
          <TextInput
            accessibilityLabel="Meal name"
            autoCapitalize="words"
            onChangeText={setMealTemplateName}
            placeholder="Meal name"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={mealTemplateName}
          />
          <Text selectable style={styles.helperText}>
            Saves the current {selectedMealLabel.toLowerCase()} diary items as a reusable meal.
          </Text>
          <AppButton label="Save meal" onPress={onSaveMealTemplate} />
        </View>
      ) : null}

      {mealTemplates.length > 0 ? (
        <View style={styles.listGap}>
          {mealTemplates.map((template) => {
            const templateTotals = sumNutritionTotals(template.items);
            return (
              <ListRow
                key={template.id}
                accessibilityHint="Add this saved meal to the selected day and meal"
                detail={`${template.items.length} item${template.items.length === 1 ? '' : 's'} · ${formatCompactMacroTotals(templateTotals)}`}
                onPress={() => onQuickAddMealTemplate(template)}
                title={template.name}
                trailing={
                  <View style={styles.rowActions}>
                    <Pressable accessibilityLabel={`Add ${template.name} to ${selectedMealLabel}`} hitSlop={10} onPress={() => onQuickAddMealTemplate(template)} style={styles.iconButton}>
                      <Text style={styles.iconButtonText}>+</Text>
                    </Pressable>
                    {manageMealsOpen ? (
                      <Pressable accessibilityLabel={`Delete ${template.name}`} hitSlop={10} onPress={() => onDeleteMealTemplate(template.id)} style={styles.iconButton}>
                        <Text style={styles.iconButtonText}>×</Text>
                      </Pressable>
                    ) : null}
                  </View>
                }
                value={`${formatNumber(templateTotals.calories)} kcal`}
              />
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyBlock}>
          <Text selectable style={styles.emptyStateText}>
            No saved meals yet.
          </Text>
        </View>
      )}
    </AppCard>
  );
}
