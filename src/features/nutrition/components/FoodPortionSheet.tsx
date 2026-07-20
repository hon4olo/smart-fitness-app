import { Pressable, Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { Spacing } from '@/constants/theme';
import type { FoodAttribution, FoodEntry } from '@/types';

type PortionDraft = {
  attribution?: FoodAttribution;
  brandName?: string;
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
  return (
    <View style={[styles.sheetBackdrop, { paddingBottom: insetsBottom + Spacing.two }]} pointerEvents="box-none">
      <Pressable accessibilityLabel="Close portion editor" onPress={onClose} style={styles.sheetScrim} />
      <View style={styles.sheet}>
        <View style={styles.sheetHeader}>
          <View>
            <Text selectable style={styles.sheetTitle}>
              {draft.name}
            </Text>
            <Text selectable style={styles.sheetSubtitle}>
              {selectedMealLabel} · {selectedDateLabel}
            </Text>
          </View>
          <Pressable accessibilityLabel="Close portion editor" hitSlop={10} onPress={onClose} style={styles.sheetClose}>
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
        {attributionLabel ? (
          <Text selectable style={styles.sheetAttribution}>
            {attributionLabel}
          </Text>
        ) : null}

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
            style={styles.sheetInput}
            value={draft.quantity}
          />
        </View>

        <View style={styles.sheetTotals}>
          <Text selectable style={styles.sheetTotalLine}>
            {macroTotalsLabel}
          </Text>
        </View>

        <Text selectable style={styles.sheetHint}>
          {draft.originalEntryId ? 'Update the selected entry and keep the diary context unchanged.' : 'Add this food to the selected meal without leaving the picker.'}
        </Text>

        {draft.originalEntryId ? <AppButton label={deleteLabel} onPress={onDelete} variant="secondary" /> : null}

        <AppButton label={submitLabel} onPress={onSave} />
      </View>
    </View>
  );
}
