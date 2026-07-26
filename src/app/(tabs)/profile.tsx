import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProfilePreferencesCard } from '@/components/profile/ProfilePreferencesCard';
import { Colors, MaxContentWidth, Spacing, Typography } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { ProfileGoalsSection } from '@/features/profile/ProfileGoalsSection';
import {
  getGoalTypeLabel,
  getStoredActivityLevelLabel,
} from '@/features/progress/progressLocalization';
import { useLocalization } from '@/localization';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile } = useAppContext();
  const { t } = useLocalization();
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[
        styles.content,
        { paddingBottom: safeAreaInsets.bottom + 120 },
      ]}
      style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{t('profile.title')}</Text>
          <Pressable
            accessibilityLabel={t('profile.settingsAction')}
            accessibilityRole="button"
            onPress={() => router.push('/settings')}
            style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}>
            <Text style={styles.settingsIcon}>⚙︎</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.summary')}</Text>
          <ProfilePreferencesCard
            activityLevel={getStoredActivityLevelLabel(t, profile.activityLevel)}
            goalType={getGoalTypeLabel(t, profile.goalType)}
            trainingDaysPerWeek={`${profile.trainingDaysPerWeek}`}
          />
        </View>

        <ProfileGoalsSection />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.four, maxWidth: MaxContentWidth, width: '100%' },
  content: { alignItems: 'center', padding: Spacing.three },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pressed: { opacity: 0.72 },
  screen: { backgroundColor: Colors.dark.background, flex: 1 },
  section: { gap: Spacing.two },
  sectionTitle: { color: Colors.dark.textPrimary, fontSize: 18, fontWeight: '800' },
  settingsButton: {
    alignItems: 'center',
    backgroundColor: Colors.dark.surfacePrimary,
    borderColor: Colors.dark.borderSubtle,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  settingsIcon: { color: Colors.dark.textPrimary, fontSize: 26, lineHeight: 30 },
  title: {
    color: Colors.dark.textPrimary,
    fontSize: Typography.screenTitle.fontSize,
    fontWeight: Typography.screenTitle.fontWeight,
    lineHeight: Typography.screenTitle.lineHeight,
  },
});
