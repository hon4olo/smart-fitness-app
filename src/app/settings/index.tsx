import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
// @ts-ignore - expo-updates types are not available in this workspace, but the runtime module exists on device.
import * as Updates from 'expo-updates';

import { AuthGateCard } from '@/components/auth';
import { ProfileActionsCard } from '@/components/profile/ProfileActionsCard';
import { ProfileRuntimeInfoCard } from '@/components/profile/ProfileRuntimeInfoCard';
import { AppCard } from '@/components/ui/AppCard';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Colors, MaxContentWidth, Radii, Spacing, Typography } from '@/constants/theme';
import type { AppearanceMode } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import {
  AboutSettingsCard,
  getPrivacyAboutSectionTitles,
  PrivacySettingsCard,
} from '@/features/settings/PrivacyAboutCards';
import { SyncSettingsCard } from '@/features/settings/SyncSettingsCard';
import { getSyncStatusCopy } from '@/features/settings/syncStatusCopy';
import { useLocalization, type LanguagePreference } from '@/localization';
import { useAppTheme } from '@/theme/AppThemeProvider';
import {
  getUnitCopy,
  useUnitPreferences,
  type EnergyUnit,
  type LengthUnit,
  type WeightUnit,
} from '@/units';

type OtaValueSource = Record<string, unknown>;

const formatOtaValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') return 'Not available';
  if (value instanceof Date) {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(value);
  }
  return String(value);
};

export default function SettingsScreen() {
  const router = useRouter();
  const app = useAppContext();
  const { colors, mode, setMode } = useAppTheme();
  const { languagePreference, locale, setLanguagePreference, t } = useLocalization();
  const { weight, length, energy, setWeightUnit, setLengthUnit, setEnergyUnit } =
    useUnitPreferences();
  const [developerExpanded, setDeveloperExpanded] = useState(false);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const unitCopy = getUnitCopy(locale);
  const syncCopy = getSyncStatusCopy(locale);
  const privacyAboutTitles = getPrivacyAboutSectionTitles(locale);

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
  const weightOptions: ReadonlyArray<{ label: string; value: WeightUnit }> = [
    { label: 'kg', value: 'kg' },
    { label: 'lb', value: 'lb' },
  ];
  const lengthOptions: ReadonlyArray<{ label: string; value: LengthUnit }> = [
    { label: 'cm', value: 'cm' },
    { label: 'in', value: 'in' },
  ];
  const energyOptions: ReadonlyArray<{ label: string; value: EnergyUnit }> = [
    { label: 'kcal', value: 'kcal' },
    { label: 'kJ', value: 'kJ' },
  ];

  const otaRuntimeVersion = formatOtaValue((Updates as OtaValueSource).runtimeVersion);
  const otaUpdateId = formatOtaValue((Updates as OtaValueSource).updateId);
  const otaCreatedAt = formatOtaValue((Updates as OtaValueSource).createdAt);
  const otaChannel = formatOtaValue((Updates as OtaValueSource).channel);

  const handleResetOnboarding = () => {
    Alert.alert(
      locale === 'ru' ? 'Сбросить первоначальную настройку?' : 'Reset onboarding?',
      locale === 'ru'
        ? 'На этом устройстве снова откроется первоначальная настройка.'
        : 'This will show Quick Setup again on this device.',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: locale === 'ru' ? 'Сбросить' : 'Reset',
          style: 'destructive',
          onPress: () => app.resetOnboarding(),
        },
      ],
    );
  };

  const handleCheckForOtaUpdate = async () => {
    try {
      const update = await Updates.checkForUpdateAsync();
      if (!update.isAvailable) {
        Alert.alert(locale === 'ru' ? 'Обновлений нет' : 'No update available');
        return;
      }
      await Updates.fetchUpdateAsync();
      Alert.alert(
        locale === 'ru'
          ? 'Обновление загружено. Приложение перезапустится.'
          : 'Update downloaded. Restarting app.',
      );
      await Updates.reloadAsync();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert(locale === 'ru' ? 'Ошибка OTA-обновления' : 'OTA update error', message);
    }
  };

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
            <Text style={styles.subtitle}>
              {locale === 'ru'
                ? 'Аккаунт, язык, оформление, единицы, синхронизация и приватность.'
                : 'Account, language, appearance, units, sync, and privacy.'}
            </Text>
          </View>
        </View>

        <SettingsSection title={t('account.title')}>
          <AuthGateCard />
        </SettingsSection>

        <SettingsSection title={t('settings.general')}>
          <AppCard>
            <SettingBlock
              description={t('settings.languageDescription')}
              title={t('settings.language')}>
              <SegmentedControl
                accessibilityLabel={t('settings.language')}
                onChange={setLanguagePreference}
                options={languageOptions}
                value={languagePreference}
              />
            </SettingBlock>
          </AppCard>
        </SettingsSection>

        <SettingsSection title={t('settings.appearance')}>
          <AppCard>
            <SettingBlock
              description={t('settings.appearanceDescription')}
              title={t('settings.appearance')}>
              <SegmentedControl
                accessibilityLabel={t('settings.appearance')}
                onChange={setMode}
                options={appearanceOptions}
                value={mode}
              />
            </SettingBlock>
          </AppCard>
        </SettingsSection>

        <SettingsSection title={unitCopy.section}>
          <AppCard>
            <SettingBlock description={unitCopy.weightDescription} title={unitCopy.weight}>
              <SegmentedControl
                accessibilityLabel={unitCopy.weight}
                onChange={setWeightUnit}
                options={weightOptions}
                value={weight}
              />
            </SettingBlock>
            <View style={styles.divider} />
            <SettingBlock description={unitCopy.lengthDescription} title={unitCopy.length}>
              <SegmentedControl
                accessibilityLabel={unitCopy.length}
                onChange={setLengthUnit}
                options={lengthOptions}
                value={length}
              />
            </SettingBlock>
            <View style={styles.divider} />
            <SettingBlock description={unitCopy.energyDescription} title={unitCopy.energy}>
              <SegmentedControl
                accessibilityLabel={unitCopy.energy}
                onChange={setEnergyUnit}
                options={energyOptions}
                value={energy}
              />
            </SettingBlock>
          </AppCard>
          <Text style={styles.footer}>{unitCopy.footer}</Text>
        </SettingsSection>

        <SettingsSection title={syncCopy.section}>
          <SyncSettingsCard />
        </SettingsSection>

        <SettingsSection title={privacyAboutTitles.privacy}>
          <PrivacySettingsCard />
        </SettingsSection>

        <SettingsSection title={privacyAboutTitles.about}>
          <AboutSettingsCard />
        </SettingsSection>

        <View style={styles.section}>
          <View style={styles.developerHeader}>
            <View style={styles.developerCopy}>
              <Text style={styles.sectionTitle}>
                {locale === 'ru' ? 'Инструменты разработчика' : 'Developer tools'}
              </Text>
              <Text style={styles.footer}>
                {locale === 'ru'
                  ? 'Технические функции, диагностика сборки и тестовые экраны.'
                  : 'Technical actions, build diagnostics, and preview screens.'}
              </Text>
            </View>
            <SecondaryButton
              label={
                developerExpanded
                  ? locale === 'ru'
                    ? 'Скрыть'
                    : 'Hide'
                  : locale === 'ru'
                    ? 'Показать'
                    : 'Show'
              }
              onPress={() => setDeveloperExpanded((current) => !current)}
            />
          </View>
          {developerExpanded ? (
            <View style={styles.developerStack}>
              <ProfileActionsCard onResetOnboarding={handleResetOnboarding} />
              <ProfileRuntimeInfoCard
                channel={otaChannel}
                createdAt={otaCreatedAt}
                onCheckForOtaUpdate={handleCheckForOtaUpdate}
                runtimeVersion={otaRuntimeVersion}
                updateId={otaUpdateId}
              />
            </View>
          ) : null}
        </View>

        <Text style={styles.footer}>{t('settings.aboutPreferences')}</Text>
      </View>
    </ScrollView>
  );
}

