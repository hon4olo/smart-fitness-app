import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing } from '@/constants/theme';
import type { ProfileState, NutritionTargets } from '@/context/AppContext';
import { formatGoalType } from '@/lib';

type NutritionTargetsCardProps = {
  goalType: ProfileState['goalType'];
  isExpanded: boolean;
  latestWeightLabel: string;
  onApplySuggestedTargets: () => void;
  onCaloriesChange: (value: string) => void;
  onCarbsChange: (value: string) => void;
  onFatsChange: (value: string) => void;
  onProteinChange: (value: string) => void;
  onSaveTargets: () => void;
  onToggleExpanded: () => void;
  caloriesTarget: string;
  carbsTarget: string;
  fatsTarget: string;
  proteinTarget: string;
  suggestedTargets: NutritionTargets | null;
};

export function NutritionTargetsCard({
  goalType,
  isExpanded,
  latestWeightLabel,
  onApplySuggestedTargets,
  onCaloriesChange,
  onCarbsChange,
  onFatsChange,
  onProteinChange,
  onSaveTargets,
  onToggleExpanded,
  caloriesTarget,
  carbsTarget,
  fatsTarget,
  proteinTarget,
  suggestedTargets,
}: NutritionTargetsCardProps) {
  return (
    <AppCard>
      <Pressable onPress={onToggleExpanded} style={styles.collapsibleHeader}>
        <Text selectable style={styles.sectionTitle}>
          {`Nutrition Targets ${isExpanded ? '−' : '+'}`}
        </Text>
      </Pressable>

      {isExpanded ? (
        <>
          <View style={styles.suggestedSummary}>
            <View style={styles.suggestedSummaryRow}>
              <Text selectable style={styles.targetLabel}>
                Goal
              </Text>
              <Text selectable style={styles.targetValue}>
                {formatGoalType(goalType)}
              </Text>
            </View>
            <View style={styles.suggestedSummaryRow}>
              <Text selectable style={styles.targetLabel}>
                Latest weight
              </Text>
              <Text selectable style={styles.targetValue}>
                {latestWeightLabel}
              </Text>
            </View>
          </View>

          <View style={styles.suggestedCard}>
            <Text selectable style={styles.suggestedTitle}>
              Suggested Targets
            </Text>
            {suggestedTargets ? (
              <>
                <View style={styles.suggestedGrid}>
                  <View style={styles.suggestedItem}>
                    <Text selectable style={styles.inputLabel}>
                      Calories
                    </Text>
                    <Text selectable style={styles.suggestedValue}>
                      {suggestedTargets.calories}
                    </Text>
                  </View>
                  <View style={styles.suggestedItem}>
                    <Text selectable style={styles.inputLabel}>
                      Protein
                    </Text>
                    <Text selectable style={styles.suggestedValue}>
                      {suggestedTargets.protein} g
                    </Text>
                  </View>
                  <View style={styles.suggestedItem}>
                    <Text selectable style={styles.inputLabel}>
                      Carbs
                    </Text>
                    <Text selectable style={styles.suggestedValue}>
                      {suggestedTargets.carbs} g
                    </Text>
                  </View>
                  <View style={styles.suggestedItem}>
                    <Text selectable style={styles.inputLabel}>
                      Fats
                    </Text>
                    <Text selectable style={styles.suggestedValue}>
                      {suggestedTargets.fats} g
                    </Text>
                  </View>
                </View>
                <AppButton label="Apply Suggested Targets" onPress={onApplySuggestedTargets} variant="secondary" />
              </>
            ) : (
              <Text selectable style={styles.remainingValue}>
                Log a weight entry to generate suggested targets.
              </Text>
            )}
          </View>

          <View style={styles.inputGrid}>
            <View style={styles.inputGroup}>
              <Text selectable style={styles.inputLabel}>
                Calories target
              </Text>
              <TextInput
                keyboardType="decimal-pad"
                onChangeText={onCaloriesChange}
                placeholder="2800"
                placeholderTextColor={Colors.dark.textSecondary}
                style={styles.input}
                value={caloriesTarget}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text selectable style={styles.inputLabel}>
                Protein target
              </Text>
              <TextInput
                keyboardType="decimal-pad"
                onChangeText={onProteinChange}
                placeholder="160"
                placeholderTextColor={Colors.dark.textSecondary}
                style={styles.input}
                value={proteinTarget}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text selectable style={styles.inputLabel}>
                Carbs target
              </Text>
              <TextInput
                keyboardType="decimal-pad"
                onChangeText={onCarbsChange}
                placeholder="350"
                placeholderTextColor={Colors.dark.textSecondary}
                style={styles.input}
                value={carbsTarget}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text selectable style={styles.inputLabel}>
                Fats target
              </Text>
              <TextInput
                keyboardType="decimal-pad"
                onChangeText={onFatsChange}
                placeholder="80"
                placeholderTextColor={Colors.dark.textSecondary}
                style={styles.input}
                value={fatsTarget}
              />
            </View>
          </View>

          <AppButton label="Save Targets" onPress={onSaveTargets} />
        </>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  collapsibleHeader: { paddingBottom: Spacing.two },
  input: { backgroundColor: Colors.dark.background, borderColor: Colors.dark.border, borderCurve: 'continuous', borderRadius: 8, borderWidth: 1, color: Colors.dark.text, fontSize: 16, minHeight: 48, paddingHorizontal: Spacing.two },
  inputGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  inputGroup: { flex: 1, gap: Spacing.one, minWidth: 130 },
  inputLabel: { color: Colors.dark.textSecondary, fontSize: 13, fontWeight: '700' },
  remainingValue: { color: Colors.dark.textSecondary, fontSize: 13, lineHeight: 19, width: '100%' },
  suggestedCard: { borderColor: Colors.dark.border, borderTopWidth: 1, gap: Spacing.two, marginBottom: Spacing.three, paddingTop: Spacing.two },
  suggestedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  suggestedItem: { flex: 1, gap: Spacing.one, minWidth: 120 },
  suggestedSummary: { gap: Spacing.two, marginBottom: Spacing.two },
  suggestedSummaryRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two },
  suggestedTitle: { color: Colors.dark.text, fontSize: 16, fontWeight: '800', marginBottom: Spacing.two },
  suggestedValue: { color: Colors.dark.text, fontSize: 16, fontWeight: '800' },
  sectionTitle: { color: Colors.dark.text, fontSize: 18, fontWeight: '800' },
  targetLabel: { color: Colors.dark.text, flex: 1, fontSize: 15, fontWeight: '700' },
  targetValue: { color: Colors.dark.text, flex: 1, fontSize: 15, fontVariant: ['tabular-nums'], fontWeight: '800', textAlign: 'right' },
});
