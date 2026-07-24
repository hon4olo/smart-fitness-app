import { StyleSheet } from 'react-native';

import { Colors, MaxContentWidth, Radii, Spacing } from '@/constants/theme';

export const createAddFoodSheetStyles = (colors: typeof Colors.dark) =>
  StyleSheet.create({
    sheet: {
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderTopLeftRadius: Radii.xlarge,
      borderTopRightRadius: Radii.xlarge,
      borderTopWidth: StyleSheet.hairlineWidth,
      gap: Spacing.two,
      maxWidth: MaxContentWidth,
      padding: Spacing.three,
      width: '100%',
    },
    sheetAttribution: {
      color: colors.textMuted,
      fontSize: 11,
      lineHeight: 15,
    },
    sheetBackdrop: {
      alignItems: 'center',
      bottom: 0,
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0,
      justifyContent: 'flex-end',
    },
    sheetClose: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    sheetCloseText: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: '900',
      lineHeight: 24,
    },
    sheetField: {
      gap: Spacing.one,
    },
    sheetHeader: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: Spacing.two,
      justifyContent: 'space-between',
    },
    sheetHint: {
      color: colors.textSecondary,
      fontSize: 12,
      lineHeight: 16,
    },
    sheetScrim: {
      ...StyleSheet.absoluteFill,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    helperText: {
      color: colors.textSecondary,
      fontSize: 12,
      lineHeight: 16,
    },
    sheetInput: {
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      color: colors.textPrimary,
      fontSize: 16,
      minHeight: 48,
      paddingHorizontal: Spacing.three,
    },
    sheetLabel: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    sheetMeta: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 18,
    },
    sheetSubtitle: {
      color: colors.textSecondary,
      fontSize: 12,
      lineHeight: 16,
    },
    sheetTitle: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '900',
    },
    sheetTotalLine: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '800',
    },
    sheetTotals: {
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      padding: Spacing.two,
    },
  });