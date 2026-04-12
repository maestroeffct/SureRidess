import AsyncStorage from '@react-native-async-storage/async-storage';

export const StorageKeys = {
  COUNTRIES: 'CACHED_COUNTRIES',
  AUTH_TOKEN: 'AUTH_TOKEN',
  PROFILE_COMPLETE: 'PROFILE_COMPLETE',
  AUTH_USER: 'AUTH_USER',
  LAST_MODULE: 'LAST_MODULE',
  THEME_MODE: 'THEME_MODE',
};

export async function setItem<T>(key: string, value: T): Promise<void> {
  if (value === undefined || value === null) {
    throw new Error(
      `[Storage] Attempted to store invalid value for key ${key}`,
    );
  }

  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function getItem<T>(key: string): Promise<T | null> {
  const value = await AsyncStorage.getItem(key);
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn(`[Storage] Failed to parse value for key ${key}`, error);
    await AsyncStorage.removeItem(key);
    return null;
  }
}

export async function removeItem(key: string) {
  await AsyncStorage.removeItem(key);
}
