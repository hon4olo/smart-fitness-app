import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AuthGateCard } from '@/components/auth';
import { AppCard } from '@/components/ui/AppCard';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Colors, MaxContentWidth, Radii, Spacing, Typography } from '@/constants/theme';
import type { AppearanceMode } from '@/constants/theme';
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

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, mode, setMode } = useAppTheme();
  const { languagePreference, locale, setLanguagePreference, t } = useLocalization();
  const { weight, length, energy, setWeightUnit, setLengthUnit, setEnergyUnit } =
    useUnitPreferences();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const unitCopy = getUnitCopy(locale);
  const syncCopy = getSyncStatusCopy(locale);

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

        <SettingsSection title={t('account.title')}>
          <AuthGateCard />
        </SettingsSection>

        <SettingsSection title={syncCopy.section}>
          <SyncSettingsCard />
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
