import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '@/screens/main/Home/HomeScreen';
import { ProfileScreen } from '@/screens/main/Profile/ProfileScreen';
import { CarRentalTabsNavigator } from '@/modules/car-rental/navigation/CarRentalTabNavigator';
import { CarRentalFlowNavigator } from '@/modules/car-rental/navigation/CarRentalFlowNavigator';
import { getItem, StorageKeys } from '@/helpers/storage';

import type { MainStackParamList } from '@/navigation/types';

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainNavigator() {
  const [initialRoute, setInitialRoute] =
    useState<keyof MainStackParamList>('Home');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function restoreLastModule() {
      try {
        const lastModule = await getItem<string>(StorageKeys.LAST_MODULE);

        if (lastModule === 'car_rental') {
          setInitialRoute('CarRentalTabs');
        }
      } catch (error) {
        console.warn('[MainNavigator] Failed to restore last module', error);
      } finally {
        setReady(true);
      }
    }

    restoreLastModule();
  }, []);

  if (!ready) return null; // splash already shown above

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="CarRentalTabs" component={CarRentalTabsNavigator} />
      <Stack.Screen
        name="CarRentalFlowNavigator"
        component={CarRentalFlowNavigator}
      />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}
