import { StyleSheet } from 'react-native';

import { Colors, MaxContentWidth, Radii, Spacing, Typography } from '@/constants/theme';

export const createNutritionCoachScreenStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    actionStack: {
      gap: Spacing.two,
    },
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
    badgeRow: {
      alignItems: 'center',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.two,
    },
    bodyText: {
      color: colors.textSecondary,
      fontSize: Typography.body.fontSize,
      lineHeight: Typography.body.lineHeight,
    },
    capabilityText: {
      color: colors.textMuted,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
      textAlign: 'center',
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
    dayCopy: {
      flex: 1,
      minWidth: 0,
    },
    dayRow: {
      alignItems: 'center',
      borderTopColor: colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: Spacing.three,
      justifyContent: 'space-between',
      paddingTop: Spacing.two,
    },
    dayTitle: {
      color: colors.textPrimary,
      fontSize: Typography.bodyEmphasized.fontSize,
      fontWeight: Typography.bodyEmphasized.fontWeight,
      lineHeight: Typography.bodyEmphasized.lineHeight,
    },
    dayValues: {
      alignItems: 'flex-end',
    },
    disclaimer: {
      color: colors.textMuted,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    errorCard: {
      backgroundColor: colors.errorSoft,
      borderColor: colors.error,
    },
    errorTitle: {
      color: colors.error,
      fontSize: Typography.cardTitle.fontSize,
      fontWeight: Typography.cardTitle.fontWeight,
    },
    header: {
      alignItems: 'center',
      backgroundColor: colors.background,
      flexDirection: 'row',
      gap: Spacing.one,
      paddingBottom: Spacing.two,
      paddingHorizontal: Spacing.two,
    },
    headerCopy: {
      flex: 1,
      minWidth: 0,
    },
    infoRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.three,
      justifyContent: 'space-between',
    },
    infoValue: {
      color: colors.textPrimary,
      fontSize: Typography.bodyEmphasized.fontSize,
      fontWeight: Typography.bodyEmphasized.fontWeight,
      lineHeight: Typography.bodyEmphasized.lineHeight,
    },
    issueText: {
      color: colors.textSecondary,
      fontSize: Typography.body.fontSize,
      lineHeight: Typography.body.lineHeight,
    },
    metaText: {
      color: colors.textMuted,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    periodButton: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderRadius: Radii.medium,
      borderWidth: StyleSheet.hairlineWidth,
      flex: 1,
      justifyContent: 'center',
      minHeight: 42,
      paddingHorizontal: Spacing.two,
    },
    periodButtonSelected: {
      backgroundColor: colors.accentSoft,
      borderColor: colors.accent,
    },
    periodLabel: {
      color: colors.textSecondary,
      fontSize: Typography.label.fontSize,
      fontWeight: Typography.label.fontWeight,
    },
    periodLabelSelected: {
      color: colors.textPrimary,
    },
    periodRow: {
      flexDirection: 'row',
      gap: Spacing.two,
    },
    pressed: {
      opacity: 0.72,
    },
    previewBadge: {
      backgroundColor: colors.accentSoft,
      borderRadius: Radii.pill,
      color: colors.accent,
      fontSize: Typography.caption.fontSize,
      fontWeight: '800',
      overflow: 'hidden',
      paddingHorizontal: Spacing.two,
      paddingVertical: Spacing.one,
    },
    resultHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.three,
      justifyContent: 'space-between',
    },
    resultStack: {
      gap: Spacing.four,
    },
    resultStatus: {
      color: colors.accent,
      fontSize: Typography.caption.fontSize,
      fontWeight: '800',
    },
    screen: {
      backgroundColor: colors.background,
      flex: 1,
    },
    sectionBlock: {
      gap: Spacing.two,
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: Typography.label.fontSize,
      fontWeight: Typography.label.fontWeight,
      lineHeight: Typography.label.lineHeight,
    },
    statusText: {
      color: colors.textMuted,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    summaryCell: {
      flex: 1,
      gap: 2,
    },
    summaryRow: {
      flexDirection: 'row',
      gap: Spacing.three,
    },
    summaryValue: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: '800',
      lineHeight: 30,
    },
    title: {
      color: colors.textPrimary,
      fontSize: Typography.screenTitle.fontSize,
      fontWeight: Typography.screenTitle.fontWeight,
      letterSpacing: Typography.screenTitle.letterSpacing,
      lineHeight: Typography.screenTitle.lineHeight,
    },
    warningText: {
      color: colors.warning,
      fontSize: Typography.bodyEmphasized.fontSize,
      fontWeight: Typography.bodyEmphasized.fontWeight,
      lineHeight: Typography.bodyEmphasized.lineHeight,
    },
  });

export type NutritionCoachScreenStyles = ReturnType<typeof createNutritionCoachScreenStyles>;
