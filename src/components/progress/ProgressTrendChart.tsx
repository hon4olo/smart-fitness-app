import { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Radii, Spacing, Typography } from '@/constants/theme';

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

export const ProgressTrendChart = memo(function ProgressTrendChart({
  barColor = Colors.dark.chartPrimary,
  emptyLabel,
  maxLabel,
  minLabel,
  points,
}: ProgressTrendChartProps) {
  const chartMetrics = useMemo(() => {
    if (points.length < 2) {
      return null;
    }

    const minValue = points.reduce((min, point) => Math.min(min, point.value), points[0].value);
    const maxValue = points.reduce((max, point) => Math.max(max, point.value), points[0].value);
    const range = maxValue - minValue;
    const scaleRange = Math.max(range, Math.max(Math.abs(maxValue), 1) * 0.12);

    return {
      bars: points.map((point) => {
        const normalized = range === 0 ? 0.5 : (point.value - minValue) / scaleRange;
        const height = 24 + Math.min(1, Math.max(0, normalized)) * 76;

        return {
          ...point,
          height,
        };
      }),
    };
  }, [points]);

  if (!chartMetrics) {
    return <Text style={styles.emptyText}>{emptyLabel}</Text>;
  }

  return (
    <View
      accessible
      accessibilityHint="A compact bar chart showing recent trend values."
      accessibilityLabel={`Progress trend chart. ${maxLabel} is the highest value and ${minLabel} is the lowest value.`}
      style={styles.chartShell}>
      <View style={styles.chartRangeRow}>
        <Text style={styles.chartRangeLabel}>{maxLabel}</Text>
        <Text style={styles.chartRangeLabel}>{minLabel}</Text>
      </View>

      <View style={styles.chartContent}>
        <View style={styles.chartBaseline} />
        <View style={styles.chartBars}>
          {chartMetrics.bars.map((point) => (
            <View key={point.key} style={styles.chartBarColumn}>
              <Text numberOfLines={1} style={styles.chartValueLabel}>
                {point.displayValue}
              </Text>
              <View style={styles.chartBarTrack}>
                <View style={[styles.chartBar, { backgroundColor: barColor, height: point.height }]} />
              </View>
              <Text numberOfLines={1} style={styles.chartBarLabel}>
                {point.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  chartBar: {
    borderRadius: 999,
    minHeight: 24,
    width: '100%',
  },
  chartBarColumn: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  chartBarLabel: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.caption.fontSize,
    textAlign: 'center',
  },
  chartBarTrack: {
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: Radii.medium,
    height: 96,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    padding: 2,
    width: '100%',
  },
  chartBars: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  chartBaseline: {
    backgroundColor: Colors.dark.divider,
    bottom: 34,
    height: 1,
    left: 0,
    opacity: 0.7,
    position: 'absolute',
    right: 0,
  },
  chartContent: {
    flex: 1,
    position: 'relative',
  },
  chartRangeLabel: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.caption.fontSize,
    fontVariant: ['tabular-nums'],
    fontWeight: Typography.label.fontWeight,
  },
  chartRangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  chartShell: {
    marginTop: Spacing.one,
  },
  chartValueLabel: {
    color: Colors.dark.textPrimary,
    fontSize: Typography.caption.fontSize,
    fontVariant: ['tabular-nums'],
    fontWeight: Typography.button.fontWeight,
  },
  emptyText: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.callout.fontSize,
    lineHeight: Typography.callout.lineHeight,
  },
});
