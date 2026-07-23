import { StyleSheet } from 'react-native';

import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';

export const createWorkoutSessionFinishStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    clearButton: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 999,
      height: 22,
      justifyContent: 'center',
      width: 22,
    },
    clearLabel: {
      color: colors.textMuted,
      fontSize: 18,
      fontWeight: '900',
      lineHeight: 20,
    },
    container: {
      maxWidth: MaxContentWidth,
      width: '100%',
    },
    content: {
      alignItems: 'center',
      paddingHorizontal: Spacing.three,
    },
    discardButton: {
      alignItems: 'center',
      borderTopColor: colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
      justifyContent: 'center',
      minHeight: 50,
    },
    discardLabel: {
      color: colors.error,
      fontSize: 15,
      fontWeight: '700',
    },
    footer: {
      alignItems: 'center',
      borderTopWidth: StyleSheet.hairlineWidth,
      bottom: 0,
      left: 0,
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.two,
      position: 'absolute',
      right: 0,
    },
    formStack: {
      gap: Spacing.two,
      paddingTop: Spacing.three,
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      minHeight: 44,
    },
    headerSpacer: {
      flex: 1,
    },
    healthIcon: {
      backgroundColor: '#FFFFFF',
    },
    infoChevron: {
      color: colors.textPrimary,
      fontSize: 20,
      lineHeight: 20,
    },
    infoIcon: {
      color: colors.textPrimary,
      fontSize: 21,
      lineHeight: 22,
      width: 30,
    },
    infoLabel: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: 16,
      lineHeight: 21,
    },
    infoRow: {
      alignItems: 'center',
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: 8,
      borderWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: Spacing.two,
      minHeight: 56,
      paddingHorizontal: Spacing.two,
    },
    integrationIcon: {
      alignItems: 'center',
      borderCurve: 'continuous',
      borderRadius: 6,
      height: 32,
      justifyContent: 'center',
      width: 32,
    },
    integrationIconLabel: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '900',
    },
    integrationLabel: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: 16,
      lineHeight: 21,
    },
    integrationList: {
      borderTopColor: colors.borderSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
      marginTop: Spacing.three,
    },
    integrationRow: {
      alignItems: 'center',
      borderBottomColor: colors.borderSubtle,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: Spacing.two,
      minHeight: 56,
      paddingVertical: 8,
    },
    loadingLabel: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '700',
    },
    loadingState: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: Spacing.three,
    },
    mediaButton: {
      alignItems: 'center',
      borderColor: colors.accent,
      borderCurve: 'continuous',
      borderRadius: 8,
      borderStyle: 'dashed',
      borderWidth: 1.5,
      gap: Spacing.one,
      height: 154,
      justifyContent: 'center',
      width: 154,
    },
    mediaIcon: {
      color: colors.textPrimary,
      fontSize: 25,
      lineHeight: 27,
    },
    mediaLabel: {
      color: colors.textPrimary,
      fontSize: 14,
      lineHeight: 18,
    },
    notesInput: {
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: 8,
      borderWidth: StyleSheet.hairlineWidth,
      color: colors.textPrimary,
      fontSize: 15,
      minHeight: 76,
      padding: Spacing.two,
    },
    pressed: {
      opacity: 0.72,
    },
    resumeButton: {
      alignItems: 'center',
      flex: 1,
      flexDirection: 'row',
      minHeight: 36,
    },
    resumeChevron: {
      color: colors.textPrimary,
      fontSize: 30,
      fontWeight: '300',
      lineHeight: 30,
      marginLeft: -6,
    },
    resumeLabel: {
      color: colors.textPrimary,
      fontSize: 15,
      lineHeight: 20,
    },
    saveButton: {
      alignItems: 'center',
      backgroundColor: colors.textPrimary,
      borderCurve: 'continuous',
      borderRadius: 999,
      justifyContent: 'center',
      minHeight: 58,
    },
    saveButtonDisabled: {
      opacity: 0.45,
    },
    saveButtonLabel: {
      color: colors.background,
      fontSize: 18,
      fontWeight: '900',
    },
    saveButtonLabelDisabled: {
      color: colors.textMuted,
    },
    screen: {
      backgroundColor: colors.background,
      flex: 1,
    },
    singleLineField: {
      alignItems: 'center',
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: 8,
      borderWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      minHeight: 56,
      paddingHorizontal: Spacing.two,
    },
    stravaIcon: {
      backgroundColor: '#FC4C02',
    },
    switchControl: {
      transform: [{ scaleX: 0.82 }, { scaleY: 0.82 }],
    },
    switchSlot: {
      alignItems: 'center',
      height: 34,
      justifyContent: 'center',
      marginRight: -5,
      width: 56,
    },
    title: {
      color: colors.textPrimary,
      flex: 2,
      fontSize: 18,
      fontWeight: '700',
      textAlign: 'center',
    },
    titleInput: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: 16,
      lineHeight: 21,
      paddingVertical: Spacing.one,
    },
  });

export type WorkoutSessionFinishStyles = ReturnType<typeof createWorkoutSessionFinishStyles>;
