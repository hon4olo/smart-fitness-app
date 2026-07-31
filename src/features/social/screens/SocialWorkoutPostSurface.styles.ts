import { StyleSheet } from 'react-native';

import { Colors, MaxContentWidth, Radii, Spacing, Typography } from '@/constants/theme';

export const createSocialWorkoutPostSurfaceStyles = (colors: typeof Colors.dark) =>
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
    backLabel: { color: colors.textPrimary, fontSize: 32, lineHeight: 34 },
    body: {
      color: colors.textSecondary,
      fontSize: Typography.body.fontSize,
      lineHeight: Typography.body.lineHeight,
    },
    caption: {
      color: colors.textPrimary,
      fontSize: Typography.body.fontSize,
      lineHeight: Typography.body.lineHeight,
    },
    cardTitle: {
      color: colors.textPrimary,
      fontSize: Typography.cardTitle.fontSize,
      fontWeight: Typography.cardTitle.fontWeight,
      lineHeight: Typography.cardTitle.lineHeight,
    },
    container: { gap: Spacing.four, maxWidth: MaxContentWidth, width: '100%' },
    content: {
      alignItems: 'center',
      paddingHorizontal: Spacing.four,
      paddingTop: Spacing.four,
    },
    detailLabel: {
      color: colors.textSecondary,
      fontSize: Typography.caption.fontSize,
      fontWeight: '700',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    detailValue: {
      color: colors.textPrimary,
      fontSize: Typography.body.fontSize,
      lineHeight: Typography.body.lineHeight,
    },
    exerciseCard: { gap: Spacing.three },
    exerciseName: {
      color: colors.textPrimary,
      fontSize: Typography.cardTitle.fontSize,
      fontWeight: Typography.cardTitle.fontWeight,
      lineHeight: Typography.cardTitle.lineHeight,
    },
    eyebrow: {
      color: colors.accent,
      fontSize: Typography.caption.fontSize,
      fontWeight: '800',
      letterSpacing: 1.2,
    },
    headerCopy: { flex: 1, gap: Spacing.one },
    headerRow: { alignItems: 'flex-start', flexDirection: 'row', gap: Spacing.three },
    metaText: {
      color: colors.textSecondary,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    metric: {
      backgroundColor: colors.backgroundSelected,
      borderRadius: Radii.medium,
      flexGrow: 1,
      gap: 2,
      minWidth: 88,
      padding: Spacing.three,
    },
    metricLabel: {
      color: colors.textSecondary,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    metricRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
    metricValue: {
      color: colors.textPrimary,
      fontSize: Typography.label.fontSize,
      fontWeight: Typography.label.fontWeight,
      lineHeight: Typography.label.lineHeight,
    },
    postCard: { gap: Spacing.three },
    postHeader: { alignItems: 'flex-start', flexDirection: 'row', gap: Spacing.three },
    postHeaderCopy: { flex: 1, gap: Spacing.one },
    postTitle: {
      color: colors.textPrimary,
      fontSize: Typography.cardTitle.fontSize,
      fontWeight: Typography.cardTitle.fontWeight,
      lineHeight: Typography.cardTitle.lineHeight,
    },
    pressed: { opacity: 0.72 },
    screen: { backgroundColor: colors.background, flex: 1 },
    setRow: {
      alignItems: 'center',
      borderTopColor: colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.three,
      paddingTop: Spacing.two,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: Typography.body.fontSize,
      lineHeight: Typography.body.lineHeight,
    },
    title: {
      color: colors.textPrimary,
      fontSize: Typography.screenTitle.fontSize,
      fontWeight: Typography.screenTitle.fontWeight,
      letterSpacing: Typography.screenTitle.letterSpacing,
      lineHeight: Typography.screenTitle.lineHeight,
    },
    username: {
      color: colors.accent,
      fontSize: Typography.caption.fontSize,
      fontWeight: '700',
      lineHeight: Typography.caption.lineHeight,
    },
  });

export type SocialWorkoutPostSurfaceStyles = ReturnType<
  typeof createSocialWorkoutPostSurfaceStyles
>;