function SettingsSection({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <View style={stylesStatic.section}>
      <Text style={stylesStatic.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function SettingBlock({
  children,
  description,
  title,
}: {
  children: React.ReactNode;
  description: string;
  title: string;
}) {
  return (
    <View style={stylesStatic.settingBlock}>
      <Text style={stylesStatic.settingTitle}>{title}</Text>
      <Text style={stylesStatic.settingDescription}>{description}</Text>
      {children}
    </View>
  );
}

const stylesStatic = StyleSheet.create({
  section: { gap: Spacing.two },
  sectionTitle: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.sectionTitle.fontSize,
    fontWeight: Typography.sectionTitle.fontWeight,
    letterSpacing: Typography.sectionTitle.letterSpacing,
    textTransform: Typography.sectionTitle.textTransform,
  },
  settingBlock: { gap: Spacing.two },
  settingDescription: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
  },
  settingTitle: {
    color: Colors.dark.textPrimary,
    fontSize: Typography.cardTitle.fontSize,
    fontWeight: Typography.cardTitle.fontWeight,
    lineHeight: Typography.cardTitle.lineHeight,
  },
});

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
    backLabel: { color: colors.textPrimary, fontSize: 32, lineHeight: 34 },
    container: { gap: Spacing.four, maxWidth: MaxContentWidth, width: '100%' },
    content: {
      alignItems: 'center',
      paddingBottom: Spacing.eight,
      paddingHorizontal: Spacing.four,
      paddingTop: Spacing.four,
    },
    developerCopy: { flex: 1, gap: Spacing.one },
    developerHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.two,
      justifyContent: 'space-between',
    },
    developerStack: { gap: Spacing.two },
    divider: { backgroundColor: colors.borderSubtle, height: StyleSheet.hairlineWidth },
    footer: {
      color: colors.textMuted,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
      paddingHorizontal: Spacing.two,
    },
    headerCopy: { flex: 1, gap: Spacing.one },
    headerRow: { alignItems: 'flex-start', flexDirection: 'row', gap: Spacing.three },
    screen: { backgroundColor: colors.background, flex: 1 },
    section: { gap: Spacing.two },
    sectionTitle: {
      color: colors.textSecondary,
      fontSize: Typography.sectionTitle.fontSize,
      fontWeight: Typography.sectionTitle.fontWeight,
      letterSpacing: Typography.sectionTitle.letterSpacing,
      textTransform: Typography.sectionTitle.textTransform,
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
