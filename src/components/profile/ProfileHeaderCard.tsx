import { Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing, Typography } from '@/constants/theme';

type ProfileHeaderCardProps = {
  rows: Array<{ label: string; value: string }>;
};

export function ProfileHeaderCard({ rows }: ProfileHeaderCardProps) {
  return (
    <AppCard>
      <Text style={styles.title}>Account snapshot</Text>
      <Text style={styles.helpText}>A quick view of the values that shape training and nutrition recommendations.</Text>

      {rows.map((row) => (
        <View key={row.label} style={styles.row}>
          <Text style={styles.label}>{row.label}</Text>
          <Text style={styles.value}>{row.value}</Text>
        </View>
      ))}
    </AppCard>
  );
}

const styles = {
  title: {
    color: Colors.dark.text,
    fontSize: Typography.sectionTitle.fontSize,
    fontWeight: Typography.sectionTitle.fontWeight,
    letterSpacing: Typography.sectionTitle.letterSpacing,
    lineHeight: Typography.sectionTitle.lineHeight,
    textTransform: Typography.sectionTitle.textTransform,
  },
  helpText: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
    marginBottom: Spacing.two,
  },
  row: {
    alignItems: 'center' as const,
    borderColor: Colors.dark.border,
    borderTopWidth: 1,
    flexDirection: 'row' as const,
    gap: Spacing.three,
    justifyContent: 'space-between' as const,
    paddingTop: Spacing.two,
  },
  label: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
  },
  value: {
    color: Colors.dark.text,
    flex: 1,
    fontSize: Typography.bodyStrong.fontSize,
    fontWeight: Typography.bodyStrong.fontWeight,
    lineHeight: Typography.bodyStrong.lineHeight,
    textAlign: 'right' as const,
  },
};
