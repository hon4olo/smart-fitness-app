import type { AppRepository } from './AppRepository';
import { createFoodEntrySyncingRepository } from './FoodEntrySyncingRepository';
import { createLocalAppRepository } from './LocalAppRepository';
import type { RemoteProfileRepository } from './RemoteProfileRepository';
import type { StorageAdapter } from '@/storage/StorageAdapter';
import { createAsyncStorageOperationQueueStore } from '@/storage/AsyncStorageOperationQueueStore';
import { createFoodEntrySyncMetadataStore } from '@/storage/FoodEntrySyncMetadataStore';
import { createApiClient, type ApiClient } from '@/api/client';
import { getMobileApiBaseUrl } from '@/api';
import { createAuthService, createTokenManager, getDefaultAuthDeviceInfo, type AuthService, type TokenManager } from '@/auth';

export type RepositoryFactoryOptions = {
  apiBaseUrl?: string;
  apiClient?: ApiClient;
  tokenManager?: TokenManager;
  authService?: AuthService & { profileRepository: RemoteProfileRepository };
};

export type RepositoryProvider = {
  getRepository(): AppRepository;
  getAuthService(): AuthService & { profileRepository: RemoteProfileRepository };
};

const createNoopAuthService = (): AuthService & { profileRepository: RemoteProfileRepository } => ({
  profileRepository: {
    async fetchProfile() {
      return null;
    },
    async updateProfile() {
      return null;
    },
  },
  async loadSession() {
    return null;
  },
  async register() {
    throw new Error('Auth service is unavailable');
  },
  async login() {
    throw new Error('Auth service is unavailable');
  },
  async refresh() {
    return null;
  },
  async logout() {
    return undefined;
  },
  async fetchProfile() {
    return null;
  },
  async updateProfile() {
    return null;
  },
  async getAccessToken() {
    return null;
  },
  async getCurrentSession() {
    return null;
  },
  async isAuthenticated() {
    return false;
  },
});

export const createRepositoryFactory = (storage: StorageAdapter, options: RepositoryFactoryOptions = {}): RepositoryProvider => {
  const localRepository = createLocalAppRepository(storage);
  const tokenManager = options.tokenManager ?? createTokenManager(storage);
  const apiBaseUrl = options.apiBaseUrl ?? getMobileApiBaseUrl();
  const apiClient = options.apiClient ?? (apiBaseUrl ? createApiClient({ baseUrl: apiBaseUrl }) : undefined);
  const authService =
    options.authService ??
    (apiClient
      ? createAuthService({
          apiClient,
          tokenManager,
          sessionStorage: storage,
          defaultDevice: getDefaultAuthDeviceInfo(),
        })
      : createNoopAuthService());
  const repository = createFoodEntrySyncingRepository(localRepository, {
    authService,
    queueStore: createAsyncStorageOperationQueueStore(storage),
    metadataStore: createFoodEntrySyncMetadataStore(storage),
  });

  return {
    getRepository: () => repository,
    getAuthService: () => authService,
  };
};