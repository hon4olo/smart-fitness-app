import type { SupportedLocale } from '@/localization';

const en = {
  entryAction: 'Following feed',
  eyebrow: 'FOLLOWING',
  title: 'Workout feed',
  subtitle: 'A chronological feed of workouts published by profiles you follow.',
  loading: 'Loading workout feed…',
  refreshing: 'Refreshing…',
  cachedNotice: 'Showing a recently saved feed while checking for updates.',
  loadMore: 'Load more',
  retry: 'Retry',
  signInTitle: 'Sign in required',
  signInBody: 'Sign in to view workouts from profiles you follow.',
  signInAction: 'Sign in',
  emptyTitle: 'Your feed is empty',
  emptyBody: 'Follow profiles and their published workouts will appear here in chronological order.',
  findProfiles: 'Find profiles',
  manageFollowing: 'Manage following',
  loadErrorTitle: 'Could not load the feed',
  loadErrorOffline: 'Connect to the internet and try again.',
  loadErrorSession: 'Your session expired. Sign in again.',
  loadErrorCursor: 'This page expired. Refresh the feed from the beginning.',
  loadErrorGeneric: 'The workout feed could not be loaded right now.',
} as const;

export type SocialFollowingFeedCopy = Record<keyof typeof en, string>;

const ru: SocialFollowingFeedCopy = {
  entryAction: 'Лента подписок',
  eyebrow: 'ПОДПИСКИ',
  title: 'Лента тренировок',
  subtitle: 'Хронологическая лента тренировок профилей, на которые вы подписаны.',
  loading: 'Загрузка ленты…',
  refreshing: 'Обновление…',
  cachedNotice: 'Показана недавно сохранённая лента. Проверяем обновления.',
  loadMore: 'Загрузить ещё',
  retry: 'Повторить',
  signInTitle: 'Требуется вход',
  signInBody: 'Войдите, чтобы просматривать тренировки профилей из ваших подписок.',
  signInAction: 'Войти',
  emptyTitle: 'Лента пока пуста',
  emptyBody: 'Подпишитесь на профили, и их опубликованные тренировки появятся здесь по времени публикации.',
  findProfiles: 'Найти профили',
  manageFollowing: 'Управлять подписками',
  loadErrorTitle: 'Не удалось загрузить ленту',
  loadErrorOffline: 'Подключитесь к интернету и повторите попытку.',
  loadErrorSession: 'Сессия истекла. Войдите снова.',
  loadErrorCursor: 'Страница устарела. Обновите ленту с начала.',
  loadErrorGeneric: 'Сейчас не удалось загрузить ленту тренировок.',
};

export const getSocialFollowingFeedCopy = (
  locale: SupportedLocale,
): SocialFollowingFeedCopy => (locale === 'ru' ? ru : en);
