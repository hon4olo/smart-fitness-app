import { useState } from 'react';
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
  onReplaceMealTemplateItems: (templateId: string, name: string) => void;
  onRenameMealTemplate: (templateId: string, name: string) => void;
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
  onReplaceMealTemplateItems,
  onRenameMealTemplate,
  onSaveMealTemplate,
  onToggleCreateMeal,
  onToggleManageMeals,
  selectedMealLabel,
  setMealTemplateName,
  styles,
}: SavedMealsModeSectionProps) {
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const toggleDetails = (template: MealTemplate) => {
    if (expandedTemplateId === template.id) {
      setExpandedTemplateId(null);
      setEditingName('');
      return;
    }
    setExpandedTemplateId(template.id);
    setEditingName(template.name);
  };

  return (
    <AppCard>
      <View style={styles.sectionHeader}>
        <Text selectable style={styles.sectionTitle}>Meals</Text>
      </View>

      <View style={styles.quietActionRow}>
        <Pressable accessibilityLabel="Create meal" hitSlop={10} onPress={onToggleCreateMeal} style={styles.quietActionButton}>
          <Text style={styles.quietActionText}>Create meal</Text>
        </Pressable>
        <Pressable accessibilityLabel="Manage meals" hitSlop={10} onPress={onToggleManageMeals} style={styles.quietActionButton}>
          <Text style={styles.quietActionText}>{manageMealsOpen ? 'Done managing' : 'Manage meals'}</Text>
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
            const expanded = expandedTemplateId === template.id;
            return (
              <View key={template.id} style={styles.inlineForm}>
                <ListRow
                  accessibilityHint="Open saved meal details"
                  detail={`${template.items.length} item${template.items.length === 1 ? '' : 's'} · ${formatCompactMacroTotals(templateTotals)}`}
                  onPress={() => toggleDetails(template)}
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

                {expanded ? (
                  <View style={styles.inlineForm}>
                    <TextInput
                      accessibilityLabel="Saved meal name"
                      autoCapitalize="words"
                      onChangeText={setEditingName}
                      placeholder="Meal name"
                      placeholderTextColor={colors.textSecondary}
                      style={styles.input}
                      value={editingName}
                    />
                    {template.items.map((item) => (
                      <View key={item.id} style={styles.nutrientCardRow}>
                        <View style={styles.nutrientCardCopy}>
                          <Text selectable style={styles.nutrientLabel}>{item.name}</Text>
                          <Text selectable style={styles.nutrientHint}>
                            {formatNumber(item.quantity ?? item.servingSize ?? 1)} {item.servingUnit ?? 'unit'} · {formatCompactMacroTotals(item)}
                          </Text>
                        </View>
                        <Text selectable style={styles.nutrientValue}>{formatNumber(item.calories)} kcal</Text>
                      </View>
                    ))}
                    <AppButton
                      disabled={!editingName.trim()}
                      label="Save name"
                      onPress={() => onRenameMealTemplate(template.id, editingName)}
                      variant="secondary"
                    />
                    <AppButton
                      label={`Replace with current ${selectedMealLabel.toLowerCase()}`}
                      onPress={() => onReplaceMealTemplateItems(template.id, editingName.trim() || template.name)}
                      variant="secondary"
                    />
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyBlock}>
          <Text selectable style={styles.emptyStateText}>No saved meals yet.</Text>
        </View>
      )}
    </AppCard>
  );
}