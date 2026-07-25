import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Radii, Spacing, Typography } from '@/constants/theme';
import { getDataRecoveryCopy } from '@/features/settings/dataRecoveryCopy';
import { useLocalization } from '@/localization';
import { useAppTheme } from '@/theme/AppThemeProvider';
import type { AppMutationFailure } from '@/types';

type AppMutationFailureNoticeProps = {
  failure: AppMutationFailure | null;
  pendingCount: number;
  onDismiss(): void;
  onRetry(): void;
};

export function AppMutationFailureNotice({
  failure,
  onDismiss,
  onRetry,
  pendingCount,
}: AppMutationFailureNoticeProps) {
  const { colors } = useAppTheme();
  const { locale } = useLocalization();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const copy = getDataRecoveryCopy(locale);

  if (!failure) return null;

  const isOutboxFailure = failure.stage === 'outbox';
  const title = isOutboxFailure
    ? locale === 'ru'
      ? 'Синхронизация ожидает повтора'
      : 'Sync pending'
    : locale === 'ru'
      ? 'Не удалось сохранить локально'
      : 'Local save failed';
  const safeMessage = isOutboxFailure ? copy.outboxFailure : copy.localFailure;
  const retryLabel = isOutboxFailure ? copy.retrySync : copy.retrySave;

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[
        styles.notice,
        isOutboxFailure ? styles.syncNotice : styles.localFailureNotice,
        { top: insets.top + Spacing.one },
      ]}
      testID="app-mutation-failure-notice">
      <View style={styles.copy}>
        <Text style={[styles.title, isOutboxFailure && styles.syncTitle]}>{title}</Text>
        <Text numberOfLines={2} style={styles.message}>
          {safeMessage}
        </Text>
      </View>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          disabled={pendingCount > 0}
          onPress={onRetry}
          style={({ pressed }) => [
            styles.action,
            isOutboxFailure ? styles.syncAction : styles.retryAction,
            pendingCount > 0 && styles.disabled,
            pressed && pendingCount === 0 && styles.pressed,
          ]}>
          <Text style={styles.retryLabel}>
            {pendingCount > 0 ? copy.waiting : retryLabel}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onDismiss}
          style={({ pressed }) => [styles.dismissAction, pressed && styles.pressed]}>
          <Text style={styles.dismissLabel}>{locale === 'ru' ? 'Скрыть' : 'Dismiss'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    action: {
      alignItems: 'center',
      borderRadius: Radii.medium,
      justifyContent: 'center',
      minHeight: 36,
      paddingHorizontal: Spacing.two,
    },
    actions: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.one,
    },
    copy: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    disabled: {
      opacity: 0.55,
    },
    dismissAction: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 36,
      paddingHorizontal: Spacing.one,
    },
    dismissLabel: {
      color: colors.textSecondary,
      fontSize: Typography.caption.fontSize,
      fontWeight: Typography.label.fontWeight,
    },
    localFailureNotice: {
      backgroundColor: colors.errorSoft,
      borderColor: colors.error,
    },
    message: {
      color: colors.textSecondary,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    notice: {
      alignItems: 'center',
      borderRadius: Radii.medium,
      borderWidth: StyleSheet.hairlineWidth,
      elevation: 6,
      flexDirection: 'row',
      gap: Spacing.two,
      left: Spacing.three,
      paddingHorizontal: Spacing.two,
      paddingVertical: Spacing.two,
      position: 'absolute',
      right: Spacing.three,
      shadowColor: '#000000',
      shadowOffset: { height: 3, width: 0 },
      shadowOpacity: 0.22,
      shadowRadius: 8,
      zIndex: 1000,
    },
    pressed: {
      opacity: 0.72,
    },
    retryAction: {
      backgroundColor: colors.error,
    },
    retryLabel: {
      color: colors.textOnAccent,
      fontSize: Typography.caption.fontSize,
      fontWeight: Typography.label.fontWeight,
    },
    syncAction: {
      backgroundColor: colors.accent,
    },
    syncNotice: {
      backgroundColor: colors.surfaceElevated,
      borderColor: colors.borderSubtle,
    },
    syncTitle: {
      color: colors.textPrimary,
    },
    title: {
      color: colors.error,
      fontSize: Typography.caption.fontSize,
      fontWeight: '800',
    },
  });
