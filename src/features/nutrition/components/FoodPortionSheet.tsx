import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { Spacing } from '@/constants/theme';
import type { FoodAttribution, FoodEntry } from '@/types';
import { formatEnergyValue, parseDisplayNumber, useUnitPreferences } from '@/units';

type PortionDraft = {
  attribution?: FoodAttribution;
  brandName?: string;
  calories: number;
  name: string;
  originalEntryId?: string;
  quantity: string;
  servingSize: number;
  servingUnit: string;
  source: FoodEntry['source'];
};

type FoodPortionSheetProps = {
  attributionLabel?: string;
  colors: Record<string, any>;
  deleteLabel: string;
  draft: PortionDraft;
  insetsBottom: number;
  macroTotalsLabel: string;
  onChangeQuantity: (value: string) => void;
  onClose: () => void;
  onDelete: () => void;
  onSave: () => void;
  selectedDateLabel: string;
  selectedMealLabel: string;
  submitLabel: string;
  servingLabel: string;
  styles: Record<string, any>;
};

export function FoodPortionSheet({
  attributionLabel,
  colors,
  deleteLabel,
  draft,
  insetsBottom,
  macroTotalsLabel,
  onChangeQuantity,
  onClose,
  onDelete,
  onSave,
  selectedDateLabel,
  selectedMealLabel,
  submitLabel,
  servingLabel,
  styles,
}: FoodPortionSheetProps) {
  const { energy } = useUnitPreferences();
  const parsedQuantity = parseDisplayNumber(draft.quantity);
  const quantity = Number.isFinite(parsedQuantity) && parsedQuantity > 0
    ? parsedQuantity
    : draft.servingSize;
  const multiplier = draft.servingSize > 0 ? quantity / draft.servingSize : 1;
  const energyLabel = `${formatEnergyValue(draft.calories * multiplier, energy)} ${energy}`;
  const displayTotalsLabel = macroTotalsLabel.replace(/^[^·]+/, energyLabel);

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
      transparent
      visible>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheetBackdrop}>
        <Pressable
          accessibilityLabel="Close portion editor"
          onPress={onClose}
          style={styles.sheetScrim}
        />
        <View
          accessibilityViewIsModal
          style={[styles.sheetFrame, { paddingBottom: insetsBottom + Spacing.two }]}>
          <ScrollView
            bounces={false}
            contentContainerStyle={styles.sheet}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderCopy}>
                <Text selectable style={styles.sheetTitle}>
                  {draft.name}
                </Text>
                <Text selectable style={styles.sheetSubtitle}>
                  {selectedMealLabel} · {selectedDateLabel}
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Close portion editor"
                hitSlop={10}
                onPress={onClose}
                style={styles.sheetClose}>
                <Text style={styles.sheetCloseText}>×</Text>
              </Pressable>
            </View>

            {draft.brandName ? (
              <Text selectable style={styles.sheetMeta}>
                {draft.brandName}
              </Text>
            ) : null}
            <Text selectable style={styles.sheetMeta}>
              {servingLabel}
            </Text>
            <View style={styles.sheetField}>
              <Text selectable style={styles.sheetLabel}>
                Quantity
              </Text>
              <TextInput
                accessibilityLabel="Quantity"
                autoFocus
                keyboardType="decimal-pad"
                onChangeText={onChangeQuantity}
                placeholder="Quantity"
                placeholderTextColor={colors.textSecondary}
                returnKeyType="done"
                style={styles.sheetInput}
                value={draft.quantity}
              />
            </View>

            <View style={styles.sheetTotals}>
              <Text selectable style={styles.sheetTotalLine}>
                {displayTotalsLabel}
              </Text>
            </View>

            <Text selectable style={styles.sheetHint}>
              {draft.originalEntryId
                ? 'Update the selected entry and keep the diary context unchanged.'
                : 'Add this food to the selected meal without leaving the picker.'}
            </Text>

            {attributionLabel ? (
              <Text selectable style={styles.sheetAttribution}>
                {attributionLabel}
              </Text>
            ) : null}

            {draft.originalEntryId ? (
              <AppButton label={deleteLabel} onPress={onDelete} variant="secondary" />
            ) : null}
            <AppButton label={submitLabel} onPress={onSave} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
