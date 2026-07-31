import { Text } from 'react-native';
import { useRouter } from 'expo-router';

import { AppCard } from '@/components/ui/AppCard';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Colors, Typography } from '@/constants/theme';
import { useLocalization } from '@/localization';

import { getSocialCommunityGuidelinesCopy } from './socialCommunityGuidelinesCopy';
import { getSocialFollowingFeedCopy } from './socialFollowingFeedCopy';
import { getSocialNotificationCopy } from './socialNotificationCopy';
import { getSocialProfileCopy } from './socialProfileCopy';
import { getSocialPublicProfileCopy } from './socialPublicProfileCopy';
import { getSocialRelationshipListsCopy } from './socialRelationshipListsCopy';

export function SocialProfileEntryCard() {
  const router = useRouter();
  const { locale } = useLocalization();
  const copy = getSocialProfileCopy(locale);
  const feedCopy = getSocialFollowingFeedCopy(locale);
  const guidelinesCopy = getSocialCommunityGuidelinesCopy(locale);
  const notificationCopy = getSocialNotificationCopy(locale);
  const publicCopy = getSocialPublicProfileCopy(locale);
  const relationshipCopy = getSocialRelationshipListsCopy(locale);

  return (
    <AppCard>
      <Text style={styles.title}>{copy.settingsTitle}</Text>
      <Text style={styles.description}>{copy.settingsDescription}</Text>
      <SecondaryButton
        label={notificationCopy.action}
        onPress={() => router.push('/social/notifications')}
      />
      <SecondaryButton
        label={feedCopy.entryAction}
        onPress={() => router.push('/social/feed')}
      />
      <SecondaryButton
        label={copy.settingsAction}
        onPress={() => router.push('/settings/social-profile')}
      />
      <SecondaryButton
        label={relationshipCopy.entryAction}
        onPress={() => router.push('/social/relationships')}
      />
      <SecondaryButton
        label={publicCopy.findAction}
        onPress={() => router.push('/social')}
      />
      <SecondaryButton
        label={guidelinesCopy.entryAction}
        onPress={() => router.push('/social/guidelines')}
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
