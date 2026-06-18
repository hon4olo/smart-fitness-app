import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing } from '@/constants/theme';
import type { MealTemplate } from '@/context/AppContext';
import { formatMacroTotals, sumNutritionTotals } from '@/lib';

type SavedMealsSectionProps = {
  currentMealCount: number;
  currentMealLabel: string;
  currentMealNutritionLabel: string;
  isExpanded: boolean;
  isMealTemplateSaveDisabled: boolean;
  mealTemplateButtonLabel: string;
  mealTemplateName: string;
  mealTemplates: MealTemplate[];
  onDeleteMealTemplate: (templateId: string) => void;
  onMealTemplateNameChange: (value: string) => void;
  onSaveMealTemplate: () => void;
  onToggleExpanded: () => void;
  onUseMealTemplate: (template: MealTemplate) => void;
  selectedDateLabel: string;
  selectedMealEntriesCount: number;
  selectedMealTypeLabel: string;
};

export function SavedMealsSection({
  currentMealCount,
  currentMealLabel,
  currentMealNutritionLabel,
  isExpanded,
  isMealTemplateSaveDisabled,
  mealTemplateButtonLabel,
  mealTemplateName,
  mealTemplates,
  onDeleteMealTemplate,
  onMealTemplateNameChange,
  onSaveMealTemplate,
  onToggleExpanded,
  onUseMealTemplate,
  selectedDateLabel,
  selectedMealEntriesCount,
  selectedMealTypeLabel,
}: SavedMealsSectionProps) {
  return (
    <AppCard>
      <Pressable onPress={onToggleExpanded} style={styles.collapsibleHeader}>
        <Text selectable style={styles.sectionTitle}>
          {`Saved Meals ${isExpanded ? '−' : '+'}`}
        </Text>
      </Pressable>

      {isExpanded ? (
        <>
          <View style={styles.savedMealComposer}>
            <View style={styles.inputGroup}>
              <Text selectable style={styles.inputLabel}>
                Template name
              </Text>
              <TextInput
                onChangeText={onMealTemplateNameChange}
                placeholder="Post-workout lunch"
                placeholderTextColor={Colors.dark.textSecondary}
                style={styles.input}
                value={mealTemplateName}
              />
            </View>

            <Text selectable style={styles.remainingValue}>
              Save the current {currentMealLabel} entries for {selectedDateLabel}. This will store {currentMealCount}{' '}
              item{currentMealCount === 1 ? '' : 's'}.
            </Text>
            <Text selectable style={styles.templateSummaryLabel}>
              Template source: {selectedMealTypeLabel}
            </Text>
            <Text selectable style={styles.templateSummaryLabel}>
              Foods in current meal: {selectedMealEntriesCount}
            </Text>
            <Text selectable style={styles.templateSummaryLabel}>
              Current meal calories: {currentMealNutritionLabel}
            </Text>

            <AppButton
              disabled={isMealTemplateSaveDisabled}
              label={mealTemplateButtonLabel}
              onPress={onSaveMealTemplate}
            />
          </View>

          {mealTemplates.length > 0 ? (
            mealTemplates.map((template) => {
              const templateTotals = sumNutritionTotals(template.items);

              return (
                <View key={template.id} style={styles.savedMealItem}>
                  <View style={styles.savedMealItemContent}>
                    <Text selectable style={styles.foodName}>
                      {template.name}
                    </Text>
                    <Text selectable style={styles.foodMeta}>
                      {formatMacroTotals(templateTotals)}
                    </Text>
                    <Text selectable style={styles.foodServing}>
                      {template.items.length} item{template.items.length === 1 ? '' : 's'}
                    </Text>
                  </View>
                  <View style={styles.savedMealActions}>
                    <AppButton label="Use" onPress={() => onUseMealTemplate(template)} variant="secondary" />
                    <AppButton label="Delete" onPress={() => onDeleteMealTemplate(template.id)} variant="secondary" />
                  </View>
                </View>
              );
            })
          ) : (
            <Text selectable style={styles.remainingValue}>
              No saved meals yet.
            </Text>
          )}
        </>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  collapsibleHeader: { paddingBottom: Spacing.two },
  foodMeta: { color: Colors.dark.textSecondary, fontSize: 14, fontVariant: ['tabular-nums'], lineHeight: 20 },
  foodName: { color: Colors.dark.text, fontSize: 15, fontWeight: '700', lineHeight: 21 },
  foodServing: { color: Colors.dark.textSecondary, fontSize: 13, lineHeight: 19 },
  input: { backgroundColor: Colors.dark.background, borderColor: Colors.dark.border, borderCurve: 'continuous', borderRadius: 8, borderWidth: 1, color: Colors.dark.text, fontSize: 16, minHeight: 48, paddingHorizontal: Spacing.two },
  inputGroup: { gap: Spacing.one },
  inputLabel: { color: Colors.dark.textSecondary, fontSize: 13, fontWeight: '700' },
  remainingValue: { color: Colors.dark.textSecondary, fontSize: 13, lineHeight: 19, width: '100%' },
  savedMealActions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  savedMealComposer: { borderColor: Colors.dark.border, borderTopWidth: 1, gap: Spacing.two, marginBottom: Spacing.three, paddingTop: Spacing.two },
  savedMealItem: { borderColor: Colors.dark.border, borderTopWidth: 1, gap: Spacing.two, paddingTop: Spacing.three },
  savedMealItemContent: { gap: Spacing.one },
  sectionTitle: { color: Colors.dark.text, fontSize: 18, fontWeight: '800' },
  templateSummaryLabel: { color: Colors.dark.textSecondary, fontSize: 12, lineHeight: 18, width: '100%' },
});
