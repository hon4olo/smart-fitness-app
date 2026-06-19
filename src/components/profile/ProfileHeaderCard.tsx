import { Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing } from '@/constants/theme';

type ProfileHeaderRow = {
  label: string;
  value: string;
};

type ProfileHeaderCardProps = {
  rows: ProfileHeaderRow[];
};

export function ProfileHeaderCard({ rows }: ProfileHeaderCardProps) {
  return (
    <AppCard>
      <Text style={styles.title}>At a glance</Text>
      <Text style={styles.helpText}>A quick snapshot of the profile values used throughout the app.</Text>

      {rows.map((row) => (
        <View key={row.label} style={styles.row}>
          <Text selectable style={styles.label}>
            {row.label}
          </Text>
          <Text selectable style={styles.value}>
            {row.value}
          </Text>
        </View>
      ))}
    </AppCard>
  );
}

const styles = {
  title: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '800' as const,
    letterSpacing: 0.4,
    marginBottom: 2,
    textTransform: 'uppercase' as const,
  },
  helpText: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 19,
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
    fontSize: 15,
  },
  value: {
    color: Colors.dark.text,
    flex: 1,
    fontSize: 16,
    fontWeight: '800' as const,
    textAlign: 'right' as const,
  },
};
