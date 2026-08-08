import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  getSafeAccountDeletionErrorMessage,
  validateAccountDeletionPassword,
} from '@/auth/accountDeletionModel';
import type { AccountDeletionResult } from '@/auth/types';
import { DestructiveButton } from '@/components/ui/DestructiveButton';
import { InlineError } from '@/components/ui/InlineError';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Colors, Radii, Spacing, Typography } from '@/constants/theme';
import { useLocalization } from '@/localization';
import { localizeAccountDeletionMessage } from '@/localization/authCopy';

type DeleteAccountModalProps = {
  visible: boolean;
  onClose(): void;
  onDelete(password: string): Promise<AccountDeletionResult>;
  onDeleted(result: AccountDeletionResult): void;
};

export function DeleteAccountModal({
  visible,
  onClose,
  onDelete,
  onDeleted,
}: DeleteAccountModalProps) {
  const { t } = useLocalization();
  const insets = useSafeAreaInsets();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible) {
      setPassword('');
      setError(null);
      setBusy(false);
    }
  }, [visible]);

  const close = () => {
    if (!busy) onClose();
  };

  const submit = async () => {
    if (busy) return;
    const validation = validateAccountDeletionPassword(password);
    if (!validation.valid) {
      setError(validation.error ?? 'Enter your current password.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const result = await onDelete(password);
      onDeleted(result);
    } catch (caught) {
      setError(getSafeAccountDeletionErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={close}
      presentationStyle="overFullScreen"
      transparent
      visible={visible}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.screen}>
        <Pressable
          accessibilityLabel={t('deleteAccount.close')}
          disabled={busy}
          onPress={close}
          style={styles.scrim}
        />
        <View accessibilityViewIsModal style={styles.sheet}>
          <ScrollView
            automaticallyAdjustKeyboardInsets
            contentContainerStyle={[
              styles.sheetContent,
              { paddingBottom: insets.bottom + Spacing.four },
            ]}
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <Text selectable style={styles.eyebrow}>
              {t('deleteAccount.eyebrow')}
            </Text>
            <Text selectable style={styles.title}>
              {t('deleteAccount.title')}
            </Text>
            <Text selectable style={styles.body}>
              {t('deleteAccount.body')}
            </Text>

            <View style={styles.warningBox}>
              <Text selectable style={styles.warningTitle}>
                {t('deleteAccount.warningTitle')}
              </Text>
              <Text selectable style={styles.warningText}>
                {t('deleteAccount.warningBody')}
              </Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('deleteAccount.currentPassword')}</Text>
              <TextInput
                accessibilityLabel={t('deleteAccount.currentPasswordAccessibility')}
                autoCapitalize="none"
                autoComplete="current-password"
                autoCorrect={false}
                editable={!busy}
                onChangeText={(value) => {
                  setPassword(value);
                  if (error) setError(null);
                }}
                onSubmitEditing={() => void submit()}
                placeholder={t('deleteAccount.placeholder')}
                placeholderTextColor={Colors.dark.textMuted}
                returnKeyType="done"
                secureTextEntry
                style={styles.input}
                value={password}
              />
            </View>

            {error ? (
              <InlineError message={localizeAccountDeletionMessage(error, t)} />
            ) : null}

            <DestructiveButton
              accessibilityHint={t('deleteAccount.hint')}
              disabled={busy}
              label={busy ? t('deleteAccount.busy') : t('deleteAccount.action')}
              loading={busy}
              onPress={() => void submit()}
            />
            <SecondaryButton disabled={busy} label={t('common.cancel')} onPress={close} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  sheet: {
    backgroundColor: Colors.dark.surface,
    borderColor: Colors.dark.border,
    borderTopLeftRadius: Radii.xlarge,
    borderTopRightRadius: Radii.xlarge,
    borderWidth: StyleSheet.hairlineWidth,
    maxHeight: '92%',
  },
  sheetContent: {
    flexGrow: 1,
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  eyebrow: {
    color: Colors.dark.textMuted,
    fontSize: Typography.metricSmall.fontSize,
    fontWeight: Typography.metricSmall.fontWeight,
    letterSpacing: 0.8,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 25,
    fontWeight: '800',
    lineHeight: 31,
  },
  body: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
  },
  warningBox: {
    backgroundColor: Colors.dark.errorSoft,
    borderColor: Colors.dark.error,
    borderRadius: Radii.large,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.one,
    padding: Spacing.three,
  },
  warningTitle: {
    color: Colors.dark.error,
    fontSize: Typography.bodyStrong.fontSize,
    fontWeight: Typography.bodyStrong.fontWeight,
  },
  warningText: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
  },
  fieldGroup: {
    gap: Spacing.one,
  },
  label: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.caption.fontSize,
    fontWeight: '700',
  },
  input: {
    backgroundColor: Colors.dark.surfaceSecondary,
    borderColor: Colors.dark.border,
    borderRadius: Radii.large,
    borderWidth: StyleSheet.hairlineWidth,
    color: Colors.dark.text,
    fontSize: Typography.body.fontSize,
    minHeight: 50,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
});
