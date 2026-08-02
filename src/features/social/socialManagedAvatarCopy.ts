import type { SupportedLocale } from "@/localization";

const en = {
  title: "Profile photo",
  description:
    "Photos are uploaded privately, checked, and published only after approval. Server validation remains authoritative.",
  current: "Current public photo",
  replacement: "New photo preview",
  empty: "No public profile photo",
  profileRequired: "Save your social profile before adding a photo.",
  select: "Choose photo",
  change: "Choose another photo",
  refresh: "Refresh status",
  retry: "Try again",
  remove: "Remove photo",
  removing: "Removing…",
  selecting: "Opening photo library…",
  preparing: "Preparing photo…",
  uploading: "Uploading privately…",
  completing: "Checking upload…",
  binding: "Publishing approved photo…",
  polling: "Checking moderation status…",
  approvedTitle: "Photo approved",
  approvedBody: "The approved image is now your public profile photo.",
  uploadPendingTitle: "Upload incomplete",
  uploadPendingBody: "Choose the photo again to restart the private upload.",
  quarantinedTitle: "Upload received",
  quarantinedBody: "The private image is waiting for processing.",
  processingTitle: "Photo is being checked",
  processingBody:
    "Your current approved photo remains public while checks continue.",
  reviewTitle: "Manual review required",
  reviewBody:
    "The new photo remains private. Your current approved photo is unchanged.",
  rejectedTitle: "Photo was not approved",
  rejectedBody:
    "The new image remains private. Choose a different photo or remove this draft.",
  failedTitle: "Photo processing failed",
  failedBody:
    "Your current approved photo is unchanged. Retry with a new upload.",
  deletedTitle: "Photo removed",
  deletedBody: "The managed image is no longer attached to your profile.",
  preserveCurrent:
    "Your existing approved photo stays public until the replacement is approved.",
  permissionDenied:
    "Allow photo-library access in system settings and try again.",
  selectionFailed: "The selected photo could not be opened.",
  unsupportedImage: "Choose a supported still image.",
  processingFailed: "The photo could not be prepared on this device.",
  tooLarge:
    "The prepared photo is still larger than 8 MB. Choose a smaller image.",
  uploadExpired: "The private upload expired. Choose the photo again.",
  uploadUnavailable:
    "Managed photo uploads are not available in this environment yet.",
  validationFailed: "The server rejected this image. Choose another photo.",
  offline: "Connect to the internet and try again.",
  sessionExpired: "Your session expired. Sign in again.",
  stale: "The photo changed on another request. Refresh its status.",
  genericError: "The profile photo could not be updated right now.",
  deleteTitle: "Remove profile photo?",
  deleteCurrentBody: "The current public profile photo will be removed.",
  deleteDraftBody: "The private replacement draft will be removed.",
  deleteAction: "Remove",
  cancel: "Cancel",
} as const;

export type SocialManagedAvatarCopy = Record<keyof typeof en, string>;

const ru: SocialManagedAvatarCopy = {
  title: "Фото профиля",
  description:
    "Фото загружается приватно, проходит проверку и публикуется только после одобрения. Серверная проверка остаётся основной.",
  current: "Текущее публичное фото",
  replacement: "Предпросмотр нового фото",
  empty: "Публичное фото профиля не установлено",
  profileRequired: "Сначала сохраните социальный профиль, затем добавьте фото.",
  select: "Выбрать фото",
  change: "Выбрать другое фото",
  refresh: "Обновить статус",
  retry: "Повторить",
  remove: "Удалить фото",
  removing: "Удаление…",
  selecting: "Открытие медиатеки…",
  preparing: "Подготовка фото…",
  uploading: "Приватная загрузка…",
  completing: "Проверка загрузки…",
  binding: "Публикация одобренного фото…",
  polling: "Проверка статуса модерации…",
  approvedTitle: "Фото одобрено",
  approvedBody: "Одобренное изображение опубликовано как фото профиля.",
  uploadPendingTitle: "Загрузка не завершена",
  uploadPendingBody:
    "Выберите фото ещё раз, чтобы начать приватную загрузку заново.",
  quarantinedTitle: "Загрузка получена",
  quarantinedBody: "Приватное изображение ожидает обработки.",
  processingTitle: "Фото проверяется",
  processingBody:
    "Текущее одобренное фото остаётся публичным во время проверки.",
  reviewTitle: "Нужна ручная проверка",
  reviewBody:
    "Новое фото остаётся приватным. Текущее одобренное фото не изменено.",
  rejectedTitle: "Фото не одобрено",
  rejectedBody:
    "Новое изображение остаётся приватным. Выберите другое фото или удалите черновик.",
  failedTitle: "Не удалось обработать фото",
  failedBody:
    "Текущее одобренное фото не изменено. Повторите загрузку с другим изображением.",
  deletedTitle: "Фото удалено",
  deletedBody: "Управляемое изображение больше не привязано к профилю.",
  preserveCurrent:
    "Текущее одобренное фото останется публичным до одобрения замены.",
  permissionDenied:
    "Разрешите доступ к медиатеке в настройках системы и повторите попытку.",
  selectionFailed: "Не удалось открыть выбранное фото.",
  unsupportedImage: "Выберите поддерживаемое статичное изображение.",
  processingFailed: "Не удалось подготовить фото на этом устройстве.",
  tooLarge:
    "После подготовки фото всё ещё больше 8 МБ. Выберите изображение меньшего размера.",
  uploadExpired: "Срок приватной загрузки истёк. Выберите фото ещё раз.",
  uploadUnavailable: "Управляемая загрузка фото пока недоступна в этой среде.",
  validationFailed: "Сервер отклонил изображение. Выберите другое фото.",
  offline: "Подключитесь к интернету и повторите попытку.",
  sessionExpired: "Сессия истекла. Войдите снова.",
  stale: "Фото изменилось в другом запросе. Обновите статус.",
  genericError: "Сейчас не удалось обновить фото профиля.",
  deleteTitle: "Удалить фото профиля?",
  deleteCurrentBody: "Текущее публичное фото профиля будет удалено.",
  deleteDraftBody: "Приватный черновик замены будет удалён.",
  deleteAction: "Удалить",
  cancel: "Отмена",
};

export const getSocialManagedAvatarCopy = (
  locale: SupportedLocale,
): SocialManagedAvatarCopy => (locale === "ru" ? ru : en);
