import { router } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, MaxContentWidth, Spacing, Typography } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useLocalization } from '@/localization';

export default function AuthLandingScreen() {
  const { isRestoringState, onboardingCompleted } = useAppContext();
  const { isAuthenticated, ready } = useAuthSession();
  const { t } = useLocalization();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!ready || isRestoringState || !isAuthenticated) return;
    router.replace(onboardingCompleted ? '/' : '/onboarding');
  }, [isAuthenticated, isRestoringState, onboardingCompleted, ready]);

  if (!ready || isRestoringState || isAuthenticated) {
    return <View style={styles.screen} />;
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + Spacing.six, paddingTop: insets.top + Spacing.six },
      ]}
      style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>{t('auth.landingEyebrow')}</Text>
          <Text style={styles.title}>{t('auth.landingTitle')}</Text>
          <Text style={styles.subtitle}>{t('auth.landingSubtitle')}</Text>
        </View>
        <AppCard>
          <AppButton
            label={t('common.createAccount')}
            onPress={() => router.push('/auth/register')}
          />
          <AppButton
            label={t('common.signIn')}
            onPress={() => router.push('/auth/sign-in')}
            variant="secondary"
          />
        </AppCard>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.four, maxWidth: MaxContentWidth, width: '100%' },
  content: { alignItems: 'center', paddingHorizontal: Spacing.three },
  eyebrow: {
    color: Colors.dark.accent,
    fontSize: Typography.caption.fontSize,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  header: { gap: Spacing.two },
  screen: { backgroundColor: Colors.dark.background, flex: 1 },
  subtitle: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
  },
  title: {
    color: Colors.dark.textPrimary,
    fontSize: Typography.screenTitle.fontSize,
    fontWeight: Typography.screenTitle.fontWeight,
    lineHeight: Typography.screenTitle.lineHeight,
  },
});
