import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppCard } from '@/components/ui/AppCard';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Colors, MaxContentWidth, Radii, Spacing, Typography } from '@/constants/theme';
import { useLocalization, type LanguagePreference } from '@/localization';
import { useAppTheme } from '@/theme/AppThemeProvider';
import type { AppearanceMode } from '@/constants/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, mode, setMode } = useAppTheme();
  const { languagePreference, setLanguagePreference, t } = useLocalization();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const languageOptions: ReadonlyArray<{ label: string; value: LanguagePreference }> = [
    { label: t('common.system'), value: 'system' },
    { label: t('common.english'), value: 'en' },
    { label: t('common.russian'), value: 'ru' },
  ];
  const appearanceOptions: ReadonlyArray<{ label: string; value: AppearanceMode }> = [
    { label: t('common.system'), value: 'system' },
    { label: t('common.light'), value: 'light' },
    { label: t('common.dark'), value: 'dark' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Pressable
            accessibilityLabel={t('common.back')}
            accessibilityRole="button"
            onPress={() => router.back()}
            style={styles.backButton}>
            <Text style={styles.backLabel}>‹</Text>
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>{t('settings.title')}</Text>
            <Text style={styles.subtitle}>{t('settings.subtitle')}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.general')}</Text>
          <AppCard>
            <View style={styles.settingBlock}>
              <Text style={styles.settingTitle}>{t('settings.language')}</Text>
              <Text style={styles.settingDescription}>{t('settings.languageDescription')}</Text>
              <SegmentedControl
                accessibilityLabel={t('settings.language')}
                onChange={setLanguagePreference}
                options={languageOptions}
                value={languagePreference}
              />
            </View>
          </AppCard>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.appearance')}</Text>
          <AppCard>
            <View style={styles.settingBlock}>
              <Text style={styles.settingTitle}>{t('settings.appearance')}</Text>
              <Text style={styles.settingDescription}>{t('settings.appearanceDescription')}</Text>
              <SegmentedControl
                accessibilityLabel={t('settings.appearance')}
                onChange={setMode}
                options={appearanceOptions}
                value={mode}
              />
            </View>
          </AppCard>
        </View>

        <Text style={styles.footer}>{t('settings.aboutPreferences')}</Text>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    backButton: {
      alignItems: 'center',
      borderColor: colors.borderSubtle,
      borderRadius: Radii.large,
      borderWidth: StyleSheet.hairlineWidth,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    backLabel: {
      color: colors.textPrimary,
      fontSize: 32,
      lineHeight: 34,
    },
    container: {
      gap: Spacing.four,
      maxWidth: MaxContentWidth,
      width: '100%',
    },
    content: {
      alignItems: 'center',
      paddingBottom: Spacing.eight,
      paddingHorizontal: Spacing.four,
      paddingTop: Spacing.four,
    },
    footer: {
      color: colors.textMuted,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
      paddingHorizontal: Spacing.two,
    },
    headerCopy: {
      flex: 1,
      gap: Spacing.one,
    },
    headerRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: Spacing.three,
    },
    screen: {
      backgroundColor: colors.background,
      flex: 1,
    },
    section: {
      gap: Spacing.two,
    },
    sectionTitle: {
      color: colors.textSecondary,
      fontSize: Typography.sectionTitle.fontSize,
      fontWeight: Typography.sectionTitle.fontWeight,
      letterSpacing: Typography.sectionTitle.letterSpacing,
      textTransform: Typography.sectionTitle.textTransform,
    },
    settingBlock: {
      gap: Spacing.two,
    },
    settingDescription: {
      color: colors.textSecondary,
      fontSize: Typography.body.fontSize,
      lineHeight: Typography.body.lineHeight,
    },
    settingTitle: {
      color: colors.textPrimary,
      fontSize: Typography.cardTitle.fontSize,
      fontWeight: Typography.cardTitle.fontWeight,
      lineHeight: Typography.cardTitle.lineHeight,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: Typography.body.fontSize,
      lineHeight: Typography.body.lineHeight,
    },
    title: {
      color: colors.textPrimary,
      fontSize: Typography.screenTitle.fontSize,
      fontWeight: Typography.screenTitle.fontWeight,
      letterSpacing: Typography.screenTitle.letterSpacing,
      lineHeight: Typography.screenTitle.lineHeight,
    },
  });
