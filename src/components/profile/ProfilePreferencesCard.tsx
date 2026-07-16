import { Text } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { ListRow } from '@/components/ui/ListRow';
import { Colors, Spacing, Typography } from '@/constants/theme';

type ProfilePreferencesCardProps = {
  activityLevel: string;
  goalType: string;
  trainingDaysPerWeek: string;
};

export function ProfilePreferencesCard({ activityLevel, goalType, trainingDaysPerWeek }: ProfilePreferencesCardProps) {
  return (
    <AppCard>
      <Text style={styles.title}>Preferences</Text>
      <Text style={styles.helpText}>These values shape the numbers you see across the app.</Text>

      <ListRow title="Goal type" value={goalType} />
      <ListRow title="Activity level" value={activityLevel} />
      <ListRow title="Training days" value={trainingDaysPerWeek} />

      <Text style={styles.note}>Edit these in Goals.</Text>
    </AppCard>
  );
}

const styles = {
  helpText: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
    marginBottom: Spacing.two,
  },
  note: {
    color: Colors.dark.textMuted,
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
    marginTop: Spacing.one,
  },
  title: {
    color: Colors.dark.text,
    fontSize: Typography.sectionTitle.fontSize,
    fontWeight: Typography.sectionTitle.fontWeight,
    letterSpacing: Typography.sectionTitle.letterSpacing,
    lineHeight: Typography.sectionTitle.lineHeight,
    textTransform: Typography.sectionTitle.textTransform,
  },
};
