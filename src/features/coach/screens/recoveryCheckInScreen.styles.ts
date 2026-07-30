import { StyleSheet } from 'react-native';

import { Colors, MaxContentWidth, Radii, Spacing, Typography } from '@/constants/theme';

export const createRecoveryCheckInScreenStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    backButton: {
      alignItems: 'center',
      height: 42,
      justifyContent: 'center',
      width: 42,
    },
    backLabel: {
      color: colors.textPrimary,
      fontSize: 42,
      fontWeight: '300',
      lineHeight: 42,
    },
    bodyText: {
      color: colors.textSecondary,
      fontSize: Typography.body.fontSize,
      lineHeight: Typography.body.lineHeight,
    },
    cardTitle: {
      color: colors.textPrimary,
      fontSize: Typography.cardTitle.fontSize,
      fontWeight: Typography.cardTitle.fontWeight,
      lineHeight: Typography.cardTitle.lineHeight,
    },
    container: {
      gap: Spacing.four,
      maxWidth: MaxContentWidth,
      width: '100%',
    },
    content: {
      alignItems: 'center',
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.three,
    },
    errorText: {
      color: colors.error,
      fontSize: Typography.callout.fontSize,
      lineHeight: Typography.callout.lineHeight,
    },
    fieldGroup: { gap: Spacing.one },
    fieldLabel: {
      color: colors.textPrimary,
      fontSize: Typography.label.fontSize,
      fontWeight: Typography.label.fontWeight,
      lineHeight: Typography.label.lineHeight,
    },
    header: {
      alignItems: 'center',
      backgroundColor: colors.background,
      flexDirection: 'row',
      gap: Spacing.one,
      paddingBottom: Spacing.two,
      paddingHorizontal: Spacing.two,
    },
    headerCopy: { flex: 1, minWidth: 0 },
    input: {
      backgroundColor: colors.surfaceElevated,
      borderColor: colors.borderSubtle,
      borderRadius: Radii.medium,
      borderWidth: StyleSheet.hairlineWidth,
      color: colors.textPrimary,
      fontSize: Typography.body.fontSize,
      minHeight: 46,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two,
    },
    metaText: {
      color: colors.textMuted,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    pressed: { opacity: 0.68 },
    screen: { backgroundColor: colors.background, flex: 1 },
    subtitle: {
      color: colors.textSecondary,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: '900',
      lineHeight: 30,
    },
  });
