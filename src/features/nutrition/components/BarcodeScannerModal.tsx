import { CameraView, useCameraPermissions, type BarcodeScanningResult, type BarcodeType } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { lookupFoodByBarcode, type FoodItem } from '@/api/foods';
import { AppButton } from '@/components/ui/AppButton';
import { Spacing } from '@/constants/theme';

const FOOD_BARCODE_TYPES: BarcodeType[] = ['ean13', 'ean8', 'upc_a', 'upc_e'];

type BarcodeScannerModalProps = {
  onClose: () => void;
  onFoodFound: (food: FoodItem) => void;
  styles: Record<string, any>;
  visible: boolean;
};

type ScanStatus = 'idle' | 'looking-up' | 'not-found' | 'error';

export function BarcodeScannerModal({ onClose, onFoodFound, styles, visible }: BarcodeScannerModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  const [lastBarcode, setLastBarcode] = useState('');
  const [scanMessage, setScanMessage] = useState('');
  const lookupBarcodeRef = useRef<string | null>(null);

  useEffect(() => {
    if (!visible) {
      lookupBarcodeRef.current = null;
      setLastBarcode('');
      setScanMessage('');
      setScanStatus('idle');
    }
  }, [visible]);

  const handleBarcodeScanned = async (result: BarcodeScanningResult) => {
    const barcode = result.data.trim();
    if (!barcode || lookupBarcodeRef.current) {
      return;
    }

    lookupBarcodeRef.current = barcode;
    setLastBarcode(barcode);
    setScanStatus('looking-up');
    setScanMessage('Looking up food...');

    try {
      const food = await lookupFoodByBarcode(barcode);
      if (food) {
        onFoodFound(food);
        return;
      }

      setScanStatus('not-found');
      setScanMessage('Food not found');
    } catch {
      setScanStatus('error');
      setScanMessage('Could not look up this barcode. Check your connection and try again.');
    } finally {
      lookupBarcodeRef.current = null;
    }
  };

  const retryScan = () => {
    lookupBarcodeRef.current = null;
    setLastBarcode('');
    setScanMessage('');
    setScanStatus('idle');
  };

  const cameraGranted = permission?.granted === true;
  const cameraActive = visible && cameraGranted && scanStatus === 'idle';

  return (
    <Modal animationType="slide" onRequestClose={onClose} presentationStyle="fullScreen" visible={visible}>
      <View style={styles.scannerScreen}>
        <View style={styles.scannerHeader}>
          <Pressable accessibilityLabel="Close barcode scanner" hitSlop={10} onPress={onClose} style={styles.scannerCloseButton}>
            <Text style={styles.scannerCloseText}>Close</Text>
          </Pressable>
          <Text selectable style={styles.scannerTitle}>
            Scan barcode
          </Text>
          <View style={styles.scannerHeaderSpacer} />
        </View>

        {cameraGranted ? (
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
                Align the barcode inside the frame
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.scannerPermissionCard}>
            <Text selectable style={styles.scannerPermissionTitle}>
              Camera access needed
            </Text>
            <Text selectable style={styles.scannerPermissionText}>
              {permission?.granted === false
                ? 'Camera permission is off. Allow camera access to scan barcodes, or return to manual search.'
                : 'We use the camera to scan food barcodes.'}
            </Text>
            {permission?.canAskAgain === false ? null : <AppButton label="Allow camera" onPress={requestPermission} />}
            <Pressable accessibilityLabel="Return to manual food search" hitSlop={10} onPress={onClose} style={styles.scannerManualButton}>
              <Text style={styles.scannerManualText}>Manual search</Text>
            </Pressable>
          </View>
        )}

        {scanStatus !== 'idle' ? (
          <View style={styles.scannerStatusCard}>
            <Text selectable style={styles.scannerStatusText}>
              {scanMessage}
            </Text>
            {lastBarcode ? (
              <Text selectable style={styles.scannerBarcodeText}>
                {lastBarcode}
              </Text>
            ) : null}
            {scanStatus === 'not-found' || scanStatus === 'error' ? (
              <View style={styles.scannerActions}>
                <AppButton label="Try again" onPress={retryScan} variant="secondary" />
                <Pressable accessibilityLabel="Return to manual food search" hitSlop={10} onPress={onClose} style={styles.scannerManualButton}>
                  <Text style={styles.scannerManualText}>Manual search</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={{ height: Spacing.two }} />
      </View>
    </Modal>
  );
}
