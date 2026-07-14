import type { AppRepository } from './AppRepository';
import { createLocalAppRepository } from './LocalAppRepository';
import type { StorageAdapter } from '@/storage';

export type RepositoryProvider = {
  getRepository(): AppRepository;
};

export const createRepositoryFactory = (storage: StorageAdapter): RepositoryProvider => {
  const repository = createLocalAppRepository(storage);

  return {
    getRepository: () => repository,
  };
};
