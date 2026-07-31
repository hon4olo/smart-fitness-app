import { StyleSheet } from 'react-native';

import {
  Colors,
  MaxContentWidth,
  Radii,
  Spacing,
  Typography,
} from '@/constants/theme';

export const createSocialNotificationScreenStyles = (
  colors: typeof Colors.dark,
) =>
  StyleSheet.create({
    backButton: {
      alignItems: 'center',
      borderColor: colors.borderSubtle,
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    backLabel: {
      color: colors.textPrimary,
      fontSize: 32,
      lineHeight: 34,
    },
    body: {
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
      paddingHorizontal: Spacing.four,
      paddingTop: Spacing.four,
    },
    eyebrow: {
      color: colors.accent,
      fontSize: Typography.caption.fontSize,
      fontWeight: '800',
      letterSpacing: 1.2,
    },
    headerCopy: {
      flex: 1,
      gap: Spacing.one,
    },
    headerRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: Spacing.three,
    },
    message: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: Typography.body.fontSize,
      lineHeight: Typography.body.lineHeight,
    },
    notificationCard: {
      backgroundColor: colors.backgroundSelected,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      gap: Spacing.three,
      padding: Spacing.four,
    },
    notificationHeader: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: Spacing.three,
    },
    notificationMeta: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.two,
      justifyContent: 'space-between',
    },
    pressed: {
      opacity: 0.72,
    },
    readLabel: {
      color: colors.textSecondary,
      fontSize: Typography.caption.fontSize,
      fontWeight: '700',
      lineHeight: Typography.caption.lineHeight,
    },
    screen: {
      backgroundColor: colors.background,
      flex: 1,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: Typography.body.fontSize,
      lineHeight: Typography.body.lineHeight,
    },
    timestamp: {
      color: colors.textSecondary,
      flex: 1,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    title: {
      color: colors.textPrimary,
      fontSize: Typography.screenTitle.fontSize,
      fontWeight: Typography.screenTitle.fontWeight,
      letterSpacing: Typography.screenTitle.letterSpacing,
      lineHeight: Typography.screenTitle.lineHeight,
    },
    unreadDot: {
      backgroundColor: colors.accent,
      borderRadius: 5,
      height: 10,
      marginTop: 6,
      width: 10,
    },
    unreadLabel: {
      color: colors.accent,
      fontSize: Typography.caption.fontSize,
      fontWeight: '800',
      lineHeight: Typography.caption.lineHeight,
    },
    username: {
      color: colors.accent,
      fontWeight: '800',
    },
  });

export type SocialNotificationScreenStyles = ReturnType<
  typeof createSocialNotificationScreenStyles
>;
