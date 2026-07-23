import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, Radii, Spacing } from '@/constants/theme';
import {
  BODY_MEASUREMENT_METRICS,
  BODY_MEASUREMENT_UNITS,
  type BodyMeasurementDraft,
} from '@/features/progress/bodyMeasurementModel';
import type { BodyMeasurementMetric, BodyMeasurementUnit } from '@/types';

type Props = {
  draft: BodyMeasurementDraft;
  error: string | null;
  isDisabled: boolean;
  onChangeMetric(value: BodyMeasurementMetric): void;
  onChangeCustomLabel(value: string): void;
  onChangeUnit(value: BodyMeasurementUnit): void;
  onChangeValue(value: string): void;
  onSave(): void;
};

export function AddBodyMeasurementCard({
  draft,
  error,
  isDisabled,
  onChangeCustomLabel,
  onChangeMetric,
  onChangeUnit,
  onChangeValue,
  onSave,
}: Props) {
  return (
    <AppCard>
      <Text style={styles.sectionTitle}>Add measurement</Text>
      <Text style={styles.inputLabel}>Metric</Text>
      <View style={styles.choiceGrid}>
        {BODY_MEASUREMENT_METRICS.map((option) => {
          const selected = option.metric === draft.metric;
          return (
            <Pressable
              key={option.metric}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => onChangeMetric(option.metric)}
              style={[styles.choice, selected && styles.choiceSelected]}>
              <Text style={[styles.choiceLabel, selected && styles.choiceLabelSelected]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {draft.metric === 'custom' ? (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Custom label</Text>
          <TextInput
            onChangeText={onChangeCustomLabel}
            placeholder="Forearm"
            placeholderTextColor={Colors.dark.textSecondary}
            style={styles.input}
            value={draft.customLabel}
          />
        </View>
      ) : null}
      <View style={styles.inputGrid}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Value</Text>
          <TextInput
            keyboardType="decimal-pad"
            onChangeText={onChangeValue}
            placeholder="84"
            placeholderTextColor={Colors.dark.textSecondary}
            style={styles.input}
            value={draft.value}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Unit</Text>
          <View style={styles.unitRow}>
            {BODY_MEASUREMENT_UNITS.map((unit) => {
              const selected = draft.unit === unit;
              return (
                <Pressable
                  key={unit}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  onPress={() => onChangeUnit(unit)}
                  style={[styles.unitChoice, selected && styles.choiceSelected]}>
                  <Text style={[styles.choiceLabel, selected && styles.choiceLabelSelected]}>
                    {unit === 'percent' ? '%' : unit}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <AppButton disabled={isDisabled} label="Save measurement" onPress={onSave} />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  choice: {
    borderColor: Colors.dark.border,
    borderRadius: Radii.pill,
    borderWidth: 1,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  choiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
    marginBottom: Spacing.two,
  },
  choiceLabel: { color: Colors.dark.textSecondary, fontSize: 13, fontWeight: '700' },
  choiceLabelSelected: { color: Colors.dark.accent },
  choiceSelected: { backgroundColor: Colors.dark.accentSoft, borderColor: Colors.dark.accent },
  error: { color: Colors.dark.error, fontSize: 13, marginBottom: Spacing.two },
  input: {
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.border,
    borderRadius: 8,
    borderWidth: 1,
    color: Colors.dark.text,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: Spacing.two,
  },
  inputGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginBottom: Spacing.two },
  inputGroup: { flex: 1, gap: Spacing.one, minWidth: 130, marginBottom: Spacing.two },
  inputLabel: { color: Colors.dark.textSecondary, fontSize: 13, fontWeight: '700' },
  sectionTitle: { color: Colors.dark.text, fontSize: 18, fontWeight: '800', marginBottom: Spacing.two },
  unitChoice: {
    alignItems: 'center',
    borderColor: Colors.dark.border,
    borderRadius: Radii.medium,
    borderWidth: 1,
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
  },
  unitRow: { flexDirection: 'row', gap: Spacing.one },
});
