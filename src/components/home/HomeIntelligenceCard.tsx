import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { Colors, Radii, Spacing, Typography } from '@/constants/theme';

type IntelligenceTileProps = {
  detail: string;
  label: string;
  tone?: 'neutral' | 'positive' | 'warning';
  value: string;
};

function IntelligenceTile({ detail, label, tone = 'neutral', value }: IntelligenceTileProps) {
  return (
    <View style={[styles.tile, tone === 'positive' && styles.tilePositive, tone === 'warning' && styles.tileWarning]}>
      <Text selectable style={styles.tileLabel}>
        {label}
      </Text>
      <Text selectable style={styles.tileValue}>
        {value}
      </Text>
      <Text selectable style={styles.tileDetail}>
        {detail}
      </Text>
    </View>
  );
}

type HomeIntelligenceCardProps = {
  motivation: string;
  nutritionDetail: string;
  nutritionStatus: string;
  primaryRecommendation: string;
  recoveryDetail: string;
  recoveryStatus: string;
  trainingFocus: string;
};

export function HomeIntelligenceCard({ motivation, nutritionDetail, nutritionStatus, primaryRecommendation, recoveryDetail, recoveryStatus, trainingFocus }: HomeIntelligenceCardProps) {
  return (
    <AppCard>
      <View style={styles.header}>
        <Text selectable style={styles.title}>
          Fitness intelligence
        </Text>
        <Text selectable style={styles.subtitle}>
          Deterministic local recommendations from training, recovery, and nutrition data.
        </Text>
      </View>

      <View style={styles.primaryRecommendation}>
        <Text selectable style={styles.primaryLabel}>
          Today’s recommendation
        </Text>
        <Text selectable style={styles.primaryValue}>
          {primaryRecommendation}
        </Text>
      </View>

      <View style={styles.grid}>
        <IntelligenceTile detail={recoveryDetail} label="Recovery status" tone={recoveryStatus === 'Overloaded' || recoveryStatus === 'Recovery Delayed' ? 'warning' : 'positive'} value={recoveryStatus} />
        <IntelligenceTile detail={nutritionDetail} label="Nutrition status" tone={nutritionStatus === 'Over-eating' ? 'warning' : nutritionStatus === 'Under-eating' || nutritionStatus === 'Protein short' ? 'warning' : 'positive'} value={nutritionStatus} />
        <IntelligenceTile detail="Primary focus from the current local rules." label="Training focus" tone="neutral" value={trainingFocus} />
        <IntelligenceTile detail={motivation} label="Motivation insight" tone="positive" value={motivation} />
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  header: {
    gap: 4,
    marginBottom: Spacing.two,
  },
  primaryLabel: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.label.fontWeight,
    textTransform: 'uppercase',
  },
  primaryRecommendation: {
    backgroundColor: Colors.dark.surfaceAccent,
    borderColor: Colors.dark.borderSubtle,
    borderCurve: 'continuous',
    borderRadius: Radii.large,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
    marginBottom: Spacing.two,
    padding: Spacing.four,
  },
  primaryValue: {
    color: Colors.dark.textPrimary,
    fontSize: Typography.bodyEmphasized.fontSize,
    fontWeight: Typography.bodyEmphasized.fontWeight,
    lineHeight: Typography.bodyEmphasized.lineHeight,
  },
  subtitle: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.callout.fontSize,
    lineHeight: Typography.callout.lineHeight,
  },
  tile: {
    backgroundColor: Colors.dark.surfaceSecondary,
    borderColor: Colors.dark.borderSubtle,
    borderCurve: 'continuous',
    borderRadius: Radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flexGrow: 1,
    gap: 2,
    minWidth: 150,
    padding: Spacing.three,
  },
  tileDetail: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
  },
  tileLabel: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.label.fontWeight,
    textTransform: 'uppercase',
  },
  tilePositive: {
    backgroundColor: Colors.dark.successSoft,
    borderColor: Colors.dark.success,
  },
  tileValue: {
    color: Colors.dark.textPrimary,
    fontSize: Typography.bodyEmphasized.fontSize,
    fontWeight: Typography.bodyEmphasized.fontWeight,
    lineHeight: Typography.bodyEmphasized.lineHeight,
  },
  tileWarning: {
    backgroundColor: Colors.dark.warningSoft,
    borderColor: Colors.dark.warning,
  },
  title: {
    color: Colors.dark.textPrimary,
    fontSize: Typography.cardTitle.fontSize,
    fontWeight: Typography.cardTitle.fontWeight,
    lineHeight: Typography.cardTitle.lineHeight,
  },
});
