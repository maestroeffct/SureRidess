import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import BookingsScreen from '../screens/Bookings/BookingsScreen';

const Stack = createNativeStackNavigator();

export function CarRentalBookingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CarRentalBooking" component={BookingsScreen} />
    </Stack.Navigator>
  );
}
