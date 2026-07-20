import { StyleSheet } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';

export const styles = StyleSheet.create({
  collapsibleHeader: {
    paddingBottom: Spacing.two,
  },
  clearFiltersButton: {
    backgroundColor: Colors.dark.backgroundSelected,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: Spacing.two,
    paddingVertical: 8,
  },
  clearFiltersText: {
    color: Colors.dark.text,
    fontSize: 12,
    fontWeight: '800',
  },
  customActions: {
    alignItems: 'flex-start',
  },
  customForm: {
    gap: Spacing.two,
  },
  detailBulletDot: {
    color: Colors.dark.accent,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 22,
    width: 16,
  },
  detailBulletList: {
    gap: Spacing.one,
  },
  detailBulletRow: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  detailBulletText: {
    color: Colors.dark.textSecondary,
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  detailEmpty: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  exerciseActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
    justifyContent: 'flex-end',
  },
  exerciseMain: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  exerciseMeta: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  exerciseMetaSecondary: {
    color: Colors.dark.accent,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  exerciseName: {
    color: Colors.dark.text,
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '800',
  },
  exerciseRow: {
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 16,
    borderWidth: 1,
    gap: Spacing.two,
    padding: Spacing.three,
  },
  exerciseSectionLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  exerciseTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  favoriteBadge: {
    color: Colors.dark.warning,
    fontSize: 14,
    fontWeight: '900',
  },
  favoriteToggle: {
    alignItems: 'center',
    backgroundColor: Colors.dark.backgroundSelected,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 14,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  favoriteToggleActive: {
    borderColor: Colors.dark.warning,
  },
  favoriteToggleLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 18,
    fontWeight: '900',
  },
  favoriteToggleLabelActive: {
    color: Colors.dark.warning,
  },
  filterChip: {
    alignItems: 'center',
    backgroundColor: Colors.dark.backgroundSelected,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: Spacing.two,
    paddingVertical: 8,
  },
  filterChipLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '800',
  },
  filterChipLabelSelected: {
    color: Colors.dark.text,
  },
  filterChipSelected: {
    borderColor: Colors.dark.accent,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  filterGroup: {
    gap: Spacing.one,
  },
  filterGroupTitle: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  filterHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterSection: {
    gap: Spacing.two,
  },
  headerContent: {
    flex: 1,
    gap: Spacing.one,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  highlight: {
    color: Colors.dark.accent,
    fontWeight: '900',
  },
  input: {
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 10,
    borderWidth: 1,
    color: Colors.dark.text,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: Spacing.two,
  },
  inputGroup: {
    gap: Spacing.one,
  },
  inputLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  pill: {
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 16,
    borderWidth: 1,
    gap: 2,
    minWidth: 145,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  pillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  pillLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  pillValue: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.78,
  },
  searchHint: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  searchSection: {
    gap: Spacing.one,
  },
  sectionBlock: {
    gap: Spacing.two,
  },
  sectionCount: {
    color: Colors.dark.accent,
    fontSize: 12,
    fontWeight: '900',
  },
  sectionHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionHeading: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '800',
  },
  sectionHint: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  sectionList: {
    gap: Spacing.two,
  },
  sectionTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '800',
  },
  similarActions: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  similarList: {
    gap: Spacing.two,
  },
  similarMain: {
    flex: 1,
    gap: 2,
  },
  similarMeta: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  similarName: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '800',
  },
  similarRow: {
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    padding: Spacing.two,
  },
  sheet: {
    backgroundColor: Colors.dark.backgroundElement,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    maxHeight: '92%',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetContent: {
    gap: Spacing.two,
    paddingBottom: Spacing.four,
  },
  sheetFavorite: {
    alignItems: 'center',
    backgroundColor: Colors.dark.backgroundSelected,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 14,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  sheetFavoriteActive: {
    borderColor: Colors.dark.warning,
  },
  sheetFavoriteLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 18,
    fontWeight: '900',
  },
  sheetFavoriteLabelActive: {
    color: Colors.dark.warning,
  },
  sheetFooter: {
    gap: Spacing.two,
    paddingTop: Spacing.one,
  },
  sheetHandle: {
    alignSelf: 'center',
    backgroundColor: Colors.dark.border,
    borderRadius: 999,
    height: 4,
    marginBottom: Spacing.two,
    width: 72,
  },
  sheetHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  sheetHeaderContent: {
    flex: 1,
    gap: 2,
  },
  sheetSubtitle: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  sheetTitle: {
    color: Colors.dark.text,
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
  },
  subtitle: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  toggle: {
    color: Colors.dark.accent,
    fontSize: 24,
    fontWeight: '700',
  },
});
