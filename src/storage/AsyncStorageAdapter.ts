import AsyncStorage from '@react-native-async-storage/async-storage';

import type { StorageAdapter } from './StorageAdapter';

export const createAsyncStorageAdapter = (): StorageAdapter => ({
  read: (key) => AsyncStorage.getItem(key),
  write: (key, value) => AsyncStorage.setItem(key, value),
  remove: (key) => AsyncStorage.removeItem(key),
});
