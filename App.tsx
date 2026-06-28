import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  DarkTheme as NavDarkTheme,
  DefaultTheme as NavDefaultTheme,
  NavigationContainer,
  Theme as NavTheme,
} from '@react-navigation/native';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { CountryProvider } from '@/providers/CountryProvider';
import { CurrencyProvider } from '@/providers/CurrencyProvider';
import { FavoritesProvider } from '@/providers/FavoritesProvider';
import { RootNavigator } from '@/navigation/RootNavigator';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { navigationRef } from '@/navigation/navigationRef';

// Themed NavigationContainer wrapper. Sits inside ThemeProvider so it can
// read the current theme — the navigator's root surface paint is what shows
// during tab transitions; without this, react-navigation defaults to white
// and you see a white flash on every tab change in dark mode.
function ThemedNavigation() {
  const { mode, colors } = useTheme();
  const base = mode === 'dark' ? NavDarkTheme : NavDefaultTheme;
  const theme: NavTheme = {
    ...base,
    colors: {
      ...base.colors,
      background: colors.background,
      card: colors.surface,
      text: colors.textPrimary,
      border: colors.border,
      primary: '#0A6A4B',
      notification: '#EF4444',
    },
  };

  return (
    <GestureHandlerRootView
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <NavigationContainer ref={navigationRef} theme={theme}>
        <RootNavigator />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <CurrencyProvider>
        <CountryProvider>
          <FavoritesProvider>
            <AuthProvider>
              <ThemedNavigation />
            </AuthProvider>
          </FavoritesProvider>
        </CountryProvider>
      </CurrencyProvider>
      <Toast />
    </ThemeProvider>
  );
}
