import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RentalCar, RentalSearchResult } from '@/types/rental';

import SearchLocationScreen from '../screens/SearchLocationScreen/SearchLocationScreen';
import SelectDatesScreen from '../screens/SelectDateScreen/SelectDatesScreen';
import SelectTimesScreen from '../screens/SelectTimeScreen/SelectTimesScreen';
import ChooseVehicleScreen from '../screens/ChooseVehicle/ChooseVehicleScreen';
import VehicleDetailsScreen from '../screens/VehicleDetailsScreen/VehicleDetailsScreen';
import PaymentScreen from '../screens/Payment/PaymentScreen';
import BookingStatusScreen from '../screens/BookingStatus/BookingStatusScreen';
import BookingDetailsScreen from '../screens/BookingDetails/BookingDetailScreen';

export type CarRentalFlowParamList = {
  SearchLocation: {
    pickupDate?: string;
    returnDate?: string;
    pickupTime?: string;
    returnTime?: string;
  };
  SelectDates: {
    pickupDate?: string;
    returnDate?: string;
  };
  SelectTimes: {
    pickupTime?: string;
    returnTime?: string;
  };
  ChooseVehicle: {
    search: RentalSearchResult['search'];
    cars: RentalCar[];
    pickupLocationId: string;
    dropoffLocationId: string;
    pickupLocationName?: string;
    dropoffLocationName?: string;
  };
  VehicleDetails: {
    vehicleId: string;
    car?: RentalCar;
    search?: RentalSearchResult['search'];
    pickupLocationName?: string;
    dropoffLocationName?: string;
  };
  PaymentScreen: {
    vehicleId?: string;
    car?: RentalCar;
    search?: RentalSearchResult['search'];
    pickupLocationName?: string;
    dropoffLocationName?: string;
    insuranceId?: string;
  };
  BookingStatus: { status: 'success' | 'failure' };
  BookingDetails: { bookingId: string };
};

const Stack = createNativeStackNavigator<CarRentalFlowParamList>();

export function CarRentalFlowNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
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
      <Stack.Screen name="BookingDetails" component={BookingDetailsScreen} />
    </Stack.Navigator>
  );
}
