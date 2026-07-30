import { StyleSheet } from 'react-native';

import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';

export const createProgramDetailScreenStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    addRoutineIcon: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      height: 62,
      justifyContent: 'center',
      width: 62,
    },
    addRoutineIconLabel: {
      color: colors.textPrimary,
      fontSize: 32,
      fontWeight: '300',
      lineHeight: 36,
    },
    addRoutineLabel: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: 17,
      fontWeight: '500',
    },
    addRoutineRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.three,
      marginTop: Spacing.three,
      minHeight: 62,
    },
    backLabel: {
      color: colors.textPrimary,
      fontSize: 36,
      fontWeight: '300',
      lineHeight: 38,
    },
    circleButton: {
      alignItems: 'center',
      backgroundColor: colors.overlay,
      borderCurve: 'continuous',
      borderRadius: 999,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    container: {
      maxWidth: MaxContentWidth,
      width: '100%',
    },
    content: {
      alignItems: 'center',
      backgroundColor: colors.background,
      paddingHorizontal: Spacing.three,
      paddingTop: 0,
    },
    cover: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderCurve: 'continuous',
      borderRadius: 14,
      height: 210,
      justifyContent: 'center',
      width: 210,
    },
    coverLabel: {
      color: colors.textPrimary,
      fontSize: 54,
      fontWeight: '200',
      lineHeight: 58,
      transform: [{ rotate: '180deg' }],
    },
    coverStage: {
      alignItems: 'center',
      gap: Spacing.three,
      paddingTop: 4,
    },
    hero: {
      backgroundColor: colors.surfaceSecondary,
      marginHorizontal: -Spacing.three,
      paddingBottom: Spacing.three,
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.one,
    },
    loadingLabel: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '800',
    },
    loadingState: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    moreButton: {
      alignItems: 'center',
      height: 44,
      justifyContent: 'center',
      width: 28,
    },
    moreLabel: {
      color: colors.textPrimary,
      fontSize: 26,
      fontWeight: '700',
      lineHeight: 28,
    },
    moreNavLabel: {
      color: colors.textPrimary,
      fontSize: 28,
      fontWeight: '800',
      lineHeight: 30,
    },
    navRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: Spacing.one,
    },
    playButton: {
      alignItems: 'center',
      height: 44,
      justifyContent: 'center',
      width: 36,
    },
    playLabel: {
      color: colors.textPrimary,
      fontSize: 25,
      lineHeight: 28,
    },
    pressed: {
      opacity: 0.72,
    },
    routineBody: {
      alignItems: 'center',
      flex: 1,
      flexDirection: 'row',
      gap: Spacing.three,
      minWidth: 0,
    },
    routineCopy: {
      flex: 1,
      minWidth: 0,
    },
    routineIcon: {
      alignItems: 'center',
      backgroundColor: '#ED7B2F',
      height: 62,
      justifyContent: 'center',
      width: 62,
    },
    routineIconLabel: {
      color: colors.textOnAccent,
      fontSize: 21,
      fontWeight: '500',
    },
    routineMeta: {
      color: colors.textMuted,
      fontSize: 15,
      fontWeight: '400',
      lineHeight: 19,
    },
    routineRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.two,
      marginTop: Spacing.two,
      minHeight: 62,
    },
    routineTitle: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '400',
      lineHeight: 22,
    },
    screen: {
      backgroundColor: colors.background,
      flex: 1,
    },
    simpleButton: {
      padding: Spacing.three,
    },
    simpleButtonLabel: {
      color: colors.accent,
      fontSize: 16,
      fontWeight: '800',
    },
    title: {
      color: colors.textPrimary,
      fontSize: 28,
      fontWeight: '700',
      lineHeight: 34,
      marginTop: Spacing.three,
    },
    toast: {
      backgroundColor: colors.textPrimary,
      borderCurve: 'continuous',
      borderRadius: 999,
      paddingHorizontal: Spacing.four,
      paddingVertical: Spacing.three,
    },
    toastText: {
      color: colors.background,
      fontSize: 15,
      fontWeight: '900',
    },
    toastWrap: {
      alignItems: 'center',
      bottom: 0,
      left: 0,
      paddingHorizontal: Spacing.three,
      position: 'absolute',
      right: 0,
    },
    viewMore: {
      alignItems: 'center',
      gap: 4,
    },
    viewMoreArrow: {
      color: colors.textSecondary,
      fontSize: 22,
      lineHeight: 20,
    },
    viewMoreLabel: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.2,
    },
  });

export type ProgramDetailScreenStyles = ReturnType<typeof createProgramDetailScreenStyles>;
