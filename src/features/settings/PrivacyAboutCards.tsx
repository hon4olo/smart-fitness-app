import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { AppCard } from '@/components/ui/AppCard';
import { Spacing, Typography } from '@/constants/theme';
import { useLocalization } from '@/localization';
import { useAppTheme } from '@/theme/AppThemeProvider';

import { createSupportDiagnostics } from './supportDiagnostics';

const COPY = {
  en: {
    privacyTitle: 'Privacy',
    localTitle: 'Local and synchronized data',
    localBody:
      'Some data stays only on this device while supported signed-in data is synchronized through your account. Anonymous data is not silently merged into an account.',
    crashTitle: 'Crash reporting',
    crashBody:
      'Crash reporting is disabled in development and when no DSN is configured. Sanitized technical events exclude health values, food and exercise names, free text, email, tokens, and account content.',
    analyticsTitle: 'Product analytics',
    analyticsBody:
      'Product analytics is not currently enabled. A separate consent and event contract is required before action-only analytics can be activated.',
    aboutTitle: 'About',
    coachHistory: 'Coach history & trust',
    coachHistoryBody: 'Review immutable Coach runs, policy versions, statuses, and agent stages.',
    version: 'App version',
    build: 'Build',
    runtime: 'Runtime',
    channel: 'Channel',
    update: 'Update',
    source: 'Update source',
    embedded: 'Embedded',
    downloaded: 'Downloaded',
    legalBody: 'No legal or support link is shown until a verified destination is configured.',
  },
  ru: {
    privacyTitle: 'Конфиденциальность',
    localTitle: 'Локальные и синхронизируемые данные',
    localBody:
      'Часть данных остаётся только на устройстве, а поддерживаемые данные вошедшего аккаунта синхронизируются через него. Анонимные данные не объединяются с аккаунтом без явного решения.',
    crashTitle: 'Отчёты о сбоях',
    crashBody:
      'Отчёты о сбоях отключены в разработке и без настроенного DSN. Санитизированные технические события не содержат показатели здоровья, названия еды и упражнений, свободный текст, email, токены и содержимое аккаунта.',
    analyticsTitle: 'Продуктовая аналитика',
    analyticsBody:
      'Продуктовая аналитика сейчас не включена. До её активации требуется отдельный контракт согласия и событий только по действиям.',
    aboutTitle: 'О приложении',
    coachHistory: 'История и доверие Coach',
    coachHistoryBody: 'Просмотр неизменяемых запусков Coach, версий правил, статусов и этапов агентов.',
    version: 'Версия приложения',
    build: 'Сборка',
    runtime: 'Runtime',
    channel: 'Канал',
    update: 'Обновление',
    source: 'Источник обновления',
    embedded: 'Встроенное',
    downloaded: 'Загруженное',
    legalBody: 'Юридические и support-ссылки не показываются, пока не настроен проверенный адрес.',
  },
} as const;

function Disclosure({ body, title }: { body: string; title: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.disclosure, { borderColor: colors.borderSubtle }]}>
      <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.body, { color: colors.textSecondary }]}>{body}</Text>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.row, { borderColor: colors.borderSubtle }]}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <Text selectable style={[styles.value, { color: colors.textPrimary }]}>{value}</Text>
    </View>
  );
}

export function PrivacySettingsCard() {
  const { locale } = useLocalization();
  const copy = locale === 'ru' ? COPY.ru : COPY.en;
  return (
    <AppCard>
      <Disclosure body={copy.localBody} title={copy.localTitle} />
      <Disclosure body={copy.crashBody} title={copy.crashTitle} />
      <Disclosure body={copy.analyticsBody} title={copy.analyticsTitle} />
    </AppCard>
  );
}

export function AboutSettingsCard() {
  const { locale } = useLocalization();
  const { colors } = useAppTheme();
  const copy = locale === 'ru' ? COPY.ru : COPY.en;
  const diagnostics = createSupportDiagnostics({
    conflictCount: 0,
    pendingOperations: 0,
    syncStatus: 'local-only',
  });
  return (
    <AppCard>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/profile/coach-history')}
        style={[styles.historyLink, { borderColor: colors.borderSubtle }]}>
        <View style={styles.historyCopy}>
          <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>{copy.coachHistory}</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>{copy.coachHistoryBody}</Text>
        </View>
        <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
      </Pressable>
      <Row label={copy.version} value={diagnostics.appVersion} />
      <Row label={copy.build} value={diagnostics.buildNumber} />
      <Row label={copy.runtime} value={diagnostics.runtimeVersion} />
      <Row label={copy.channel} value={diagnostics.channel} />
      <Row label={copy.update} value={diagnostics.updateId} />
      <Row
        label={copy.source}
        value={diagnostics.updateSource === 'embedded' ? copy.embedded : copy.downloaded}
      />
      <Text style={[styles.legal, { color: colors.textMuted }]}>{copy.legalBody}</Text>
    </AppCard>
  );
}

export const getPrivacyAboutSectionTitles = (locale: 'en' | 'ru') =>
  locale === 'ru'
    ? { privacy: COPY.ru.privacyTitle, about: COPY.ru.aboutTitle }
    : { privacy: COPY.en.privacyTitle, about: COPY.en.aboutTitle };

const styles = StyleSheet.create({
  body: { fontSize: Typography.body.fontSize, lineHeight: Typography.body.lineHeight },
  chevron: { fontSize: 28, lineHeight: 30 },
  disclosure: { borderTopWidth: StyleSheet.hairlineWidth, gap: Spacing.one, paddingVertical: Spacing.two },
  historyCopy: { flex: 1, gap: Spacing.one },
  historyLink: { alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: Spacing.two, paddingBottom: Spacing.three },
  itemTitle: { fontSize: Typography.cardTitle.fontSize, fontWeight: Typography.cardTitle.fontWeight, lineHeight: Typography.cardTitle.lineHeight },
  label: { flex: 1, fontSize: Typography.caption.fontSize, lineHeight: Typography.caption.lineHeight },
  legal: { fontSize: Typography.caption.fontSize, lineHeight: Typography.caption.lineHeight, marginTop: Spacing.two },
  row: { alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: Spacing.two, paddingVertical: Spacing.two },
  value: { flexShrink: 1, fontSize: Typography.caption.fontSize, fontWeight: Typography.label.fontWeight, lineHeight: Typography.caption.lineHeight, textAlign: 'right' },
});
