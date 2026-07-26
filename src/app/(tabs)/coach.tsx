import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Colors, MaxContentWidth, Spacing, Typography } from '@/constants/theme';
import { useLocalization } from '@/localization';

const COACH_ACTIONS = [
  {
    labelKey: 'coach.addRecoveryCheckIn' as const,
    route: '/profile/recovery-check-in' as const,
  },
  {
    labelKey: 'coach.manageLimitations' as const,
    route: '/profile/limitations' as const,
  },
  {
    labelKey: 'coach.openSafetyRecovery' as const,
    route: '/profile/safety-recovery' as const,
  },
  {
    labelKey: 'coach.openCombinedReview' as const,
    route: '/profile/combined-review' as const,
  },
  {
    labelKey: 'coach.openCombinedProposal' as const,
    route: '/profile/combined-proposal' as const,
  },
] as const;

export default function CoachScreen() {
  const { t } = useLocalization();
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingBottom: safeAreaInsets.bottom + 120 },
      ]}
      showsVerticalScrollIndicator={false}
      style={styles.screen}>
      <View style={styles.container}>
        <SectionHeader title={t('tabs.coach')} subtitle={t('coach.screenSubtitle')} />
        <AppCard>
          <Text style={styles.title}>{t('coach.toolsTitle')}</Text>
          <Text style={styles.body}>{t('coach.toolsBody')}</Text>
          <View style={styles.actions}>
            {COACH_ACTIONS.map((action) => (
              <AppButton
                key={action.route}
                label={t(action.labelKey)}
                onPress={() => router.push(action.route)}
                variant="secondary"
              />
            ))}
          </View>
        </AppCard>
        <AppCard>
          <Text style={styles.title}>{t('coach.registrationProfileTitle')}</Text>
          <Text style={styles.body}>{t('coach.registrationProfileBody')}</Text>
          <AppButton
            label={t('coach.openProfile')}
            onPress={() => router.push('/(tabs)/profile')}
            variant="secondary"
          />
        </AppCard>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  actions: { gap: Spacing.two, marginTop: Spacing.two },
  body: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
  },
  container: { gap: Spacing.three, maxWidth: MaxContentWidth, width: '100%' },
  content: { alignItems: 'center', padding: Spacing.three },
  screen: { backgroundColor: Colors.dark.background, flex: 1 },
  title: {
    color: Colors.dark.textPrimary,
    fontSize: Typography.cardTitle.fontSize,
    fontWeight: Typography.cardTitle.fontWeight,
    lineHeight: Typography.cardTitle.lineHeight,
  },
});
