import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { CurrencyProvider } from '@/providers/CurrencyProvider';
import { FavoritesProvider } from '@/providers/FavoritesProvider';
import { RootNavigator } from '@/navigation/RootNavigator';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { navigationRef } from '@/navigation/navigationRef';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <CurrencyProvider>
          <FavoritesProvider>
            <AuthProvider>
              <NavigationContainer ref={navigationRef}>
                <RootNavigator />
              </NavigationContainer>
            </AuthProvider>
          </FavoritesProvider>
        </CurrencyProvider>
      </ThemeProvider>
      <Toast />
    </GestureHandlerRootView>
  );
}
