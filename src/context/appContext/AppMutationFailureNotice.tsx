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
      ? 'Ошибка облачной очереди'
      : 'Cloud queue update failed'
    : locale === 'ru'
      ? 'Ошибка локального сохранения'
      : 'Local save failed';
  const safeMessage = isOutboxFailure ? copy.outboxFailure : copy.localFailure;

  return (
    <View
      accessibilityLiveRegion="assertive"
      style={[styles.notice, { top: insets.top + Spacing.two }]}
      testID="app-mutation-failure-notice">
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.label}>{failure.label}</Text>
        <Text style={styles.message}>{safeMessage}</Text>
      </View>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          disabled={pendingCount > 0}
          onPress={onRetry}
          style={({ pressed }) => [
            styles.action,
            styles.retryAction,
            pendingCount > 0 && styles.disabled,
            pressed && pendingCount === 0 && styles.pressed,
          ]}>
          <Text style={styles.retryLabel}>
            {pendingCount > 0 ? copy.waiting : copy.retrySave}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onDismiss}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
          <Text style={styles.dismissLabel}>{locale === 'ru' ? 'Закрыть' : 'Dismiss'}</Text>
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
      paddingHorizontal: Spacing.three,
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
    dismissLabel: {
      color: colors.textSecondary,
      fontSize: Typography.label.fontSize,
      fontWeight: Typography.label.fontWeight,
    },
    label: {
      color: colors.textPrimary,
      fontSize: Typography.label.fontSize,
      fontWeight: Typography.label.fontWeight,
    },
    message: {
      color: colors.textSecondary,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    notice: {
      alignItems: 'center',
      backgroundColor: colors.errorSoft,
      borderColor: colors.error,
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      elevation: 8,
      flexDirection: 'row',
      gap: Spacing.two,
      left: Spacing.three,
      padding: Spacing.three,
      position: 'absolute',
      right: Spacing.three,
      shadowColor: '#000000',
      shadowOffset: { height: 4, width: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
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
      fontSize: Typography.label.fontSize,
      fontWeight: Typography.label.fontWeight,
    },
    title: {
      color: colors.error,
      fontSize: Typography.caption.fontSize,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
  });
