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
  Text,
  View,
} from 'react-native';

import {
  createCustomBarcodeFood,
  lookupFoodByBarcode,
  type FoodItem,
} from '@/api/foods';
import { AppButton } from '@/components/ui/AppButton';
import { Spacing } from '@/constants/theme';
import { useLocalization } from '@/localization';
import { getNutritionAddFoodCopy } from '@/localization/nutritionAddFoodCopy';

import { BarcodeManualProductForm } from './BarcodeManualProductForm';
import {
  createBarcodeManualFoodPayload,
  EMPTY_BARCODE_MANUAL_FORM,
  hasBarcodeManualFormErrors,
  validateBarcodeManualForm,
  type BarcodeManualFormState,
} from './barcodeManualFoodModel';

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
  const [manualForm, setManualForm] = useState<BarcodeManualFormState>(
    EMPTY_BARCODE_MANUAL_FORM,
  );
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
      setManualForm(EMPTY_BARCODE_MANUAL_FORM);
      setManualTouched(false);
      setManualError('');
      setManualSaving(false);
    }
  }, [visible]);

  const manualErrors = useMemo(
    () => validateBarcodeManualForm(manualForm, copy),
    [copy, manualForm],
  );
  const manualSaveDisabled = manualSaving || hasBarcodeManualFormErrors(manualErrors);

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
      setManualForm(EMPTY_BARCODE_MANUAL_FORM);
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
    setManualForm(EMPTY_BARCODE_MANUAL_FORM);
    setManualTouched(false);
    setManualError('');
  };

  const updateManualField = (field: keyof BarcodeManualFormState, value: string) => {
    setManualForm((current) => ({ ...current, [field]: value }));
    setManualError('');
  };

  const saveManualFood = async () => {
    setManualTouched(true);
    setManualError('');

    const errors = validateBarcodeManualForm(manualForm, copy);
    if (hasBarcodeManualFormErrors(errors) || !lastBarcode) return;

    setManualSaving(true);
    try {
      const food = await createCustomBarcodeFood(
        lastBarcode,
        createBarcodeManualFoodPayload(manualForm),
      );
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
          <BarcodeManualProductForm
            barcode={lastBarcode}
            colors={colors}
            copy={copy}
            errors={visibleManualErrors}
            form={manualForm}
            formError={manualError}
            onClose={() => setManualFormOpen(false)}
            onFieldBlur={() => setManualTouched(true)}
            onFieldChange={updateManualField}
            onSave={saveManualFood}
            saveDisabled={manualSaveDisabled}
            saving={manualSaving}
            styles={styles}
          />
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
