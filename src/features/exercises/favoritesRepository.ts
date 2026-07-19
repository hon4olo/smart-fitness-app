import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_STORAGE_KEY = 'exercise-catalog-favorites';

export const loadFavoriteExerciseIds = async (): Promise<Set<string>> => {
  const raw = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);

  if (!raw) {
    return new Set();
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return new Set(Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : []);
  } catch {
    return new Set();
  }
};

export const saveFavoriteExerciseIds = async (favoriteIds: Iterable<string>): Promise<void> => {
  await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(new Set(favoriteIds))));
};
