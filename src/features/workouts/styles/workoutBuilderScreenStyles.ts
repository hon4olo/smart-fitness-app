import { StyleSheet } from 'react-native';

import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';

export const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    addWorkoutButton: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderCurve: 'continuous',
      borderRadius: 18,
      marginTop: Spacing.two,
      paddingVertical: 14,
    },
    addWorkoutLabel: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '800',
    },
    container: {
      maxWidth: MaxContentWidth,
      width: '100%',
    },
    content: {
      alignItems: 'center',
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.three,
    },
    emptyContainer: {
      alignItems: 'center',
      gap: Spacing.two,
      paddingHorizontal: Spacing.three,
    },
    emptyState: {
      backgroundColor: colors.surfaceSecondary,
      borderCurve: 'continuous',
      borderRadius: 20,
      gap: 4,
      marginTop: Spacing.two,
      padding: Spacing.three,
    },
    emptyStateSubtitle: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 18,
    },
    emptyStateTitle: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '800',
    },
    emptyText: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
    },
    emptyTitle: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: '900',
      textAlign: 'center',
    },
    fill: {
      flex: 1,
    },
    fieldGroup: {
      gap: Spacing.one,
    },
    fieldLabel: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '700',
    },
    header: {
      alignItems: 'center',
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: Spacing.two,
      justifyContent: 'space-between',
      paddingBottom: Spacing.two,
      paddingHorizontal: Spacing.three,
    },
    headerAction: {
      minWidth: 56,
      paddingVertical: 8,
    },
    headerActionLabel: {
      color: colors.textSecondary,
      fontSize: 15,
      fontWeight: '800',
    },
    headerTitle: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: 18,
      fontWeight: '900',
      textAlign: 'center',
    },
    input: {
      backgroundColor: colors.backgroundSecondary ?? colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      color: colors.textPrimary,
      fontSize: 16,
      minHeight: 50,
      paddingHorizontal: Spacing.three,
    },
    overflowButton: {
      alignItems: 'center',
      alignSelf: 'stretch',
      justifyContent: 'center',
      paddingHorizontal: Spacing.one,
      width: 30,
    },
    overflowLabel: {
      color: colors.textSecondary,
      fontSize: 22,
      fontWeight: '900',
      marginTop: -2,
    },
    pressed: {
      opacity: 0.72,
    },
    primaryButton: {
      alignItems: 'center',
      backgroundColor: colors.accent,
      borderCurve: 'continuous',
      borderRadius: 16,
      paddingVertical: 14,
    },
    primaryLabel: {
      color: colors.background,
      fontSize: 15,
      fontWeight: '900',
    },
    saveAction: {
      alignItems: 'flex-end',
      minWidth: 56,
      paddingVertical: 8,
    },
    saveActionDisabled: {
      opacity: 0.38,
    },
    saveActionLabel: {
      color: colors.accent,
      fontSize: 15,
      fontWeight: '900',
    },
    screen: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    sectionHeaderRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.two,
      justifyContent: 'space-between',
      marginTop: Spacing.three,
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '900',
    },
    startNextButton: {
      paddingVertical: 6,
    },
    startNextLabel: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: '800',
    },
    workoutList: {
      gap: Spacing.two,
      marginTop: Spacing.two,
    },
    workoutRow: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderCurve: 'continuous',
      borderRadius: 20,
      flexDirection: 'row',
      gap: Spacing.one,
      paddingLeft: Spacing.three,
      paddingRight: Spacing.one,
      paddingVertical: 12,
    },
    workoutRowBody: {
      alignItems: 'center',
      flex: 1,
      flexDirection: 'row',
      gap: Spacing.two,
      minHeight: 44,
    },
    workoutRowChevron: {
      color: colors.textSecondary,
      fontSize: 22,
      fontWeight: '900',
      marginLeft: 'auto',
      paddingHorizontal: Spacing.one,
    },
    workoutRowCopy: {
      flex: 1,
      gap: 4,
    },
    workoutRowMeta: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '700',
    },
    workoutRowTitle: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '800',
    },
  });
