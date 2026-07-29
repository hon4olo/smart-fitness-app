import { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing, Typography } from '@/constants/theme';
import { useLocalization } from '@/localization';

export type ProgressTrendPoint = {
  key: string;
  label: string;
  value: number;
  displayValue: string;
};

type ProgressTrendChartProps = {
  barColor?: string;
  emptyLabel: string;
  maxLabel: string;
  minLabel: string;
  points: ProgressTrendPoint[];
};

const PLOT_HEIGHT = 168;
const MIN_BAR_HEIGHT = 18;

export const ProgressTrendChart = memo(function ProgressTrendChart({
  barColor = Colors.dark.chartPrimary,
  emptyLabel,
  maxLabel,
  minLabel,
  points,
}: ProgressTrendChartProps) {
  const { t } = useLocalization();
  const chartMetrics = useMemo(() => {
    if (points.length < 2) return null;

    const minValue = Math.min(...points.map((point) => point.value));
    const maxValue = Math.max(...points.map((point) => point.value));
    const visibleRange = Math.max(maxValue - minValue, Math.max(Math.abs(maxValue), 1) * 0.08);
    const axisMinimum = minValue - visibleRange * 0.18;
    const axisMaximum = maxValue + visibleRange * 0.08;
    const axisRange = Math.max(axisMaximum - axisMinimum, 1);
    const midpoint = axisMinimum + axisRange / 2;

    return {
      axisLabels: [
        { key: 'maximum', value: maxLabel },
        { key: 'midpoint', value: midpoint.toFixed(1) },
        { key: 'minimum', value: minLabel },
      ],
      bars: points.map((point) => ({
        ...point,
        height: Math.max(
          MIN_BAR_HEIGHT,
          ((point.value - axisMinimum) / axisRange) * (PLOT_HEIGHT - 8),
        ),
      })),
    };
  }, [maxLabel, minLabel, points]);

  if (!chartMetrics) {
    return <Text style={styles.emptyText}>{emptyLabel}</Text>;
  }

  return (
    <View
      accessible
      accessibilityHint={t('progress.chartHint')}
      accessibilityLabel={t('progress.chartLabel', { max: maxLabel, min: minLabel })}
      style={styles.chartShell}>
      <View style={styles.plotRow}>
        <View style={styles.plot}>
          <View style={[styles.horizontalGrid, styles.gridTop]} />
          <View style={[styles.horizontalGrid, styles.gridMiddle]} />
          <View style={[styles.horizontalGrid, styles.gridBottom]} />
          <View style={styles.barsRow}>
            {chartMetrics.bars.map((point, index) => (
              <View key={point.key} style={styles.column}>
                {index > 0 ? <View style={styles.verticalGrid} /> : null}
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.bar,
                      {
                        backgroundColor: barColor,
                        height: point.height,
                        opacity: index === chartMetrics.bars.length - 1 ? 1 : 0.72,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.axis}>
          {chartMetrics.axisLabels.map((axisLabel) => (
            <Text key={axisLabel.key} numberOfLines={1} style={styles.axisLabel}>
              {axisLabel.value}
            </Text>
          ))}
        </View>
      </View>
      <View style={styles.labelsRow}>
        {chartMetrics.bars.map((point) => (
          <Text key={point.key} numberOfLines={1} style={styles.xLabel}>
            {point.label}
          </Text>
        ))}
        <View style={styles.axisSpacer} />
      </View>
      <Text numberOfLines={1} style={styles.latestValue}>
        {chartMetrics.bars.at(-1)?.displayValue}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  axis: {
    height: PLOT_HEIGHT,
    justifyContent: 'space-between',
    paddingLeft: Spacing.two,
    width: 58,
  },
  axisLabel: {
    color: Colors.dark.textMuted,
    fontSize: Typography.caption.fontSize,
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
  axisSpacer: { width: 58 },
  bar: {
    borderRadius: 4,
    minHeight: MIN_BAR_HEIGHT,
    width: 18,
  },
  barTrack: {
    alignItems: 'center',
    height: PLOT_HEIGHT,
    justifyContent: 'flex-end',
    width: '100%',
  },
  barsRow: {
    flex: 1,
    flexDirection: 'row',
  },
  chartShell: {
    backgroundColor: Colors.dark.surfaceSecondary,
    borderColor: Colors.dark.borderSubtle,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.one,
    overflow: 'hidden',
    padding: Spacing.three,
  },
  column: {
    flex: 1,
    position: 'relative',
  },
  emptyText: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.callout.fontSize,
    lineHeight: Typography.callout.lineHeight,
  },
  gridBottom: { bottom: 0 },
  gridMiddle: { top: PLOT_HEIGHT / 2 },
  gridTop: { top: 0 },
  horizontalGrid: {
    backgroundColor: Colors.dark.textMuted,
    height: StyleSheet.hairlineWidth,
    left: 0,
    opacity: 0.42,
    position: 'absolute',
    right: 0,
  },
  labelsRow: {
    flexDirection: 'row',
  },
  latestValue: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.caption.fontSize,
    fontVariant: ['tabular-nums'],
    fontWeight: Typography.label.fontWeight,
    textAlign: 'right',
  },
  plot: {
    flex: 1,
    height: PLOT_HEIGHT,
    position: 'relative',
  },
  plotRow: {
    flexDirection: 'row',
  },
  verticalGrid: {
    borderLeftColor: Colors.dark.textMuted,
    borderLeftWidth: StyleSheet.hairlineWidth,
    bottom: 0,
    left: 0,
    opacity: 0.32,
    position: 'absolute',
    top: 0,
  },
  xLabel: {
    color: Colors.dark.textSecondary,
    flex: 1,
    fontSize: Typography.caption.fontSize,
    textAlign: 'center',
  },
});
