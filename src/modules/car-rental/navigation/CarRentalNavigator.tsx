import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CarRentalHomeScreen from '../screens/HomeScreen/CarRentalHomeScreen';
import SearchLocationScreen from '../screens/SearchLocationScreen/SearchLocationScreen';
import SelectDatesScreen from '../screens/SelectDateScreen/SelectDatesScreen';
import SelectTimesScreen from '../screens/SelectTimeScreen/SelectTimesScreen';
import ChooseVehicleScreen from '../screens/ChooseVehicle/ChooseVehicleScreen';
import VehicleDetailsScreen from '../screens/VehicleDetailsScreen/VehicleDetailsScreen';
import PaymentScreen from '../screens/Payment/PaymentScreen';
import BookingStatusScreen from '../screens/BookingStatus/BookingStatusScreen';

export type CarRentalStackParamList = {
  CarRentalHome: undefined;
  CarDetails: { carId: string };
  SearchLocation: undefined;
  SelectDates: undefined;
  SelectTimes: undefined;
  ChooseVehicle: undefined;
  VehicleDetails: { vehicleId: string };
  PaymentScreen: undefined;
  BookingStatus: { status: 'success' | 'failure' };
};

const Stack = createNativeStackNavigator<CarRentalStackParamList>();

export function CarRentalNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CarRentalHome" component={CarRentalHomeScreen} />
      <Stack.Screen
        name="SearchLocation"
        component={SearchLocationScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen name="SelectDates" component={SelectDatesScreen} />
      <Stack.Screen name="SelectTimes" component={SelectTimesScreen} />

      <Stack.Screen name="ChooseVehicle" component={ChooseVehicleScreen} />
      <Stack.Screen name="VehicleDetails" component={VehicleDetailsScreen} />
      <Stack.Screen name="PaymentScreen" component={PaymentScreen} />
      <Stack.Screen name="BookingStatus" component={BookingStatusScreen} />
    </Stack.Navigator>
  );
}
