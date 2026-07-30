import type { ApiDiagnosticCategory } from '@/api/client';
import type { SupportedLocale } from './messages';

export const getSupportDiagnosticsMetricsCopy = (locale: SupportedLocale) => ({
  title: locale === 'ru' ? 'Локальная производительность' : 'Local performance',
  description:
    locale === 'ru'
      ? 'Только агрегированные счётчики, размеры и длительность. Содержимое аккаунта и фитнес-данные не сохраняются.'
      : 'Aggregate counts, sizes, and durations only. Account and fitness content is not stored.',
  loading: locale === 'ru' ? 'Загрузка диагностики…' : 'Loading diagnostics…',
  unavailable:
    locale === 'ru'
      ? 'Локальную диагностику не удалось прочитать.'
      : 'Local diagnostics could not be read.',
  refresh: locale === 'ru' ? 'Обновить диагностику' : 'Refresh diagnostics',
  stateSection: locale === 'ru' ? 'Локальное состояние' : 'Local state',
  apiSection: locale === 'ru' ? 'API-запросы' : 'API requests',
  currentSize: locale === 'ru' ? 'Текущий размер' : 'Current size',
  maximumSize: locale === 'ru' ? 'Максимальный размер' : 'Maximum size',
  totalEntities: locale === 'ru' ? 'Всего сущностей' : 'Total entities',
  loadCount: locale === 'ru' ? 'Загрузки состояния' : 'State loads',
  loadFailures: locale === 'ru' ? 'Ошибки загрузки' : 'Load failures',
  lastLoad: locale === 'ru' ? 'Последняя загрузка' : 'Last load',
  maximumLoad: locale === 'ru' ? 'Максимальная загрузка' : 'Maximum load',
  saveCount: locale === 'ru' ? 'Сохранения состояния' : 'State saves',
  saveFailures: locale === 'ru' ? 'Ошибки сохранения' : 'Save failures',
  lastSave: locale === 'ru' ? 'Последнее сохранение' : 'Last save',
  maximumSave: locale === 'ru' ? 'Максимальное сохранение' : 'Maximum save',
  requestCount: locale === 'ru' ? 'Всего запросов' : 'Total requests',
  requestFailures: locale === 'ru' ? 'Ошибки запросов' : 'Request failures',
  authRefreshFailures:
    locale === 'ru' ? 'Ошибки обновления сессии' : 'Session refresh failures',
  lastDuration: locale === 'ru' ? 'Последняя длительность' : 'Last duration',
  maximumDuration:
    locale === 'ru' ? 'Максимальная длительность' : 'Maximum duration',
  lastAttempts: locale === 'ru' ? 'Последнее число попыток' : 'Last attempts',
  maximumAttempts:
    locale === 'ru' ? 'Максимальное число попыток' : 'Maximum attempts',
  categoryFailures: locale === 'ru' ? 'Ошибки по категориям' : 'Failures by category',
  noFailures: locale === 'ru' ? 'Ошибок не записано' : 'No failures recorded',
  bytes: (value: string) => `${value} B`,
  milliseconds: (value: string) => `${value} ms`,
  category: (category: ApiDiagnosticCategory) => {
    if (category === 'auth') return locale === 'ru' ? 'Авторизация' : 'Authentication';
    if (category === 'auth_refresh') {
      return locale === 'ru' ? 'Обновление сессии' : 'Session refresh';
    }
    if (category === 'sync') return locale === 'ru' ? 'Синхронизация' : 'Sync';
    if (category === 'coach') return 'Coach';
    if (category === 'food') return locale === 'ru' ? 'Питание' : 'Food';
    if (category === 'profile') return locale === 'ru' ? 'Профиль' : 'Profile';
    return locale === 'ru' ? 'Другое' : 'Other';
  },
});
