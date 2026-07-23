import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing } from '@/constants/theme';
import {
  BODY_MEASUREMENT_KINDS,
  getBodyMeasurementLabel,
} from '@/features/progress/bodyMeasurementModel';
import type { BodyMeasurementKind, BodyMeasurementUnit } from '@/types';

const UNIT_OPTIONS: readonly BodyMeasurementUnit[] = ['cm', 'in', 'percent'];

const unitLabel = (unit: BodyMeasurementUnit): string =>
  unit === 'percent' ? '%' : unit;

type AddBodyMeasurementCardProps = {
  customLabel: string;
  isDisabled: boolean;
  kind: BodyMeasurementKind;
  measurementValue: string;
  onChangeCustomLabel: (value: string) => void;
  onChangeKind: (value: BodyMeasurementKind) => void;
  onChangeUnit: (value: BodyMeasurementUnit) => void;
  onChangeValue: (value: string) => void;
  onSave: () => void;
  unit: BodyMeasurementUnit;
};

export function AddBodyMeasurementCard({
  customLabel,
  isDisabled,
  kind,
  measurementValue,
  onChangeCustomLabel,
  onChangeKind,
  onChangeUnit,
  onChangeValue,
  onSave,
  unit,
}: AddBodyMeasurementCardProps) {
  const availableUnits = kind === 'body_fat' ? (['percent'] as const) : UNIT_OPTIONS;

  return (
    <AppCard>
      <Text style={styles.sectionTitle}>Add measurement</Text>
      <Text style={styles.inputLabel}>Measurement</Text>
      <View style={styles.choiceGrid}>
        {BODY_MEASUREMENT_KINDS.map((option) => {
          const selected = option === kind;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              key={option}
              onPress={() => onChangeKind(option)}
              style={({ pressed }) => [
                styles.choice,
                selected && styles.choiceSelected,
                pressed && styles.pressed,
              ]}>
              <Text style={[styles.choiceLabel, selected && styles.choiceLabelSelected]}>
                {getBodyMeasurementLabel(option)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {kind === 'custom' ? (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Custom label</Text>
          <TextInput
            onChangeText={onChangeCustomLabel}
            placeholder="Shoulders"
            placeholderTextColor={Colors.dark.textSecondary}
            style={styles.input}
            value={customLabel}
          />
        </View>
      ) : null}

      <View style={styles.inputGrid}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Value</Text>
          <TextInput
            inputMode="decimal"
            keyboardType="decimal-pad"
            onChangeText={onChangeValue}
            placeholder={kind === 'body_fat' ? '15' : '84'}
            placeholderTextColor={Colors.dark.textSecondary}
            style={styles.input}
            value={measurementValue}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Unit</Text>
          <View style={styles.unitRow}>
            {availableUnits.map((option) => {
              const selected = option === unit;
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  key={option}
                  onPress={() => onChangeUnit(option)}
                  style={({ pressed }) => [
                    styles.unitChoice,
                    selected && styles.choiceSelected,
                    pressed && styles.pressed,
                  ]}>
                  <Text style={[styles.choiceLabel, selected && styles.choiceLabelSelected]}>
                    {unitLabel(option)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
      <AppButton disabled={isDisabled} label="Save measurement" onPress={onSave} />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  choice: {
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.border,
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: '30%',
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: Spacing.one,
  },
  choiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
    marginBottom: Spacing.two,
    marginTop: Spacing.one,
  },
  choiceLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  choiceLabelSelected: {
    color: Colors.dark.accent,
  },
  choiceSelected: {
    backgroundColor: Colors.dark.accentSoft,
    borderColor: Colors.dark.accent,
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
    marginBottom: Spacing.two,
  },
  inputGroup: {
    flex: 1,
    gap: Spacing.one,
    minWidth: 130,
    marginBottom: Spacing.two,
  },
  inputLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.72,
  },
  sectionTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: Spacing.two,
  },
  unitChoice: {
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
  },
  unitRow: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
});
