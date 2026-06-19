import { StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing } from '@/constants/theme';

type AddWeightEntryCardProps = {
  isDisabled: boolean;
  onChangeWeight: (value: string) => void;
  onSave: () => void;
  weight: string;
};

export function AddWeightEntryCard({ isDisabled, onChangeWeight, onSave, weight }: AddWeightEntryCardProps) {
  return (
    <AppCard>
      <Text style={styles.sectionTitle}>Add weight</Text>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Weight</Text>
        <TextInput
          keyboardType="decimal-pad"
          onChangeText={onChangeWeight}
          placeholder="0"
          placeholderTextColor={Colors.dark.textSecondary}
          style={styles.input}
          value={weight}
        />
      </View>
      <AppButton disabled={isDisabled} label="Save weight" onPress={onSave} />
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
  inputGroup: {
    gap: Spacing.one,
    marginBottom: Spacing.two,
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