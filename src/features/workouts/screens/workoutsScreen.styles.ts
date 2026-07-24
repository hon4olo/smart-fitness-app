import { StyleSheet } from 'react-native';

import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';

export const createTopTabsStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    label: {
      color: colors.textMuted,
      fontSize: 23,
      fontWeight: '900',
      lineHeight: 29,
    },
    labelSelected: {
      color: colors.textPrimary,
      fontSize: 28,
      lineHeight: 34,
    },
    row: {
      alignItems: 'baseline',
      flexDirection: 'row',
      gap: Spacing.three,
    },
  });

export const createRoutineCardStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    card: {
      flex: 1,
      gap: 5,
      minWidth: 0,
    },
    cover: {
      alignItems: 'center',
      aspectRatio: 1,
      borderCurve: 'continuous',
      borderRadius: 8,
      justifyContent: 'center',
      width: '100%',
    },
    coverLabel: {
      color: '#FFFFFF',
      fontSize: 28,
      fontWeight: '500',
    },
    pressed: {
      opacity: 0.72,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 16,
      lineHeight: 20,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '900',
      lineHeight: 22,
    },
  });

export const createProgramRowStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    addIconBox: {
      borderRadius: 999,
    },
    addIconLabel: {
      color: colors.textPrimary,
      fontSize: 32,
      fontWeight: '300',
      lineHeight: 34,
    },
    copy: {
      flex: 1,
      minWidth: 0,
    },
    iconBox: {
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
      borderCurve: 'continuous',
      borderRadius: 4,
      height: 58,
      justifyContent: 'center',
      width: 58,
    },
    iconLabel: {
      color: colors.textMuted,
      fontSize: 23,
      fontWeight: '500',
      lineHeight: 26,
    },
    pressed: {
      opacity: 0.72,
    },
    row: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.two,
      minHeight: 72,
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 17,
      lineHeight: 21,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 19,
      fontWeight: '900',
      lineHeight: 24,
    },
  });

export const createModalStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    actions: {
      flexDirection: 'row',
      gap: Spacing.two,
      justifyContent: 'flex-end',
    },
    cancelButton: {
      alignItems: 'center',
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: Spacing.three,
    },
    cancelLabel: {
      color: colors.textSecondary,
      fontSize: 16,
      fontWeight: '800',
    },
    createButton: {
      alignItems: 'center',
      backgroundColor: colors.accent,
      borderCurve: 'continuous',
      borderRadius: 14,
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: Spacing.four,
    },
    createLabel: {
      color: colors.textOnAccent,
      fontSize: 16,
      fontWeight: '900',
    },
    disabledButton: {
      opacity: 0.45,
    },
    input: {
      backgroundColor: colors.backgroundSecondary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '700',
      minHeight: 52,
      paddingHorizontal: Spacing.three,
    },
    overlay: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      padding: Spacing.three,
    },
    panel: {
      backgroundColor: colors.surfacePrimary,
      borderCurve: 'continuous',
      borderRadius: 24,
      gap: Spacing.three,
      maxWidth: 520,
      padding: Spacing.four,
      width: '100%',
    },
    pressed: {
      opacity: 0.72,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: '900',
      lineHeight: 28,
    },
  });

export const createWorkoutsScreenStyles = (colors: typeof Colors.light) =>
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
    footer: {
      bottom: 0,
      left: 0,
      paddingHorizontal: Spacing.three,
      position: 'absolute',
      right: 0,
    },
    footerButton: {
      alignItems: 'center',
      alignSelf: 'flex-end',
      backgroundColor: colors.accent,
      borderCurve: 'continuous',
      borderRadius: 16,
      flexDirection: 'row',
      gap: Spacing.two,
      justifyContent: 'center',
      maxWidth: 360,
      minHeight: 48,
      minWidth: 260,
      paddingHorizontal: Spacing.three,
    },
    footerIcon: {
      color: colors.textOnAccent,
      fontSize: 15,
      fontWeight: '900',
    },
    footerLabel: {
      color: colors.textOnAccent,
      fontSize: 15,
      fontWeight: '900',
    },
    emptyProgramText: {
      color: colors.textMuted,
      fontSize: 15,
      fontWeight: '700',
      lineHeight: 20,
      paddingVertical: Spacing.one,
    },
    grid: {
      flexDirection: 'row',
      gap: Spacing.four,
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: Spacing.three,
    },
    horizontalCard: {
      width: 190,
    },
    horizontalList: {
      gap: Spacing.three,
      paddingRight: Spacing.three,
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
    pressed: {
      opacity: 0.72,
    },
    programList: {
      gap: Spacing.two,
    },
    screen: {
      backgroundColor: colors.background,
      flex: 1,
    },
    searchButton: {
      alignItems: 'center',
      height: 38,
      justifyContent: 'center',
      width: 38,
    },
    searchLabel: {
      color: colors.textPrimary,
      fontSize: 27,
      fontWeight: '500',
      lineHeight: 30,
    },
    sectionStack: {
      gap: Spacing.four,
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: '900',
      lineHeight: 25,
    },
  });
