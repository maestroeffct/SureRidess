import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '@/screens/main/Home/HomeScreen';
import { CarRentalNavigator } from '@/modules/car-rental/navigation/CarRentalNavigator';
import { ProfileScreen } from '@/screens/main/Profile/ProfileScreen';

export type MainTabParamList = {
  Home: undefined;
  CarRental: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="CarRental" component={CarRentalNavigator} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
