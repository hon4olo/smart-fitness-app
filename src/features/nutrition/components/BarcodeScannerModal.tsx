import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
  type BarcodeType,
} from 'expo-camera';
import { useEffect, useMemo, useRef, useState } from 'react';
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

import {
  createCustomBarcodeFood,
  lookupFoodByBarcode,
  type CreateCustomBarcodeFoodPayload,
  type FoodItem,
} from '@/api/foods';
import { AppButton } from '@/components/ui/AppButton';
import { Spacing } from '@/constants/theme';
import { useLocalization } from '@/localization';
import {
  getNutritionAddFoodCopy,
  type NutritionAddFoodCopy,
} from '@/localization/nutritionAddFoodCopy';

const FOOD_BARCODE_TYPES: BarcodeType[] = ['ean13', 'ean8', 'upc_a', 'upc_e'];

type BarcodeScannerModalProps = {
  colors: Record<string, any>;
  onClose: () => void;
  onFoodFound: (food: FoodItem) => void;
  onSearchByName: () => void;
  styles: Record<string, any>;
  visible: boolean;
};

type ScanStatus = 'idle' | 'looking-up' | 'not-found' | 'error';
type ServingUnit = 'g' | 'ml';

type ManualFormState = {
  name: string;
  brand: string;
  servingUnit: ServingUnit;
  calories: string;
  protein: string;
  fat: string;
  carbs: string;
};

type ManualFormErrors = Partial<Record<keyof ManualFormState | 'form', string>>;

type NutritionFieldKey = 'calories' | 'protein' | 'fat' | 'carbs';

const emptyManualForm: ManualFormState = {
  name: '',
  brand: '',
  servingUnit: 'g',
  calories: '',
  protein: '',
  fat: '',
  carbs: '',
};

const manualNutritionFields: Array<{ key: NutritionFieldKey; max: number }> = [
  { key: 'calories', max: 1000 },
  { key: 'protein', max: 100 },
  { key: 'fat', max: 100 },
  { key: 'carbs', max: 100 },
];

const parseRequiredNumber = (value: string): number | null => {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) return null;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const validateManualForm = (
  form: ManualFormState,
  copy: NutritionAddFoodCopy,
): ManualFormErrors => {
  const errors: ManualFormErrors = {};

  if (!form.name.trim()) errors.name = copy.scanner.required;

  for (const field of manualNutritionFields) {
    const value = parseRequiredNumber(form[field.key]);
    const label = copy.scanner.fieldLabels[field.key];
    if (value === null) {
      errors[field.key] = copy.scanner.required;
    } else if (value < 0) {
      errors[field.key] = copy.scanner.zeroOrMore;
    } else if (value > field.max) {
      errors[field.key] = copy.scanner.max(label, field.max);
    }
  }

  return errors;
};

const hasErrors = (errors: ManualFormErrors): boolean => Object.keys(errors).length > 0;

