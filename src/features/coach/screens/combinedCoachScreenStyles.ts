import { StyleSheet } from 'react-native';

import { Colors, MaxContentWidth, Radii, Spacing, Typography } from '@/constants/theme';

export const combinedCoachStyles = StyleSheet.create({
  bodyText: {
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
  },
  boundaryBox: {
    borderRadius: Radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
  },
  cardTitle: {
    fontSize: Typography.cardTitle.fontSize,
    fontWeight: Typography.cardTitle.fontWeight,
    lineHeight: Typography.cardTitle.lineHeight,
  },
  domainBadge: {
    borderRadius: Radii.pill,
    fontSize: Typography.caption.fontSize,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  domainCard: {
    borderRadius: Radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.one,
    padding: Spacing.three,
  },
  domainHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  domainStack: {
    gap: Spacing.three,
  },
  domainTitle: {
    fontSize: Typography.bodyStrong.fontSize,
    fontWeight: Typography.bodyStrong.fontWeight,
    lineHeight: Typography.bodyStrong.lineHeight,
  },
  flexCopy: {
    flex: 1,
    minWidth: 0,
  },
  issueStack: {
    gap: Spacing.one,
  },
  metaText: {
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
  },
  pressed: {
    opacity: 0.68,
  },
  resultBadge: {
    borderRadius: Radii.pill,
    fontSize: Typography.caption.fontSize,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  resultHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.three,
  },
  sectionTitle: {
    fontSize: Typography.label.fontSize,
    fontWeight: Typography.label.fontWeight,
    lineHeight: Typography.label.lineHeight,
  },
});

export const createCombinedCoachScreenStyles = (colors: typeof Colors.light) =>
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
    metaText: {
      color: colors.textMuted,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    screen: {
      backgroundColor: colors.background,
      flex: 1,
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
  });