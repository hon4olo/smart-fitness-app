import {
  ACCOUNT_SCOPED_ASYNC_STORAGE_KEYS,
  APPLICATION_STATE_STORAGE_KEYS,
  CONFLICT_STORAGE_KEYS,
  LOCAL_DIAGNOSTIC_STORAGE_KEYS,
  SAFETY_STORAGE_KEYS,
  SYNC_METADATA_STORAGE_KEYS,
  SYNC_RECOVERY_STORAGE_KEYS,
} from './mobileAccountDataStorageKeys';

export { ACCOUNT_SCOPED_ASYNC_STORAGE_KEYS } from './mobileAccountDataStorageKeys';

export type MobileAccountDataTransmission =
  | 'backend_auth'
  | 'backend_social'
  | 'backend_sync'
  | 'none';

export type MobileAccountDataDeletion =
  | 'account_cleanup'
  | 'auth_cleanup'
  | 'cleanup_marker';

export type MobileAccountDataSurface = {
  id: string;
  storage: 'async_storage' | 'secure_store';
  storageKeys: readonly string[];
  category: string;
  contains: string;
  purpose: string;
  transmission: MobileAccountDataTransmission;
  deletion: MobileAccountDataDeletion;
  userControl: string;
};

export const MOBILE_ACCOUNT_DATA_SURFACES: readonly MobileAccountDataSurface[] = [
  {
    id: 'application_state',
    storage: 'async_storage',
    storageKeys: APPLICATION_STATE_STORAGE_KEYS,
    category: 'profile_fitness_nutrition',
    contains:
      'Profile inputs, workouts, programs, exercises, completed sessions, food entries, targets, measurements, limitations and recovery check-ins.',
    purpose: 'Offline-first product operation and authoritative local editing.',
    transmission: 'backend_sync',
    deletion: 'account_cleanup',
    userControl: 'Delete account; individual records may also be edited or deleted in product flows.',
  },
  {
    id: 'sync_metadata',
    storage: 'async_storage',
    storageKeys: SYNC_METADATA_STORAGE_KEYS,
    category: 'sync_state',
    contains: 'Entity revisions, tombstones, fingerprints and bounded snapshots used for reconciliation.',
    purpose: 'Incremental synchronization, duplicate-delivery safety and restart recovery.',
    transmission: 'backend_sync',
    deletion: 'account_cleanup',
    userControl: 'Delete account.',
  },
  {
    id: 'sync_queue_and_cursor',
    storage: 'async_storage',
    storageKeys: SYNC_RECOVERY_STORAGE_KEYS,
    category: 'sync_state',
    contains: 'Pending operation envelopes, recovery records, idempotency identity and pull cursor.',
    purpose: 'Offline delivery, retry, ordering and recovery after interruption.',
    transmission: 'backend_sync',
    deletion: 'account_cleanup',
    userControl: 'Retry synchronization or delete account.',
  },
  {
    id: 'sync_conflicts',
    storage: 'async_storage',
    storageKeys: CONFLICT_STORAGE_KEYS,
    category: 'sync_state',
    contains: 'Conflict identity, bounded revision metadata and an explicit saved resolution choice.',
    purpose: 'Prevent silent overwrite and preserve a user decision across retry and restart.',
    transmission: 'backend_sync',
    deletion: 'account_cleanup',
    userControl: 'Resolve an eligible conflict or delete account.',
  },
  {
    id: 'safety_state',
    storage: 'async_storage',
    storageKeys: SAFETY_STORAGE_KEYS,
    category: 'fitness_safety',
    contains: 'Bounded recovery-review state and the acknowledgement shown before a workout.',
    purpose: 'Preserve explicit safety context and immutable completed-workout provenance.',
    transmission: 'backend_sync',
    deletion: 'account_cleanup',
    userControl: 'Delete account; source limitation and recovery records remain editable.',
  },
  {
    id: 'local_state_diagnostics',
    storage: 'async_storage',
    storageKeys: LOCAL_DIAGNOSTIC_STORAGE_KEYS,
    category: 'local_diagnostics',
    contains: 'Aggregate entity counts, serialized byte size, durations and failure counters only.',
    purpose: 'Measure local persistence size and performance without retaining raw records.',
    transmission: 'none',
    deletion: 'account_cleanup',
    userControl: 'Delete account.',
  },
  {
    id: 'user_scoped_caches',
    storage: 'async_storage',
    storageKeys: [],
    category: 'preferences_and_cache',
    contains: 'User-keyed nutrition favourites, nutrition library items and following-feed cache.',
    purpose: 'Fast local access and offline presentation.',
    transmission: 'backend_social',
    deletion: 'account_cleanup',
    userControl: 'Edit the source data, clear it through product flows, or delete account.',
  },
  {
    id: 'auth_session_metadata',
    storage: 'async_storage',
    storageKeys: ['@smart_fitness_mvp_auth_session'],
    category: 'identity_and_authentication',
    contains: 'User, device and session metadata; access and refresh tokens are excluded.',
    purpose: 'Restore a tokenless authenticated session shell.',
    transmission: 'backend_auth',
    deletion: 'auth_cleanup',
    userControl: 'Sign out, change/reset password, or delete account.',
  },
  {
    id: 'auth_tokens',
    storage: 'secure_store',
    storageKeys: ['smart_fitness_auth_tokens_v1'],
    category: 'authentication_secrets',
    contains: 'Access token, refresh token, token type and expiry metadata.',
    purpose: 'Authenticated API access and refresh.',
    transmission: 'backend_auth',
    deletion: 'auth_cleanup',
    userControl: 'Sign out, change/reset password, or delete account.',
  },
  {
    id: 'account_cleanup_marker',
    storage: 'secure_store',
    storageKeys: ['smart_fitness_pending_account_cleanup'],
    category: 'deletion_recovery',
    contains: 'Deleted account user ID and cleanup request timestamp.',
    purpose: 'Resume local deletion after an interrupted process.',
    transmission: 'none',
    deletion: 'cleanup_marker',
    userControl: 'Removed automatically only after account and authentication cleanup completes.',
  },
];

void ACCOUNT_SCOPED_ASYNC_STORAGE_KEYS;
