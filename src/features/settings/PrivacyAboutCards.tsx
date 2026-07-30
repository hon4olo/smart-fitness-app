import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { AppCard } from '@/components/ui/AppCard';
import { Spacing, Typography } from '@/constants/theme';
import { getPrivacyCurrentCopy } from '@/localization/privacyCurrentCopy';
import { useLocalization } from '@/localization';
import { useAppTheme } from '@/theme/AppThemeProvider';

import { createSupportDiagnostics } from './supportDiagnostics';

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
  const { locale, t } = useLocalization();
  const currentCopy = getPrivacyCurrentCopy(locale);
  return (
    <AppCard>
      <Disclosure body={t('privacy.localBody')} title={t('privacy.localTitle')} />
      <Disclosure body={currentCopy.crashBody} title={currentCopy.crashTitle} />
      <Disclosure body={t('privacy.analyticsBody')} title={t('privacy.analyticsTitle')} />
    </AppCard>
  );
}

export function AboutSettingsCard() {
  const { colors } = useAppTheme();
  const { t } = useLocalization();
  const diagnostics = createSupportDiagnostics({
    conflictCount: 0,
    pendingOperations: 0,
    syncStatus: 'local-only',
  });
  return (
    <AppCard>
      <Pressable
        accessibilityLabel={t('about.coachHistory')}
        accessibilityRole="button"
        onPress={() => router.push('/profile/coach-history')}
        style={[styles.historyLink, { borderColor: colors.borderSubtle }]}>
        <View style={styles.historyCopy}>
          <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>
            {t('about.coachHistory')}
          </Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            {t('about.coachHistoryBody')}
          </Text>
        </View>
        <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
      </Pressable>
      <Row label={t('about.appVersion')} value={diagnostics.appVersion} />
      <Row label={t('about.build')} value={diagnostics.buildNumber} />
      <Row label={t('about.runtime')} value={diagnostics.runtimeVersion} />
      <Row label={t('about.channel')} value={diagnostics.channel} />
      <Row label={t('about.update')} value={diagnostics.updateId} />
      <Row
        label={t('about.updateSource')}
        value={
          diagnostics.updateSource === 'embedded'
            ? t('about.embedded')
            : t('about.downloaded')
        }
      />
      <Text style={[styles.legal, { color: colors.textMuted }]}>
        {t('about.legalUnavailable')}
      </Text>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  body: { fontSize: Typography.body.fontSize, lineHeight: Typography.body.lineHeight },
  chevron: { fontSize: 28, lineHeight: 30 },
  disclosure: {
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.one,
    paddingVertical: Spacing.two,
  },
  historyCopy: { flex: 1, gap: Spacing.one },
  historyLink: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: Spacing.two,
    paddingBottom: Spacing.three,
  },
  itemTitle: {
    fontSize: Typography.cardTitle.fontSize,
    fontWeight: Typography.cardTitle.fontWeight,
    lineHeight: Typography.cardTitle.lineHeight,
  },
  label: {
    flex: 1,
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
  },
  legal: {
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
    marginTop: Spacing.two,
  },
  row: {
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  value: {
    flexShrink: 1,
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.label.fontWeight,
    lineHeight: Typography.caption.lineHeight,
    textAlign: 'right',
  },
});
