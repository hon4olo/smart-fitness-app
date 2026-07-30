import { StyleSheet } from 'react-native';

import { Colors, MaxContentWidth, Radii, Spacing, Typography } from '@/constants/theme';

export const createWorkoutSafetyGateStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    acknowledgement: {
      alignItems: 'flex-start',
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderRadius: Radii.medium,
      borderWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: Spacing.two,
      padding: Spacing.three,
    },
    acknowledgementText: {
      color: colors.textSecondary,
      flex: 1,
      fontSize: Typography.body.fontSize,
      lineHeight: Typography.body.lineHeight,
    },
    actionRow: {
      flexDirection: 'row',
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
    blockedCard: {
      backgroundColor: colors.errorSoft,
      borderColor: colors.error,
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
    checkbox: {
      alignItems: 'center',
      borderColor: colors.border,
      borderRadius: 6,
      borderWidth: 1,
      height: 24,
      justifyContent: 'center',
      width: 24,
    },
    checkboxLabel: {
      color: colors.textOnAccent,
      fontSize: 16,
      fontWeight: '900',
    },
    checkboxSelected: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
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
    disclaimer: {
      color: colors.textMuted,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
      textAlign: 'center',
    },
    errorText: {
      color: colors.error,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    eyebrow: {
      color: colors.textMuted,
      fontSize: Typography.caption.fontSize,
      fontWeight: '800',
      letterSpacing: 1,
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
      gap: 3,
      minWidth: 0,
    },
    listCopy: {
      flex: 1,
      gap: 3,
      minWidth: 0,
    },
    listRow: {
      alignItems: 'flex-start',
      borderColor: colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: Spacing.two,
      paddingTop: Spacing.two,
    },
    listTitle: {
      color: colors.textPrimary,
      fontSize: Typography.bodyStrong.fontSize,
      fontWeight: Typography.bodyStrong.fontWeight,
      lineHeight: Typography.bodyStrong.lineHeight,
    },
    metaText: {
      color: colors.textMuted,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    metricLabel: {
      color: colors.textMuted,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    metricRow: {
      flexDirection: 'row',
      gap: Spacing.six,
    },
    metricValue: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: '900',
      lineHeight: 30,
    },
    pressed: {
      opacity: 0.68,
    },
    resultHeader: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: Spacing.two,
      justifyContent: 'space-between',
    },
    rowBadge: {
      flexShrink: 0,
      fontSize: Typography.caption.fontSize,
      fontWeight: '800',
      maxWidth: 104,
      textAlign: 'right',
      textTransform: 'uppercase',
    },
    screen: {
      backgroundColor: colors.background,
      flex: 1,
    },
    section: {
      gap: Spacing.two,
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: Typography.bodyStrong.fontSize,
      fontWeight: Typography.bodyStrong.fontWeight,
      lineHeight: Typography.bodyStrong.lineHeight,
    },
    smallAction: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderRadius: Radii.medium,
      borderWidth: StyleSheet.hairlineWidth,
      flex: 1,
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: Spacing.two,
    },
    smallActionLabel: {
      color: colors.textPrimary,
      fontSize: Typography.label.fontSize,
      fontWeight: Typography.label.fontWeight,
    },
    statusBadge: {
      flexShrink: 0,
      fontSize: Typography.caption.fontSize,
      fontWeight: '900',
      letterSpacing: 0.5,
    },
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
    workoutTitle: {
      color: colors.textPrimary,
      fontSize: 25,
      fontWeight: '900',
      lineHeight: 31,
    },
  });
