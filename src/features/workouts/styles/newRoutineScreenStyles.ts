import { StyleSheet } from 'react-native';

import { Colors, MaxContentWidth, Radii, Spacing } from '@/constants/theme';

export const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    addButton: {
      alignItems: 'center',
      backgroundColor: colors.accent,
      borderCurve: 'continuous',
      borderRadius: 18,
      alignSelf: 'stretch',
      justifyContent: 'center',
      minHeight: 52,
      overflow: 'hidden',
      paddingHorizontal: Spacing.three,
    },
    addButtonLabel: {
      color: colors.textOnAccent,
      fontSize: 17,
      fontWeight: '900',
      textAlign: 'center',
    },
    addSetButton: {
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
      borderCurve: 'continuous',
      borderRadius: 999,
      justifyContent: 'center',
      minHeight: 56,
    },
    addSetLabel: {
      color: colors.textPrimary,
      fontSize: 17,
      fontWeight: '800',
    },
    centerState: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: Spacing.three,
    },
    check: {
      color: colors.accent,
      fontSize: 20,
      fontWeight: '900',
      width: 24,
    },
    collapsedSetLine: {
      color: colors.textMuted,
      fontSize: 16,
      fontVariant: ['tabular-nums'],
      lineHeight: 24,
    },
    colPrevious: {
      flex: 1.3,
    },
    colReps: {
      flex: 1,
    },
    colSet: {
      width: 48,
    },
    colWeight: {
      flex: 1,
    },
    container: {
      maxWidth: MaxContentWidth,
      width: '100%',
    },
    content: {
      alignItems: 'center',
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.six,
    },
    deleteLabel: {
      color: colors.error,
    },
    disabled: {
      opacity: 0.35,
    },
    emptyBlock: {
      alignItems: 'center',
      gap: Spacing.three,
      paddingHorizontal: Spacing.five,
      paddingVertical: Spacing.eight,
    },
    emptyText: {
      color: colors.textPrimary,
      fontSize: 20,
      lineHeight: 28,
      textAlign: 'center',
    },
    emptyTitle: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: '900',
      lineHeight: 28,
      textAlign: 'center',
    },
    exerciseBlock: {
      gap: Spacing.two,
    },
    exerciseCopy: {
      flex: 1,
      minWidth: 0,
    },
    exerciseHeaderRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: Spacing.three,
      minHeight: 72,
      paddingVertical: Spacing.one,
    },
    exerciseHelp: {
      bottom: 2,
      color: colors.textMuted,
      fontSize: 10,
      position: 'absolute',
      right: 5,
    },
    exerciseList: {
      gap: Spacing.four,
      paddingVertical: Spacing.five,
    },
    exerciseMenuButton: {
      alignItems: 'center',
      height: 42,
      justifyContent: 'center',
      width: 42,
    },
    exerciseMenuLabel: {
      color: colors.accent,
      fontSize: 20,
      fontWeight: '900',
      letterSpacing: 1,
      lineHeight: 22,
    },
    exerciseNotesInput: {
      color: colors.textPrimary,
      fontSize: 18,
      minHeight: 42,
      paddingVertical: Spacing.one,
    },
    exerciseThumb: {
      alignItems: 'center',
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: 8,
      borderWidth: StyleSheet.hairlineWidth,
      height: 72,
      justifyContent: 'center',
      width: 66,
    },
    exerciseThumbLabel: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: '900',
    },
    exerciseTitle: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: '500',
      lineHeight: 29,
    },
    expandedPanel: {
      gap: Spacing.three,
      paddingBottom: Spacing.two,
    },
    header: {
      alignItems: 'center',
      borderBottomColor: colors.borderSubtle,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingBottom: Spacing.two,
      paddingHorizontal: Spacing.three,
    },
    headerTitle: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '900',
    },
    menuAction: {
      minHeight: 50,
      justifyContent: 'center',
    },
    menuActionLabel: {
      color: colors.textPrimary,
      fontSize: 17,
      fontWeight: '800',
    },
    menuOverlay: {
      ...StyleSheet.absoluteFill,
      backgroundColor: colors.overlay,
      justifyContent: 'flex-end',
      paddingHorizontal: Spacing.three,
    },
    menuPanel: {
      backgroundColor: colors.surfacePrimary,
      borderCurve: 'continuous',
      borderRadius: 22,
      gap: Spacing.one,
      padding: Spacing.three,
    },
    menuTitle: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '900',
      marginBottom: Spacing.one,
    },
    navButton: {
      minWidth: 72,
      paddingVertical: Spacing.two,
    },
    navButtonLabel: {
      color: colors.accent,
      fontSize: 17,
      fontWeight: '600',
    },
    notesInput: {
      color: colors.textPrimary,
      fontSize: 20,
      lineHeight: 28,
      minHeight: 46,
      paddingVertical: Spacing.one,
    },
    pickerHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingBottom: Spacing.three,
    },
    pickerOverlay: {
      ...StyleSheet.absoluteFill,
      backgroundColor: colors.overlay,
      justifyContent: 'flex-end',
    },
    pickerPanel: {
      backgroundColor: colors.surfacePrimary,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '78%',
      padding: Spacing.three,
    },
    pickerRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.three,
      minHeight: 64,
    },
    pickerRowCopy: {
      flex: 1,
      minWidth: 0,
    },
    pickerRowMeta: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '700',
      marginTop: 3,
    },
    pickerRowTitle: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '900',
    },
    pickerTitle: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: '900',
    },
    planInput: {
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: 8,
      borderWidth: StyleSheet.hairlineWidth,
      color: colors.textPrimary,
      fontSize: 17,
      height: 46,
      textAlign: 'center',
    },
    planPrevious: {
      color: colors.textSecondary,
      fontSize: 17,
      lineHeight: 46,
    },
    planSetRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.three,
    },
    planSetText: {
      color: colors.textPrimary,
      fontSize: 18,
      lineHeight: 46,
    },
    planTableHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.three,
    },
    pressed: {
      opacity: 0.72,
    },
    restTimer: {
      color: colors.accent,
      fontSize: 18,
      fontWeight: '800',
    },
    screen: {
      backgroundColor: colors.background,
      flex: 1,
    },
    tableHeaderText: {
      color: colors.textMuted,
      fontSize: 15,
      fontWeight: '700',
    },
    textButton: {
      paddingVertical: Spacing.two,
    },
    textButtonLabel: {
      color: colors.accent,
      fontSize: 16,
      fontWeight: '800',
    },
    titleInput: {
      color: colors.textPrimary,
      fontSize: 30,
      fontWeight: '900',
      lineHeight: 36,
      paddingVertical: Spacing.one,
    },
  });
