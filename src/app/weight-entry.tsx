import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { createUuid, formatShortDate } from '@/lib';
import { displayWeightInputToKg, parseDisplayNumber } from '@/units';
import { useUnitPreferences } from '@/units';

export default function WeightEntryScreen() {
  const { addWeightEntry } = useAppContext();
  const { preferences } = useUnitPreferences();
  const safeAreaInsets = useSafeAreaInsets();
  const [weight, setWeight] = useState('');
  const [error, setError] = useState('');

  const saveWeight = () => {
    const parsedDisplayWeight = parseDisplayNumber(weight);
    const parsedWeightKg = Number(displayWeightInputToKg(weight, preferences.weight));

    if (!Number.isFinite(parsedDisplayWeight) || parsedDisplayWeight <= 0 || !Number.isFinite(parsedWeightKg)) {
      setError('Enter a valid weight.');
      return;
    }

    const now = new Date();
    addWeightEntry({
      id: createUuid(),
      date: formatShortDate(now.toISOString()),
      weight: parsedWeightKg,
      createdAt: now.toISOString(),
    });

    setError('');
    setWeight('');
    router.back();
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[
        styles.content,
        { paddingBottom: safeAreaInsets.bottom + 120 },
      ]}
      keyboardShouldPersistTaps="handled"
      style={styles.screen}>
      <View style={styles.container}>
        <SectionHeader title="Add weight" />

        <AppCard>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Weight ({preferences.weight})</Text>
            <TextInput
              keyboardType="decimal-pad"
              onChangeText={(value) => {
                setWeight(value);
                if (error) setError('');
              }}
              placeholder={preferences.weight === 'lb' ? '182.3' : '82.7'}
              placeholderTextColor={Colors.dark.textSecondary}
              style={styles.input}
              value={weight}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>

          <AppButton label="Save weight" onPress={saveWeight} />
        </AppCard>

        <AppButton label="Cancel" onPress={() => router.back()} variant="secondary" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    width: '100%',
  },
  content: {
    alignItems: 'center',
    padding: Spacing.three,
  },
  error: {
    color: Colors.dark.error,
    fontSize: 13,
    lineHeight: 18,
    marginTop: Spacing.one,
  },
  fieldGroup: {
    gap: Spacing.one,
    marginBottom: Spacing.two,
  },
  input: {
    backgroundColor: Colors.dark.surfacePrimary,
    borderColor: Colors.dark.borderSubtle,
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: 1,
    color: Colors.dark.textPrimary,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: Spacing.two,
  },
  label: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  screen: {
    backgroundColor: Colors.dark.background,
    flex: 1,
  },
});