export const CLOUD_SYNC_STATUSES = ['idle', 'syncing', 'offline', 'error', 'conflict', 'needsAuthentication'] as const;

export type CloudSyncStatus = (typeof CLOUD_SYNC_STATUSES)[number];
