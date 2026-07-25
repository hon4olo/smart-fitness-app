import { AppCard } from '@/components/ui/AppCard';
import { ListRow } from '@/components/ui/ListRow';

type ProfilePreferencesCardProps = {
  activityLevel: string;
  goalType: string;
  trainingDaysPerWeek: string;
};

export function ProfilePreferencesCard({
  activityLevel,
  goalType,
  trainingDaysPerWeek,
}: ProfilePreferencesCardProps) {
  return (
    <AppCard>
      <ListRow title="Goal type" value={goalType} />
      <ListRow title="Activity level" value={activityLevel} />
      <ListRow title="Training days" value={trainingDaysPerWeek} />
    </AppCard>
  );
}
