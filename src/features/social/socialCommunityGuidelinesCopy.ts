import type { SupportedLocale } from '@/localization';

export type SocialCommunityGuidelineSection = {
  id:
    | 'respect'
    | 'safety'
    | 'authenticity'
    | 'privacy'
    | 'fitness'
    | 'controls';
  title: string;
  body: string;
};

export type SocialCommunityGuidelinesCopy = {
  entryAction: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  updatedLabel: string;
  updatedValue: string;
  introTitle: string;
  introBody: string;
  sections: SocialCommunityGuidelineSection[];
  reportTitle: string;
  reportBody: string;
  emergencyNote: string;
};

const en: SocialCommunityGuidelinesCopy = {
  entryAction: 'Community guidelines',
  eyebrow: 'SOCIAL SAFETY',
  title: 'Community guidelines',
  subtitle: 'Rules for sharing workouts and interacting with other people.',
  updatedLabel: 'Updated',
  updatedValue: '31 July 2026',
  introTitle: 'Build a useful and safe fitness community',
  introBody:
    'Share responsibly. Public Social content can be seen by other people and must not expose private health, nutrition, recovery, limitation, or account data.',
  sections: [
    {
      id: 'respect',
      title: 'Respect other people',
      body:
        'Do not harass, bully, threaten, shame, or target people based on protected characteristics. Disagreement is allowed; abuse is not.',
    },
    {
      id: 'safety',
      title: 'Do not promote harm',
      body:
        'Do not encourage violence, self-harm, dangerous challenges, sexual exploitation, or content that creates an immediate safety risk.',
    },
    {
      id: 'authenticity',
      title: 'Be authentic',
      body:
        'Do not impersonate another person, manipulate engagement, repeatedly spam, or use misleading claims to deceive other users.',
    },
    {
      id: 'privacy',
      title: 'Protect privacy',
      body:
        'Do not publish another person’s identity, contact details, medical information, photos, or private conversations without permission.',
    },
    {
      id: 'fitness',
      title: 'Share fitness content responsibly',
      body:
        'Do not present unsafe training, drug, supplement, nutrition, or medical instructions as guaranteed or universally appropriate. Other users may have different health risks and limitations.',
    },
    {
      id: 'controls',
      title: 'Use safety controls',
      body:
        'Block a profile to stop interaction and visibility between both accounts. Report a profile, post, or comment when it may violate these guidelines.',
    },
  ],
  reportTitle: 'What happens after a report',
  reportBody:
    'A report records the selected reason for review. It does not automatically remove content. Do not submit repeated reports for the same target.',
  emergencyNote:
    'Social reporting is not an emergency service. For an immediate danger, contact local emergency services.',
};

const ru: SocialCommunityGuidelinesCopy = {
  entryAction: 'Правила сообщества',
  eyebrow: 'БЕЗОПАСНОСТЬ SOCIAL',
  title: 'Правила сообщества',
  subtitle: 'Правила публикации тренировок и общения с другими людьми.',
  updatedLabel: 'Обновлено',
  updatedValue: '31 июля 2026 г.',
  introTitle: 'Создавайте полезное и безопасное фитнес-сообщество',
  introBody:
    'Публикуйте ответственно. Публичный Social-контент виден другим людям и не должен раскрывать приватные данные о здоровье, питании, восстановлении, ограничениях или аккаунте.',
  sections: [
    {
      id: 'respect',
      title: 'Уважайте других людей',
      body:
        'Не оскорбляйте, не травите, не угрожайте и не унижайте людей, в том числе по защищаемым признакам. Спорить можно, проявлять агрессию — нет.',
    },
    {
      id: 'safety',
      title: 'Не поощряйте причинение вреда',
      body:
        'Не призывайте к насилию, самоповреждению, опасным испытаниям, сексуальной эксплуатации и действиям, создающим непосредственный риск для безопасности.',
    },
    {
      id: 'authenticity',
      title: 'Не вводите людей в заблуждение',
      body:
        'Не выдавайте себя за другого человека, не накручивайте активность, не рассылайте повторяющийся спам и не используйте обманные заявления.',
    },
    {
      id: 'privacy',
      title: 'Защищайте приватность',
      body:
        'Не публикуйте без разрешения личность, контакты, медицинскую информацию, фотографии или приватные переписки другого человека.',
    },
    {
      id: 'fitness',
      title: 'Ответственно публикуйте фитнес-контент',
      body:
        'Не представляйте небезопасные рекомендации по тренировкам, препаратам, добавкам, питанию или медицине как гарантированно подходящие всем. У других пользователей могут быть иные риски и ограничения.',
    },
    {
      id: 'controls',
      title: 'Используйте инструменты безопасности',
      body:
        'Заблокируйте профиль, чтобы прекратить взаимодействие и взаимную видимость. Отправьте жалобу на профиль, публикацию или комментарий, если они могут нарушать правила.',
    },
  ],
  reportTitle: 'Что происходит после жалобы',
  reportBody:
    'Жалоба сохраняет выбранную причину для рассмотрения и не удаляет контент автоматически. Не отправляйте повторные жалобы на одну и ту же цель.',
  emergencyNote:
    'Жалоба в Social не является экстренной службой. При непосредственной опасности обратитесь в местные экстренные службы.',
};

export const getSocialCommunityGuidelinesCopy = (
  locale: SupportedLocale,
): SocialCommunityGuidelinesCopy => (locale === 'ru' ? ru : en);
