import { AppCard } from '@/components/ui/AppCard';
import { ListRow } from '@/components/ui/ListRow';
import { useLocalization } from '@/localization';

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
  const { t } = useLocalization();

  return (
    <AppCard>
      <ListRow title={t('profile.goalType')} value={goalType} />
      <ListRow title={t('profile.activityLevel')} value={activityLevel} />
      <ListRow title={t('profile.trainingDays')} value={trainingDaysPerWeek} />
    </AppCard>
  );
}
