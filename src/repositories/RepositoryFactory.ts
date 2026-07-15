import type { CloudProvider } from '@/cloud';
import type { AppRepository } from './AppRepository';
import { createLocalAppRepository } from './LocalAppRepository';
import type { StorageAdapter } from '@/storage';

export type RepositoryFactoryOptions = {
  cloudProvider?: CloudProvider;
};

export type RepositoryProvider = {
  cloudProvider?: CloudProvider;
  getRepository(): AppRepository;
};

export const createRepositoryFactory = (storage: StorageAdapter, options: RepositoryFactoryOptions = {}): RepositoryProvider => {
  const repository = createLocalAppRepository(storage, options);
  void options.cloudProvider;

  return {
    cloudProvider: options.cloudProvider,
    getRepository: () => repository,
  };
};
