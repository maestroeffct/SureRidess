import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';

import { LightColors } from './light';
import { DarkColors } from './dark';
import { ThemeColors, ThemeMode } from './types';
import { getItem, setItem, StorageKeys } from '@/helpers/storage';

/** 'system' means follow the OS preference */
export type ThemePreference = ThemeMode | 'system';

type ThemeContextValue = {
  mode: ThemeMode;           // resolved mode — always 'light' or 'dark'
  preference: ThemePreference;  // what the user explicitly chose
  colors: ThemeColors;
  setPreference: (p: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  preference: 'system',
  colors: LightColors,
  setPreference: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [ready, setReady] = useState(false);

  // Load persisted preference on mount
  useEffect(() => {
    getItem<ThemePreference>(StorageKeys.THEME_MODE)
      .then(saved => {
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setPreferenceState(saved);
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const setPreference = useCallback((p: ThemePreference) => {
    setPreferenceState(p);
    setItem(StorageKeys.THEME_MODE, p).catch(() => {});
  }, []);

  // Resolve actual mode
  const mode: ThemeMode =
    preference === 'system'
      ? (systemScheme === 'dark' ? 'dark' : 'light')
      : preference;

  const colors = mode === 'dark' ? DarkColors : LightColors;

  // Don't render children until preference is loaded to prevent flash
  if (!ready) return null;

  return (
    <ThemeContext.Provider value={{ mode, preference, colors, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
