import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import CarRentalHomeScreen from '../screens/HomeScreen/CarRentalHomeScreen';

const Stack = createNativeStackNavigator();

export function CarRentalExploreNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CarRentalHome" component={CarRentalHomeScreen} />
    </Stack.Navigator>
  );
}
