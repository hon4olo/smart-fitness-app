import { View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { ListRow } from '@/components/ui/ListRow';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { APPEARANCE_LABELS, APPEARANCE_MODES, type AppearanceMode } from '@/constants/theme';
import { Spacing } from '@/constants/theme';

type ProfilePreferencesCardProps = {
  activityLevel: string;
  appearanceMode: AppearanceMode;
  goalType: string;
  onAppearanceModeChange: (mode: AppearanceMode) => void;
  trainingDaysPerWeek: string;
};

export function ProfilePreferencesCard({ activityLevel, appearanceMode, goalType, onAppearanceModeChange, trainingDaysPerWeek }: ProfilePreferencesCardProps) {
  return (
    <AppCard>
      <ListRow title="Goal type" value={goalType} />
      <ListRow title="Activity level" value={activityLevel} />
      <ListRow title="Training days" value={trainingDaysPerWeek} />
      <View style={styles.appearance}>
        <ListRow title="Appearance" value={APPEARANCE_LABELS[appearanceMode]} />
        <SegmentedControl accessibilityLabel="Appearance" onChange={onAppearanceModeChange} options={APPEARANCE_MODES} value={appearanceMode} />
      </View>
    </AppCard>
  );
}

const styles = {
  appearance: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
};
