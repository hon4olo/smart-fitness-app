import { formatPlural, type SupportedLocale, type Translate } from '@/localization';

export type DataRecoveryCopy = {
  title: string;
  healthy: string;
  localFailure: string;
  outboxFailure: string;
  recovered: string;
  checkFailed: string;
  failedAction: string;
  unknownAction: string;
  retrySave: string;
  retrySync: string;
  waiting: string;
  journalCount: string;
  recover: string;
  recovering: string;
  protectedChanges(count: number): string;
};

export const getDataRecoveryCopy = (
  locale: SupportedLocale,
  t: Translate,
): DataRecoveryCopy => ({
  title: t('recovery.title'),
  healthy: t('recovery.healthy'),
  localFailure: t('recovery.localFailure'),
  outboxFailure: t('recovery.outboxFailure'),
  recovered: t('recovery.recovered'),
  checkFailed: t('recovery.checkFailed'),
  failedAction: t('recovery.failedAction'),
  unknownAction: t('recovery.unknownAction'),
  retrySave: t('recovery.retrySave'),
  retrySync: t('recovery.retrySync'),
  waiting: t('recovery.waiting'),
  journalCount: t('recovery.journalCount'),
  recover: t('recovery.recover'),
  recovering: t('recovery.recovering'),
  protectedChanges: (count) =>
    formatPlural(locale, count, {
      one: t('recovery.protected.one', { count }),
      few: t('recovery.protected.few', { count }),
      many: t('recovery.protected.many', { count }),
      other: t('recovery.protected.other', { count }),
    }),
});
