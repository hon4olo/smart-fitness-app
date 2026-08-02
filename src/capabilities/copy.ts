import type { SupportedLocale } from '@/localization';

import type { CapabilityAvailability } from './model';

export type CapabilityStatusCopy = {
  title: string;
  body: string;
  retry: string;
};

const EN_COPY: Record<CapabilityAvailability, CapabilityStatusCopy> = {
  checking: {
    title: 'Checking availability',
    body: 'This feature will appear when its availability is confirmed.',
    retry: 'Check again',
  },
  available: { title: '', body: '', retry: 'Check again' },
  unavailable: {
    title: 'Feature unavailable',
    body: 'This feature is not enabled for this app yet.',
    retry: 'Check again',
  },
  temporarily_unavailable: {
    title: 'Temporarily unavailable',
    body: 'The feature is enabled but is not operational right now.',
    retry: 'Check again',
  },
  configuration_required: {
    title: 'Not configured yet',
    body: 'The feature cannot be used until its service is configured.',
    retry: 'Check again',
  },
  recheck_required: {
    title: 'Availability needs to be checked again',
    body: 'No request will be sent until availability is confirmed.',
    retry: 'Check again',
  },
};

const RU_COPY: Record<CapabilityAvailability, CapabilityStatusCopy> = {
  checking: {
    title: 'Проверяем доступность',
    body: 'Функция появится после подтверждения её доступности.',
    retry: 'Проверить снова',
  },
  available: { title: '', body: '', retry: 'Проверить снова' },
  unavailable: {
    title: 'Функция недоступна',
    body: 'Эта функция пока не включена в приложении.',
    retry: 'Проверить снова',
  },
  temporarily_unavailable: {
    title: 'Временно недоступна',
    body: 'Функция включена, но сейчас не готова к работе.',
    retry: 'Проверить снова',
  },
  configuration_required: {
    title: 'Ещё не настроена',
    body: 'Функцией нельзя пользоваться, пока сервис не будет настроен.',
    retry: 'Проверить снова',
  },
  recheck_required: {
    title: 'Требуется повторная проверка',
    body: 'Запрос не будет отправлен, пока доступность не подтверждена.',
    retry: 'Проверить снова',
  },
};

export const getCapabilityStatusCopy = (
  locale: SupportedLocale,
  availability: CapabilityAvailability,
): CapabilityStatusCopy =>
  (locale === 'ru' ? RU_COPY : EN_COPY)[availability];
