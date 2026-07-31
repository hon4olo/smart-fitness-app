import { Text } from 'react-native';
import { useRouter } from 'expo-router';

import { AppCard } from '@/components/ui/AppCard';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Colors, Typography } from '@/constants/theme';
import { useLocalization } from '@/localization';

import { getSocialProfileCopy } from './socialProfileCopy';

export function SocialProfileEntryCard() {
  const router = useRouter();
  const { locale } = useLocalization();
  const copy = getSocialProfileCopy(locale);

  return (
    <AppCard>
      <Text style={styles.title}>{copy.settingsTitle}</Text>
      <Text style={styles.description}>{copy.settingsDescription}</Text>
      <SecondaryButton
        label={copy.settingsAction}
        onPress={() => router.push('/settings/social-profile')}
      />
    </AppCard>
  );
}

const styles = {
  description: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
  },
  title: {
    color: Colors.dark.textPrimary,
    fontSize: Typography.cardTitle.fontSize,
    fontWeight: Typography.cardTitle.fontWeight,
    lineHeight: Typography.cardTitle.lineHeight,
  },
};
