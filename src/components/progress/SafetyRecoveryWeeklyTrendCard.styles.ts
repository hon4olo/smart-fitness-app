import { StyleSheet } from 'react-native';

import { Colors, Radii, Spacing } from '@/constants/theme';

export const safetyRecoveryWeeklyTrendStyles = StyleSheet.create({
  chartContent: {
    alignItems: 'flex-end',
    gap: Spacing.two,
    paddingRight: Spacing.one,
  },
  chartHelp: {
    color: Colors.dark.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  chartPair: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 4,
    height: 100,
  },
  chartViewport: {
    marginHorizontal: -Spacing.one,
    paddingHorizontal: Spacing.one,
  },
  detailActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  detailCard: {
    backgroundColor: Colors.dark.surfaceSecondary,
    borderColor: Colors.dark.borderSubtle,
    borderRadius: Radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
    padding: Spacing.three,
  },
  detailHeader: {
    gap: 2,
  },
  detailLabel: {
    color: Colors.dark.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  detailTitle: {
    color: Colors.dark.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  emptyText: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  emptyTrackContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  emptyTrackLabel: {
    color: Colors.dark.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  header: {
    gap: 2,
  },
  historyButton: {
    alignItems: 'center',
    backgroundColor: Colors.dark.accentSoft,
    borderColor: Colors.dark.accent,
    borderRadius: Radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: Spacing.three,
  },
  historyButtonLabel: {
    color: Colors.dark.accent,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  legendDot: {
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  legendItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  legendLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  loadBar: {
    backgroundColor: Colors.dark.chartPrimary,
    borderRadius: Radii.small,
    width: '100%',
  },
  loadLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 14,
    textAlign: 'center',
  },
  loadLegendBar: {
    backgroundColor: Colors.dark.chartPrimary,
    borderRadius: 999,
    height: 9,
    width: 4,
  },
  loadTrack: {
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: Radii.small,
    height: 96,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    width: 8,
  },
  periodChip: {
    alignItems: 'center',
    backgroundColor: Colors.dark.surfaceSecondary,
    borderColor: Colors.dark.borderSubtle,
    borderRadius: Radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: 36,
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
  statusSegment: {
    minHeight: 2,
    width: '100%',
  },
  statusTrack: {
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: Radii.small,
    height: 96,
    overflow: 'hidden',
    width: 24,
  },
  subtitle: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  summaryItem: {
    flex: 1,
    gap: 2,
  },
  summaryLabel: {
    color: Colors.dark.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.three,
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
  weekColumn: {
    alignItems: 'center',
    borderColor: 'transparent',
    borderRadius: Radii.small,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 3,
    paddingVertical: 3,
    width: 44,
  },
  weekColumnSelected: {
    backgroundColor: Colors.dark.accentSoft,
    borderColor: Colors.dark.accent,
  },
  weekCount: {
    color: Colors.dark.textPrimary,
    fontSize: 10,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
    lineHeight: 14,
    textAlign: 'center',
  },
  weekLabel: {
    color: Colors.dark.textMuted,
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
    width: '100%',
  },
});
