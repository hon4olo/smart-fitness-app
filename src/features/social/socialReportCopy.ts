import type { SocialReportReasonCode } from '@/api/social';
import type { SupportedLocale } from '@/localization';

export type SocialReportCopy = {
  reportProfile: string;
  reportPost: string;
  reportComment: string;
  profileTitle: string;
  postTitle: string;
  commentTitle: string;
  body: string;
  reasonTitle: string;
  reasons: Record<SocialReportReasonCode, string>;
  submit: string;
  cancel: string;
  successTitle: string;
  successBody: string;
  done: string;
  errorOffline: string;
  errorSession: string;
  errorUnavailable: string;
  errorGeneric: string;
};

const en: SocialReportCopy = {
  reportProfile: 'Report profile',
  reportPost: 'Report post',
  reportComment: 'Report',
  profileTitle: 'Report this profile',
  postTitle: 'Report this workout post',
  commentTitle: 'Report this comment',
  body: 'Choose the reason that best describes the issue. Reports do not automatically remove content.',
  reasonTitle: 'Reason',
  reasons: {
    spam: 'Spam',
    harassment: 'Harassment or bullying',
    hate_speech: 'Hate speech',
    violence: 'Violence or threats',
    sexual_content: 'Sexual content',
    self_harm: 'Self-harm content',
    privacy: 'Privacy violation',
    impersonation: 'Impersonation',
    other: 'Other policy issue',
  },
  submit: 'Submit report',
  cancel: 'Cancel',
  successTitle: 'Report received',
  successBody: 'The report was received for review.',
  done: 'Done',
  errorOffline: 'Connect to the internet and try again.',
  errorSession: 'Your session expired. Sign in again.',
  errorUnavailable: 'This content is no longer available to report.',
  errorGeneric: 'The report could not be submitted. Try again.',
};

const ru: SocialReportCopy = {
  reportProfile: 'Пожаловаться на профиль',
  reportPost: 'Пожаловаться на публикацию',
  reportComment: 'Пожаловаться',
  profileTitle: 'Жалоба на профиль',
  postTitle: 'Жалоба на публикацию тренировки',
  commentTitle: 'Жалоба на комментарий',
  body: 'Выберите причину, которая лучше всего описывает проблему. Жалоба не удаляет контент автоматически.',
  reasonTitle: 'Причина',
  reasons: {
    spam: 'Спам',
    harassment: 'Оскорбления или травля',
    hate_speech: 'Язык ненависти',
    violence: 'Насилие или угрозы',
    sexual_content: 'Сексуальный контент',
    self_harm: 'Контент о самоповреждении',
    privacy: 'Нарушение приватности',
    impersonation: 'Выдаёт себя за другого',
    other: 'Другое нарушение правил',
  },
  submit: 'Отправить жалобу',
  cancel: 'Отмена',
  successTitle: 'Жалоба принята',
  successBody: 'Жалоба получена и будет рассмотрена.',
  done: 'Готово',
  errorOffline: 'Подключитесь к интернету и повторите попытку.',
  errorSession: 'Сессия истекла. Войдите снова.',
  errorUnavailable: 'Этот контент больше недоступен для жалобы.',
  errorGeneric: 'Не удалось отправить жалобу. Повторите попытку.',
};

export const getSocialReportCopy = (
  locale: SupportedLocale,
): SocialReportCopy => (locale === 'ru' ? ru : en);
