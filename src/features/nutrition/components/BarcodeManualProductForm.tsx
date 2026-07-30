import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import type { NutritionAddFoodCopy } from '@/localization/nutritionAddFoodCopy';

import {
  BARCODE_NUTRITION_FIELDS,
  type BarcodeManualFormErrors,
  type BarcodeManualFormState,
} from './barcodeManualFoodModel';

type BarcodeManualProductFormProps = {
  barcode: string;
  colors: Record<string, any>;
  copy: NutritionAddFoodCopy;
  errors: BarcodeManualFormErrors;
  form: BarcodeManualFormState;
  formError: string;
  onClose: () => void;
  onFieldBlur: () => void;
  onFieldChange: (field: keyof BarcodeManualFormState, value: string) => void;
  onSave: () => void;
  saveDisabled: boolean;
  saving: boolean;
  styles: Record<string, any>;
};

export function BarcodeManualProductForm({
  barcode,
  colors,
  copy,
  errors,
  form,
  formError,
  onClose,
  onFieldBlur,
  onFieldChange,
  onSave,
  saveDisabled,
  saving,
  styles,
}: BarcodeManualProductFormProps) {
  return (
    <ScrollView
      contentContainerStyle={styles.scannerManualForm}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      <View style={styles.scannerManualHeader}>
        <View>
          <Text selectable style={styles.scannerPermissionTitle}>
            {copy.scanner.addProduct}
          </Text>
          <Text selectable style={styles.scannerPermissionText}>
            {copy.scanner.nutritionPer(form.servingUnit)}
          </Text>
        </View>
        <Pressable
          accessibilityLabel={copy.scanner.closeManualForm}
          hitSlop={10}
          onPress={onClose}
          style={styles.sheetClose}>
          <Text style={styles.sheetCloseText}>×</Text>
        </Pressable>
      </View>

      <View style={styles.sheetField}>
        <Text selectable style={styles.sheetLabel}>{copy.scanner.barcode}</Text>
        <TextInput
          editable={false}
          style={[styles.sheetInput, styles.readOnlyInput]}
          value={barcode}
        />
      </View>

      <View style={styles.sheetField}>
        <Text selectable style={styles.sheetLabel}>{copy.scanner.productName}</Text>
        <TextInput
          autoCapitalize="words"
          onBlur={onFieldBlur}
          onChangeText={(value) => onFieldChange('name', value)}
          placeholder={copy.scanner.namePlaceholder}
          placeholderTextColor={colors.textSecondary}
          style={styles.sheetInput}
          value={form.name}
        />
        {errors.name ? <Text style={styles.formErrorText}>{errors.name}</Text> : null}
      </View>

      <View style={styles.sheetField}>
        <Text selectable style={styles.sheetLabel}>{copy.brand}</Text>
        <TextInput
          autoCapitalize="words"
          onChangeText={(value) => onFieldChange('brand', value)}
          placeholder={copy.optional}
          placeholderTextColor={colors.textSecondary}
          style={styles.sheetInput}
          value={form.brand}
        />
      </View>

      <View style={styles.unitToggle}>
        <Pressable
          accessibilityLabel={copy.scanner.useGrams}
          onPress={() => onFieldChange('servingUnit', 'g')}
          style={[
            styles.unitToggleOption,
            form.servingUnit === 'g' ? styles.unitToggleOptionActive : null,
          ]}>
          <Text
            style={[
              styles.unitToggleText,
              form.servingUnit === 'g' ? styles.unitToggleTextActive : null,
            ]}>
            100g
          </Text>
        </Pressable>
        <Pressable
          accessibilityLabel={copy.scanner.useMilliliters}
          onPress={() => onFieldChange('servingUnit', 'ml')}
          style={[
            styles.unitToggleOption,
            form.servingUnit === 'ml' ? styles.unitToggleOptionActive : null,
          ]}>
          <Text
            style={[
              styles.unitToggleText,
              form.servingUnit === 'ml' ? styles.unitToggleTextActive : null,
            ]}>
            100ml
          </Text>
        </Pressable>
      </View>

      <View style={styles.nutritionGrid}>
        {BARCODE_NUTRITION_FIELDS.map((field) => (
          <View key={field.key} style={styles.sheetField}>
            <Text selectable style={styles.sheetLabel}>
              {copy.scanner.fieldLabels[field.key]}
            </Text>
            <TextInput
              keyboardType="decimal-pad"
              onBlur={onFieldBlur}
              onChangeText={(value) => onFieldChange(field.key, value)}
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
              style={styles.sheetInput}
              value={form[field.key]}
            />
            {errors[field.key] ? (
              <Text style={styles.formErrorText}>{errors[field.key]}</Text>
            ) : null}
          </View>
        ))}
      </View>

      {formError ? <Text style={styles.formErrorText}>{formError}</Text> : null}
      <AppButton
        disabled={saveDisabled}
        label={copy.scanner.saveProduct}
        loading={saving}
        onPress={onSave}
      />
    </ScrollView>
  );
}
