import { StyleSheet } from 'react-native';

import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';

export const createWorkoutSessionScreenStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    container: {
      maxWidth: MaxContentWidth,
      width: '100%',
    },
    content: {
      alignItems: 'center',
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.two,
    },
    emptyMessage: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
      marginBottom: Spacing.three,
    },
    emptyState: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      padding: Spacing.three,
    },
    emptyTitle: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '900',
      marginBottom: 4,
    },
    emptyWorkoutMessage: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
    },
    emptyWorkoutState: {
      gap: Spacing.one,
      paddingVertical: Spacing.four,
    },
    emptyWorkoutTitle: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '900',
    },
    fill: {
      flex: 1,
    },
    loadingLabel: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '700',
    },
    loadingState: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      gap: Spacing.two,
      padding: Spacing.three,
    },
    scrollView: {
      flex: 1,
    },
    screen: {
      flex: 1,
    },
    sectionList: {
      gap: Spacing.two,
    },
    textAction: {
      alignSelf: 'flex-start',
      paddingVertical: Spacing.one,
    },
    textActionLabel: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: '800',
    },
    textActionPressed: {
      opacity: 0.72,
    },
  });
