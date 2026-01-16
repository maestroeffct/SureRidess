import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';

import { LightColors } from './light';
import { DarkColors } from './dark';
import { ThemeColors, ThemeMode } from './types';

type ThemeContextValue = {
  mode: ThemeMode;
  colors: ThemeColors;
};

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  colors: LightColors,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const mode: ThemeMode = scheme === 'dark' ? 'dark' : 'light';

  const colors = mode === 'dark' ? DarkColors : LightColors;

  return (
    <ThemeContext.Provider value={{ mode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