export function BarcodeScannerModal({
  colors,
  onClose,
  onFoodFound,
  onSearchByName,
  styles,
  visible,
}: BarcodeScannerModalProps) {
  const { locale } = useLocalization();
  const copy = getNutritionAddFoodCopy(locale);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  const [lastBarcode, setLastBarcode] = useState('');
  const [scanMessage, setScanMessage] = useState('');
  const [manualFormOpen, setManualFormOpen] = useState(false);
  const [manualForm, setManualForm] = useState<ManualFormState>(emptyManualForm);
  const [manualTouched, setManualTouched] = useState(false);
  const [manualError, setManualError] = useState('');
  const [manualSaving, setManualSaving] = useState(false);
  const lookupBarcodeRef = useRef<string | null>(null);

  useEffect(() => {
    if (!visible) {
      lookupBarcodeRef.current = null;
      setLastBarcode('');
      setScanMessage('');
      setScanStatus('idle');
      setManualFormOpen(false);
      setManualForm(emptyManualForm);
      setManualTouched(false);
      setManualError('');
      setManualSaving(false);
    }
  }, [visible]);

  const manualErrors = useMemo(
    () => validateManualForm(manualForm, copy),
    [copy, manualForm],
  );
  const manualSaveDisabled = manualSaving || hasErrors(manualErrors);

  const handleBarcodeScanned = async (result: BarcodeScanningResult) => {
    const barcode = result.data.trim();
    if (!barcode || lookupBarcodeRef.current) return;

    lookupBarcodeRef.current = barcode;
    setLastBarcode(barcode);
    setScanStatus('looking-up');
    setScanMessage(copy.scanner.lookingUp);

    try {
      const food = await lookupFoodByBarcode(barcode);
      if (food) {
        onFoodFound(food);
        return;
      }

      setScanStatus('not-found');
      setScanMessage(copy.scanner.productNotFound);
      setManualForm(emptyManualForm);
      setManualTouched(false);
      setManualError('');
      setManualFormOpen(false);
    } catch {
      setScanStatus('error');
      setScanMessage(copy.scanner.lookupError);
    } finally {
      lookupBarcodeRef.current = null;
    }
  };

  const retryScan = () => {
    lookupBarcodeRef.current = null;
    setLastBarcode('');
    setScanMessage('');
    setScanStatus('idle');
    setManualFormOpen(false);
    setManualForm(emptyManualForm);
    setManualTouched(false);
    setManualError('');
  };

  const updateManualField = (field: keyof ManualFormState, value: string) => {
    setManualForm((current) => ({ ...current, [field]: value }));
    setManualError('');
  };

  const saveManualFood = async () => {
    setManualTouched(true);
    setManualError('');

    const errors = validateManualForm(manualForm, copy);
    if (hasErrors(errors) || !lastBarcode) return;

    const payload: CreateCustomBarcodeFoodPayload = {
      name: manualForm.name.trim(),
      brand: manualForm.brand.trim() || undefined,
      servingUnit: manualForm.servingUnit,
      caloriesPer100g: parseRequiredNumber(manualForm.calories) ?? 0,
      proteinPer100g: parseRequiredNumber(manualForm.protein) ?? 0,
      fatPer100g: parseRequiredNumber(manualForm.fat) ?? 0,
      carbsPer100g: parseRequiredNumber(manualForm.carbs) ?? 0,
    };

    setManualSaving(true);
    try {
      const food = await createCustomBarcodeFood(lastBarcode, payload);
      setManualFormOpen(false);
      onFoodFound(food);
    } catch {
      setManualError(copy.scanner.saveError);
    } finally {
      setManualSaving(false);
    }
  };

  const cameraGranted = permission?.granted === true;
  const cameraActive = visible && cameraGranted && scanStatus === 'idle';
  const visibleManualErrors = manualTouched ? manualErrors : {};

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      visible={visible}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.scannerScreen}>
        <View style={styles.scannerHeader}>
          <Pressable
            accessibilityLabel={copy.scanner.closeScanner}
            hitSlop={10}
            onPress={onClose}
            style={styles.scannerCloseButton}>
            <Text style={styles.scannerCloseText}>{copy.scanner.close}</Text>
          </Pressable>
          <Text selectable style={styles.scannerTitle}>{copy.scanner.title}</Text>
          <View style={styles.scannerHeaderSpacer} />
        </View>

        {manualFormOpen ? (
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
                  {copy.scanner.nutritionPer(manualForm.servingUnit)}
                </Text>
              </View>
              <Pressable
                accessibilityLabel={copy.scanner.closeManualForm}
                hitSlop={10}
                onPress={() => setManualFormOpen(false)}
                style={styles.sheetClose}>
                <Text style={styles.sheetCloseText}>×</Text>
              </Pressable>
            </View>

            <View style={styles.sheetField}>
              <Text selectable style={styles.sheetLabel}>{copy.scanner.barcode}</Text>
              <TextInput
                editable={false}
                style={[styles.sheetInput, styles.readOnlyInput]}
                value={lastBarcode}
              />
            </View>

            <View style={styles.sheetField}>
              <Text selectable style={styles.sheetLabel}>{copy.scanner.productName}</Text>
              <TextInput
                autoCapitalize="words"
                onBlur={() => setManualTouched(true)}
                onChangeText={(value) => updateManualField('name', value)}
                placeholder={copy.scanner.namePlaceholder}
                placeholderTextColor={colors.textSecondary}
                style={styles.sheetInput}
                value={manualForm.name}
              />
              {visibleManualErrors.name ? (
                <Text style={styles.formErrorText}>{visibleManualErrors.name}</Text>
              ) : null}
            </View>

            <View style={styles.sheetField}>
              <Text selectable style={styles.sheetLabel}>{copy.brand}</Text>
              <TextInput
                autoCapitalize="words"
                onChangeText={(value) => updateManualField('brand', value)}
                placeholder={copy.optional}
                placeholderTextColor={colors.textSecondary}
                style={styles.sheetInput}
                value={manualForm.brand}
              />
            </View>

            <View style={styles.unitToggle}>
              <Pressable
                accessibilityLabel={copy.scanner.useGrams}
                onPress={() => updateManualField('servingUnit', 'g')}
                style={[
                  styles.unitToggleOption,
                  manualForm.servingUnit === 'g' ? styles.unitToggleOptionActive : null,
                ]}>
                <Text
                  style={[
                    styles.unitToggleText,
                    manualForm.servingUnit === 'g' ? styles.unitToggleTextActive : null,
                  ]}>
                  100g
                </Text>
              </Pressable>
              <Pressable
                accessibilityLabel={copy.scanner.useMilliliters}
                onPress={() => updateManualField('servingUnit', 'ml')}
                style={[
                  styles.unitToggleOption,
                  manualForm.servingUnit === 'ml' ? styles.unitToggleOptionActive : null,
                ]}>
                <Text
                  style={[
                    styles.unitToggleText,
                    manualForm.servingUnit === 'ml' ? styles.unitToggleTextActive : null,
                  ]}>
                  100ml
                </Text>
              </Pressable>
            </View>

            <View style={styles.nutritionGrid}>
              {manualNutritionFields.map((field) => (
                <View key={field.key} style={styles.sheetField}>
                  <Text selectable style={styles.sheetLabel}>
                    {copy.scanner.fieldLabels[field.key]}
                  </Text>
                  <TextInput
                    keyboardType="decimal-pad"
                    onBlur={() => setManualTouched(true)}
                    onChangeText={(value) => updateManualField(field.key, value)}
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    style={styles.sheetInput}
                    value={manualForm[field.key]}
                  />
                  {visibleManualErrors[field.key] ? (
                    <Text style={styles.formErrorText}>{visibleManualErrors[field.key]}</Text>
                  ) : null}
                </View>
              ))}
            </View>

            {manualError ? <Text style={styles.formErrorText}>{manualError}</Text> : null}
            <AppButton
              disabled={manualSaveDisabled}
              label={copy.scanner.saveProduct}
              loading={manualSaving}
              onPress={saveManualFood}
            />
          </ScrollView>
        ) : cameraGranted ? (
          <View style={styles.scannerCameraWrap}>
            <CameraView
              active={cameraActive}
              barcodeScannerSettings={{ barcodeTypes: FOOD_BARCODE_TYPES }}
              facing="back"
              onBarcodeScanned={cameraActive ? handleBarcodeScanned : undefined}
              style={styles.scannerCamera}
            />
            <View pointerEvents="none" style={styles.scannerOverlay}>
              <View style={styles.scannerFrame} />
              <Text selectable style={styles.scannerInstruction}>
                {copy.scanner.alignBarcode}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.scannerPermissionCard}>
            <Text selectable style={styles.scannerPermissionTitle}>
              {copy.scanner.cameraNeeded}
            </Text>
            <Text selectable style={styles.scannerPermissionText}>
              {permission?.granted === false ? copy.scanner.cameraOff : copy.scanner.cameraUse}
            </Text>
            {permission?.canAskAgain === false ? null : (
              <AppButton label={copy.scanner.allowCamera} onPress={requestPermission} />
            )}
            <Pressable
              accessibilityLabel={copy.scanner.returnManualSearch}
              hitSlop={10}
              onPress={onClose}
              style={styles.scannerManualButton}>
              <Text style={styles.scannerManualText}>{copy.scanner.manualSearch}</Text>
            </Pressable>
          </View>
        )}

        {scanStatus !== 'idle' && !manualFormOpen ? (
          <View style={styles.scannerStatusCard}>
            <Text selectable style={styles.scannerStatusText}>{scanMessage}</Text>
            {lastBarcode ? (
              <Text selectable style={styles.scannerBarcodeText}>{lastBarcode}</Text>
            ) : null}
            {scanStatus === 'not-found' || scanStatus === 'error' ? (
              <View style={styles.scannerActions}>
                {scanStatus === 'not-found' ? (
                  <>
                    <Text selectable style={styles.scannerPermissionText}>
                      {copy.scanner.futureScans}
                    </Text>
                    <AppButton
                      label={copy.scanner.addManually}
                      onPress={() => setManualFormOpen(true)}
                    />
                    <AppButton
                      label={copy.scanner.searchByName}
                      onPress={onSearchByName}
                      variant="secondary"
                    />
                  </>
                ) : null}
                <AppButton
                  label={copy.scanner.tryAgain}
                  onPress={retryScan}
                  variant="secondary"
                />
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={{ height: Spacing.two }} />
      </KeyboardAvoidingView>
    </Modal>
  );
}
