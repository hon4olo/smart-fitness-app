import * as SecureStore from 'expo-secure-store';

import type { StorageAdapter } from './StorageAdapter';

export const createSecureTokenStorageAdapter = (): StorageAdapter => ({
  read(key) {
    return SecureStore.getItemAsync(key);
  },
  async write(key, value) {
    await SecureStore.setItemAsync(key, value);
  },
  async remove(key) {
    await SecureStore.deleteItemAsync(key);
  },
});
