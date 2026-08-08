import { StyleSheet } from 'react-native';

import { Colors, Radii, Spacing } from '@/constants/theme';

export const safetyRecoveryProgressCardStyles = StyleSheet.create({
  comparisonCell: {
    flexBasis: '46%',
    gap: 2,
  },
  comparisonDetail: {
    color: Colors.dark.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },
  comparisonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  comparisonLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  comparisonValue: {
    color: Colors.dark.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 24,
  },
  contextNote: {
    color: Colors.dark.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  emptyText: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  header: {
    gap: 2,
  },
  loadTrendValue: {
    color: Colors.dark.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  movementCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  movementLabel: {
    color: Colors.dark.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  movementList: {
    gap: Spacing.two,
  },
  movementRow: {
    alignItems: 'center',
    borderColor: Colors.dark.divider,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
  },
  movementShare: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 19,
  },
  periodChip: {
    alignItems: 'center',
    backgroundColor: Colors.dark.surfaceSecondary,
    borderColor: Colors.dark.borderSubtle,
    borderRadius: Radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: Spacing.three,
  },
  periodChipLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  periodChipLabelSelected: {
    color: Colors.dark.accent,
  },
  periodChipSelected: {
    backgroundColor: Colors.dark.accentSoft,
    borderColor: Colors.dark.accent,
  },
  periodHelp: {
    color: Colors.dark.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  periodLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  periodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  periodSection: {
    gap: Spacing.one,
  },
  pressed: {
    opacity: 0.68,
  },
  section: {
    gap: Spacing.one,
  },
  sectionHelp: {
    color: Colors.dark.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  sectionTitle: {
    color: Colors.dark.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 21,
  },
  statusCopy: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
  },
  statusDelta: {
    color: Colors.dark.textMuted,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'right',
  },
  statusDot: {
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  statusLabel: {
    color: Colors.dark.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  statusList: {
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  statusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  statusValue: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 19,
    textAlign: 'right',
  },
  statusValueCopy: {
    alignItems: 'flex-end',
    flexShrink: 1,
    gap: 1,
  },
  subtitle: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  summaryCell: {
    flexBasis: '46%',
    gap: 2,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  summaryLabel: {
    color: Colors.dark.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  summaryValue: {
    color: Colors.dark.textPrimary,
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
  },
  title: {
    color: Colors.dark.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },
});