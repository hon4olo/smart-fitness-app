import { StyleSheet } from 'react-native';

import { Colors, MaxContentWidth, Radii, Spacing } from '@/constants/theme';

export const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    addButton: {
      alignItems: 'center',
      backgroundColor: colors.accent,
      borderCurve: 'continuous',
      borderRadius: 18,
      justifyContent: 'center',
      minHeight: 52,
    },
    addButtonDisabled: {
      opacity: 0.45,
    },
    addButtonLabel: {
      color: colors.background,
      fontSize: 15,
      fontWeight: '900',
    },
    addButtonPressed: {
      opacity: 0.88,
    },
    attribution: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: '700',
      lineHeight: 16,
      marginTop: Spacing.three,
      textAlign: 'center',
    },
    diagnostic: {
      color: colors.textMuted,
      fontSize: 10,
      fontWeight: '700',
      lineHeight: 14,
      textAlign: 'center',
    },
    diagnosticBlock: {
      gap: 1,
      marginTop: Spacing.one,
    },
    backButton: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderCurve: 'continuous',
      borderRadius: 999,
      height: 34,
      justifyContent: 'center',
      width: 34,
    },
    backLabel: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: '700',
      lineHeight: 22,
      marginTop: -1,
    },
    container: {
      maxWidth: MaxContentWidth,
      width: '100%',
    },
    content: {
      alignItems: 'stretch',
      gap: Spacing.two,
      paddingHorizontal: Spacing.three,
    },
    footer: {
      borderTopWidth: StyleSheet.hairlineWidth,
      bottom: 0,
      left: 0,
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.two,
      position: 'absolute',
      right: 0,
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.two,
    },
    headerCopy: {
      flex: 1,
      gap: 4,
      minWidth: 0,
    },
    itemContainer: {
      alignSelf: 'center',
      maxWidth: MaxContentWidth,
      width: '100%',
    },
    list: {
      gap: Spacing.two,
    },
    pressed: {
      opacity: 0.72,
    },
    retryButton: {
      backgroundColor: colors.accent,
      borderCurve: 'continuous',
      borderRadius: 14,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two,
    },
    retryLabel: {
      color: colors.background,
      fontSize: 13,
      fontWeight: '900',
    },
    scrollView: {
      flex: 1,
    },
    searchBar: {
      alignItems: 'center',
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: Spacing.one,
      marginTop: Spacing.three,
      paddingHorizontal: Spacing.three,
      paddingVertical: 10,
    },
    searchIcon: {
      color: colors.textSecondary,
      fontSize: 18,
      fontWeight: '700',
    },
    searchInput: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: 15,
      fontWeight: '600',
      minWidth: 0,
    },
    screen: {
      flex: 1,
    },
    section: {
      gap: Spacing.two,
      marginTop: Spacing.three,
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '900',
    },
    stateCard: {
      alignItems: 'center',
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      gap: Spacing.two,
      marginTop: Spacing.three,
      padding: Spacing.four,
    },
    stateText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '700',
      lineHeight: 20,
      textAlign: 'center',
    },
    stateTitle: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '900',
      lineHeight: 22,
      textAlign: 'center',
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: '900',
      lineHeight: 30,
    },
  });

export const createRowStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    copy: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    infoButton: {
      alignItems: 'center',
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      justifyContent: 'center',
      minHeight: 40,
      paddingHorizontal: Spacing.two,
    },
    infoLabel: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '900',
    },
    meta: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '700',
      lineHeight: 17,
      textTransform: 'capitalize',
    },
    name: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '900',
      lineHeight: 21,
    },
    pressed: {
      opacity: 0.72,
    },
    row: {
      alignItems: 'center',
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: Spacing.two,
      minHeight: 98,
      padding: Spacing.two,
    },
    rowSelected: {
      borderColor: colors.accent,
    },
    selection: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 999,
      height: 32,
      justifyContent: 'center',
      width: 32,
    },
    selectionLabel: {
      color: colors.textSecondary,
      fontSize: 16,
      fontWeight: '900',
    },
    selectionLabelSelected: {
      color: colors.background,
    },
    selectionSelected: {
      backgroundColor: colors.accent,
    },
    thumbnail: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderCurve: 'continuous',
      borderRadius: 14,
      height: 72,
      justifyContent: 'center',
      width: 72,
    },
    thumbnailLabel: {
      color: colors.textSecondary,
      fontSize: 22,
      fontWeight: '900',
    },
  });

export const createFilterStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    chip: {
      alignItems: 'center',
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      justifyContent: 'center',
      minHeight: 34,
      paddingHorizontal: Spacing.three,
      paddingVertical: 8,
    },
    chipActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    chipLabel: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '900',
      textTransform: 'capitalize',
    },
    chipLabelActive: {
      color: colors.background,
    },
    chips: {
      alignItems: 'center',
      gap: Spacing.two,
      paddingRight: Spacing.three,
    },
    chipScroll: {
      maxHeight: 38,
    },
    label: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: '900',
    },
    pressed: {
      opacity: 0.72,
    },
    section: {
      gap: Spacing.two,
      marginTop: Spacing.three,
    },
  });
