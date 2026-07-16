import { Text } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { ListRow } from '@/components/ui/ListRow';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { APPEARANCE_LABELS, APPEARANCE_MODES, type AppearanceMode } from '@/constants/theme';
import { Colors, Spacing, Typography } from '@/constants/theme';

type ProfilePreferencesCardProps = {
  activityLevel: string;
  appearanceMode: AppearanceMode;
  goalType: string;
  onAppearanceModeChange: (mode: AppearanceMode) => void;
  trainingDaysPerWeek: string;
};

export function ProfilePreferencesCard({
  activityLevel,
  appearanceMode,
  goalType,
  onAppearanceModeChange,
  trainingDaysPerWeek,
}: ProfilePreferencesCardProps) {
  return (
    <AppCard>
      <Text style={styles.title}>Preferences</Text>
      <Text style={styles.helpText}>These values shape the numbers you see across the app.</Text>

      <ListRow title="Goal type" value={goalType} />
      <ListRow title="Activity level" value={activityLevel} />
      <ListRow title="Training days" value={trainingDaysPerWeek} />

      <Text style={styles.appearanceLabel}>Appearance</Text>
      <Text style={styles.helpTextCompact}>{APPEARANCE_LABELS[appearanceMode]} mode will be used across the app.</Text>
      <SegmentedControl
        accessibilityLabel="Appearance"
        onChange={onAppearanceModeChange}
        options={APPEARANCE_MODES}
        value={appearanceMode}
      />

      <Text style={styles.note}>Edit training targets in Goals.</Text>
    </AppCard>
  );
}

const styles = {
  appearanceLabel: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.label.fontSize,
    fontWeight: Typography.label.fontWeight,
    lineHeight: Typography.label.lineHeight,
    marginTop: Spacing.two,
  },
  helpText: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.callout.fontSize,
    lineHeight: Typography.callout.lineHeight,
    marginBottom: Spacing.two,
  },
  helpTextCompact: {
    color: Colors.dark.textMuted,
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
    color: Colors.dark.textPrimary,
    fontSize: Typography.cardTitle.fontSize,
    fontWeight: Typography.cardTitle.fontWeight,
    lineHeight: Typography.cardTitle.lineHeight,
  },
};
