import { StyleSheet } from 'react-native';

import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';

export const createShareWorkoutStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    backButton: {
      alignItems: 'center',
      borderColor: colors.borderSubtle,
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      height: 40,
      justifyContent: 'center',
      width: 40,
    },
    backLabel: {
      color: colors.textPrimary,
      fontSize: 28,
      fontWeight: '400',
      lineHeight: 30,
      marginTop: -2,
    },
    body: {
      color: colors.textSecondary,
      fontSize: 15,
      lineHeight: 21,
    },
    captionInput: {
      borderColor: colors.borderSubtle,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      color: colors.textPrimary,
      fontSize: 15,
      minHeight: 96,
      padding: Spacing.two,
    },
    cardTitle: {
      color: colors.textPrimary,
      fontSize: 17,
      fontWeight: '800',
      lineHeight: 22,
    },
    container: {
      gap: Spacing.three,
      maxWidth: MaxContentWidth,
      width: '100%',
    },
    content: {
      alignItems: 'center',
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.three,
    },
    fieldLabel: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: 15,
      fontWeight: '700',
    },
    fieldRow: {
      alignItems: 'center',
      borderBottomColor: colors.borderSubtle,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      minHeight: 52,
      paddingVertical: Spacing.one,
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.two,
    },
    headerCopy: {
      flex: 1,
      gap: 2,
    },
    label: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    mediaHeader: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: Spacing.two,
    },
    mediaHeaderCopy: {
      flex: 1,
      gap: 2,
    },
    mediaPreview: {
      aspectRatio: 4 / 3,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 12,
      width: '100%',
    },
    mediaWarning: {
      color: colors.warning,
      fontSize: 14,
      fontWeight: '700',
      lineHeight: 20,
    },
    pressed: {
      opacity: 0.72,
    },
    previewGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.one,
    },
    previewItem: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 10,
      gap: 2,
      minWidth: '47%',
      padding: Spacing.two,
    },
    previewLabel: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '700',
    },
    previewTitle: {
      color: colors.textPrimary,
      fontSize: 17,
      fontWeight: '800',
      lineHeight: 22,
    },
    previewValue: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '800',
    },
    progressFill: {
      backgroundColor: colors.accent,
      borderRadius: 999,
      height: '100%',
    },
    progressTrack: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 999,
      height: 8,
      overflow: 'hidden',
      width: '100%',
    },
    screen: {
      backgroundColor: colors.background,
      flex: 1,
    },
    section: {
      gap: Spacing.two,
    },
    successMark: {
      color: colors.accent,
      fontSize: 34,
      fontWeight: '900',
      textAlign: 'center',
    },
    switchControl: {
      transform: [{ scaleX: 0.86 }, { scaleY: 0.86 }],
    },
    title: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: '900',
      lineHeight: 29,
    },
  });

export type ShareWorkoutStyles = ReturnType<typeof createShareWorkoutStyles>;
