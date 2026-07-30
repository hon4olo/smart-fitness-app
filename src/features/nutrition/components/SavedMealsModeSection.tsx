import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { ListRow } from '@/components/ui/ListRow';
import { formatCompactMacroTotals, formatNumber, sumNutritionTotals } from '@/lib/nutrition';
import { useLocalization } from '@/localization';
import { getNutritionAddFoodCopy } from '@/localization/nutritionAddFoodCopy';
import type { MealTemplate } from '@/types';
import { formatEnergyValue, useUnitPreferences } from '@/units';

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
  const { energy } = useUnitPreferences();
  const { formatNumber: formatLocalizedNumber, locale } = useLocalization();
  const copy = getNutritionAddFoodCopy(locale);
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
        <Text selectable style={styles.sectionTitle}>{copy.mealsTitle}</Text>
      </View>

      <View style={styles.quietActionRow}>
        <Pressable
          accessibilityLabel={copy.createMeal}
          hitSlop={10}
          onPress={onToggleCreateMeal}
          style={styles.quietActionButton}>
          <Text style={styles.quietActionText}>{copy.createMeal}</Text>
        </Pressable>
        <Pressable
          accessibilityLabel={copy.manageMeals}
          hitSlop={10}
          onPress={onToggleManageMeals}
          style={styles.quietActionButton}>
          <Text style={styles.quietActionText}>
            {manageMealsOpen ? copy.doneManaging : copy.manageMeals}
          </Text>
        </Pressable>
      </View>

      {createMealOpen ? (
        <View style={styles.inlineForm}>
          <TextInput
            accessibilityLabel={copy.mealName}
            autoCapitalize="words"
            onChangeText={setMealTemplateName}
            placeholder={copy.mealName}
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={mealTemplateName}
          />
          <Text selectable style={styles.helperText}>
            {copy.saveCurrentMealHint(selectedMealLabel)}
          </Text>
          <AppButton label={copy.saveMeal} onPress={onSaveMealTemplate} />
        </View>
      ) : null}

      {mealTemplates.length > 0 ? (
        <View style={styles.listGap}>
          {mealTemplates.map((template) => {
            const templateTotals = sumNutritionTotals(template.items);
            const expanded = expandedTemplateId === template.id;
            const formattedItemCount = formatLocalizedNumber(template.items.length, {
              maximumFractionDigits: 0,
            });
            return (
              <View key={template.id} style={styles.inlineForm}>
                <ListRow
                  accessibilityHint={copy.openSavedMeal}
                  detail={`${copy.itemCount(template.items.length, formattedItemCount)} · ${formatCompactMacroTotals(templateTotals)}`}
                  onPress={() => toggleDetails(template)}
                  title={template.name}
                  trailing={
                    <View style={styles.rowActions}>
                      <Pressable
                        accessibilityLabel={copy.addSavedMeal(template.name, selectedMealLabel)}
                        hitSlop={10}
                        onPress={() => onQuickAddMealTemplate(template)}
                        style={styles.iconButton}>
                        <Text style={styles.iconButtonText}>+</Text>
                      </Pressable>
                      {manageMealsOpen ? (
                        <Pressable
                          accessibilityLabel={copy.deleteSavedMeal(template.name)}
                          hitSlop={10}
                          onPress={() => onDeleteMealTemplate(template.id)}
                          style={styles.iconButton}>
                          <Text style={styles.iconButtonText}>×</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  }
                  value={`${formatEnergyValue(templateTotals.calories, energy)} ${energy}`}
                />

                {expanded ? (
                  <View style={styles.inlineForm}>
                    <TextInput
                      accessibilityLabel={copy.savedMealName}
                      autoCapitalize="words"
                      onChangeText={setEditingName}
                      placeholder={copy.mealName}
                      placeholderTextColor={colors.textSecondary}
                      style={styles.input}
                      value={editingName}
                    />
                    {template.items.map((item) => (
                      <View key={item.id} style={styles.nutrientCardRow}>
                        <View style={styles.nutrientCardCopy}>
                          <Text selectable style={styles.nutrientLabel}>{item.name}</Text>
                          <Text selectable style={styles.nutrientHint}>
                            {formatNumber(item.quantity ?? item.servingSize ?? 1)} {item.servingUnit ?? copy.unit.toLowerCase()} · {formatCompactMacroTotals(item)}
                          </Text>
                        </View>
                        <Text selectable style={styles.nutrientValue}>
                          {formatEnergyValue(item.calories, energy)} {energy}
                        </Text>
                      </View>
                    ))}
                    <AppButton
                      disabled={!editingName.trim()}
                      label={copy.saveName}
                      onPress={() => onRenameMealTemplate(template.id, editingName)}
                      variant="secondary"
                    />
                    <AppButton
                      label={copy.replaceWithCurrent(selectedMealLabel)}
                      onPress={() =>
                        onReplaceMealTemplateItems(
                          template.id,
                          editingName.trim() || template.name,
                        )
                      }
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
          <Text selectable style={styles.emptyStateText}>{copy.noSavedMeals}</Text>
        </View>
      )}
    </AppCard>
  );
}
