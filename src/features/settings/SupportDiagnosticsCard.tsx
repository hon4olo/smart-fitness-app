import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { Spacing, Typography } from '@/constants/theme';
import type { WeightSyncStatus } from '@/context/SyncContext';
import { useLocalization } from '@/localization';
import { useAppTheme } from '@/theme/AppThemeProvider';

import { createSupportDiagnostics } from './supportDiagnostics';

const copyByLanguage = {
  en: {
    title: 'Support diagnostics',
    description: 'Technical release details that can help diagnose update and sync problems. No account or fitness data is included.',
    app: 'App version', build: 'Build', runtime: 'Runtime', channel: 'Channel', update: 'Update', source: 'Update source', environment: 'Environment', sync: 'Sync state', pending: 'Pending changes', conflicts: 'Conflicts', embedded: 'Embedded', downloaded: 'Downloaded',
  },
  ru: {
    title: 'Диагностика для поддержки',
    description: 'Технические данные релиза для диагностики обновлений и синхронизации. Данные аккаунта и фитнес-показатели не включаются.',
    app: 'Версия приложения', build: 'Сборка', runtime: 'Runtime', channel: 'Канал', update: 'Обновление', source: 'Источник обновления', environment: 'Среда', sync: 'Состояние синхронизации', pending: 'Ожидающие изменения', conflicts: 'Конфликты', embedded: 'Встроенное', downloaded: 'Загруженное',
  },
} as const;

function Row({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.row, { borderColor: colors.borderSubtle }]}> 
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <Text selectable style={[styles.value, { color: colors.textPrimary }]}>{value}</Text>
    </View>
  );
}

export function SupportDiagnosticsCard({ conflictCount, pendingOperations, syncStatus }: { conflictCount: number; pendingOperations: number; syncStatus: WeightSyncStatus }) {
  const { colors } = useAppTheme();
  const { locale } = useLocalization();
  const copy = locale.startsWith('ru') ? copyByLanguage.ru : copyByLanguage.en;
  const diagnostics = useMemo(() => createSupportDiagnostics({ conflictCount, pendingOperations, syncStatus }), [conflictCount, pendingOperations, syncStatus]);

  return (
    <AppCard>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{copy.title}</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>{copy.description}</Text>
      <View style={styles.rows}>
        <Row label={copy.app} value={diagnostics.appVersion} />
        <Row label={copy.build} value={diagnostics.buildNumber} />
        <Row label={copy.runtime} value={diagnostics.runtimeVersion} />
        <Row label={copy.channel} value={diagnostics.channel} />
        <Row label={copy.update} value={diagnostics.updateId} />
        <Row label={copy.source} value={diagnostics.updateSource === 'embedded' ? copy.embedded : copy.downloaded} />
        <Row label={copy.environment} value={diagnostics.environment} />
        <Row label={copy.sync} value={diagnostics.syncStatus} />
        <Row label={copy.pending} value={`${diagnostics.pendingOperations}`} />
        <Row label={copy.conflicts} value={`${diagnostics.conflictCount}`} />
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  description: { fontSize: Typography.caption.fontSize, lineHeight: Typography.caption.lineHeight, marginTop: Spacing.one },
  label: { flex: 1, fontSize: Typography.caption.fontSize, lineHeight: Typography.caption.lineHeight },
  row: { alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: Spacing.two, paddingVertical: Spacing.two },
  rows: { marginTop: Spacing.three },
  title: { fontSize: Typography.sectionTitle.fontSize, fontWeight: Typography.sectionTitle.fontWeight, lineHeight: Typography.sectionTitle.lineHeight },
  value: { flexShrink: 1, fontSize: Typography.caption.fontSize, fontWeight: Typography.label.fontWeight, lineHeight: Typography.caption.lineHeight, textAlign: 'right' },
});
