import { StyleSheet } from 'react-native';

import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';

export const createTopTabsStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    label: {
      color: colors.textMuted,
      flexShrink: 1,
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
      flexShrink: 1,
      gap: Spacing.three,
      minWidth: 0,
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
      flexShrink: 1,
      fontSize: 16,
      lineHeight: 20,
    },
    title: {
      color: colors.textPrimary,
      flexShrink: 1,
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
      flexShrink: 1,
      fontSize: 17,
      lineHeight: 21,
    },
    title: {
      color: colors.textPrimary,
      flexShrink: 1,
      fontSize: 19,
      fontWeight: '900',
      lineHeight: 24,
    },
  });

export const createModalStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    actions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
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
      flexShrink: 1,
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
      flexShrink: 1,
      fontSize: 16,
      fontWeight: '900',
    },
    disabledButton: {
      opacity: 0.45,
    },
    modalHelperText: {
      color: colors.textMuted,
      flexShrink: 1,
      fontSize: 14,
      fontWeight: '700',
      lineHeight: 19,
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
      flexShrink: 1,
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
      flexGrow: 1,
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.two,
    },
    footer: {
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
      minWidth: 0,
      paddingHorizontal: Spacing.three,
      width: '100%',
    },
    footerIcon: {
      color: colors.textOnAccent,
      fontSize: 15,
      fontWeight: '900',
    },
    footerLabel: {
      color: colors.textOnAccent,
      flexShrink: 1,
      fontSize: 15,
      fontWeight: '900',
      textAlign: 'center',
    },
    emptyProgramText: {
      color: colors.textMuted,
      flexShrink: 1,
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
      gap: Spacing.two,
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
      flexShrink: 1,
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
      flexShrink: 0,
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
      flexShrink: 1,
      fontSize: 20,
      fontWeight: '900',
      lineHeight: 25,
    },
  });
