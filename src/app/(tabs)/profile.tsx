import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProfilePreferencesCard } from '@/components/profile/ProfilePreferencesCard';
import { Colors, MaxContentWidth, Radii, Spacing, Typography } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { useLocalization } from '@/localization';
import type { ProfileGoalType } from '@/types';

const goalTypeLabel = (value: ProfileGoalType, locale: 'en' | 'ru') => {
  if (locale === 'ru') {
    if (value === 'lose_fat') return 'Сушка';
    if (value === 'maintain') return 'Поддержание';
    return 'Набор массы';
  }
  if (value === 'lose_fat') return 'Lose fat';
  if (value === 'maintain') return 'Maintain';
  return 'Gain muscle';
};

export default function ProfileScreen() {
  const router = useRouter();
  const { profile } = useAppContext();
  const { locale, t } = useLocalization();
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
            accessibilityLabel={locale === 'ru' ? 'Открыть настройки' : 'Open Settings'}
            accessibilityRole="button"
            onPress={() => router.push('/settings')}
            style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}>
            <Text style={styles.settingsIcon}>⚙︎</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{locale === 'ru' ? 'Кратко' : 'Summary'}</Text>
          <ProfilePreferencesCard
            activityLevel={profile.activityLevel}
            goalType={goalTypeLabel(profile.goalType, locale)}
            trainingDaysPerWeek={`${profile.trainingDaysPerWeek}`}
          />
        </View>

        <View style={styles.note}>
          <Text style={styles.noteTitle}>
            {locale === 'ru' ? 'План и Coach находятся в Прогрессе' : 'Plan and Coach are in Progress'}
          </Text>
          <Text style={styles.noteText}>
            {locale === 'ru'
              ? 'Цель, параметры тренировок и инструменты AI Coach теперь собраны рядом с вашими результатами.'
              : 'Goals, training inputs, and AI Coach tools now live next to your results.'}
          </Text>
        </View>
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
  note: {
    backgroundColor: Colors.dark.surfacePrimary,
    borderColor: Colors.dark.borderSubtle,
    borderRadius: Radii.large,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.one,
    padding: Spacing.three,
  },
  noteText: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
  },
  noteTitle: { color: Colors.dark.textPrimary, fontSize: 17, fontWeight: '800' },
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
