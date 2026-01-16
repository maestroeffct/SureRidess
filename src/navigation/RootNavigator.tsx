import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SplashScreen } from '@/screens/branding/Splashscreen';
import { MainNavigator } from './MainNavigator';
import { useAuth } from '@/providers/AuthProvider';
import { AuthNavigator } from './Auth/AuthNavigator';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const { status } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {status === 'initializing' && (
        <Stack.Screen name="Splash" component={SplashScreen} />
      )}

      {status === 'unauthenticated' && (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}

      {status === 'pendingProfile' && (
        <Stack.Screen
          name="ProfileCompletion"
          component={() => null} // placeholder
        />
      )}

      {status === 'authenticated' && (
        <Stack.Screen name="Main" component={MainNavigator} />
      )}
    </Stack.Navigator>
  );
}
