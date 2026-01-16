import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CarRentalHomeScreen from '../screens/HomeScreen/CarRentalHomeScreen';
import CarDetailsScreen from '../screens/CarDetails/CarDetailsScreen';

export type CarRentalStackParamList = {
  CarRentalHome: undefined;
  CarDetails: { carId: string };
};

const Stack = createNativeStackNavigator<CarRentalStackParamList>();

export function CarRentalNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CarRentalHome" component={CarRentalHomeScreen} />
      <Stack.Screen name="CarDetails" component={CarDetailsScreen} />
    </Stack.Navigator>
  );
}
