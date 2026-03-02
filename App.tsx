import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { RootNavigator } from '@/navigation/RootNavigator';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { navigationRef } from '@/navigation/navigationRef';

export default function App() {
  return (
    <>
      <ThemeProvider>
        <AuthProvider>
          <NavigationContainer ref={navigationRef}>
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </ThemeProvider>
      <Toast />
    </>
  );
}
