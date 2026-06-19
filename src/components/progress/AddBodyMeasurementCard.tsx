import { StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing } from '@/constants/theme';

type AddBodyMeasurementCardProps = {
  isDisabled: boolean;
  measurementLabel: string;
  measurementValue: string;
  onChangeLabel: (value: string) => void;
  onChangeValue: (value: string) => void;
  onSave: () => void;
};

export function AddBodyMeasurementCard({
  isDisabled,
  measurementLabel,
  measurementValue,
  onChangeLabel,
  onChangeValue,
  onSave,
}: AddBodyMeasurementCardProps) {
  return (
    <AppCard>
      <Text style={styles.sectionTitle}>Add measurement</Text>
      <View style={styles.inputGrid}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Label</Text>
          <TextInput
            onChangeText={onChangeLabel}
            placeholder="Waist"
            placeholderTextColor={Colors.dark.textSecondary}
            style={styles.input}
            value={measurementLabel}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Value</Text>
          <TextInput
            onChangeText={onChangeValue}
            placeholder="84 cm"
            placeholderTextColor={Colors.dark.textSecondary}
            style={styles.input}
            value={measurementValue}
          />
        </View>
      </View>
      <AppButton disabled={isDisabled} label="Save measurement" onPress={onSave} />
    </AppCard>
  );
}

const styles = StyleSheet.create({
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
  },
  inputLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  sectionTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: Spacing.two,
  },
});