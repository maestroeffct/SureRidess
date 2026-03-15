import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from '@react-native-vector-icons/ionicons';

// import { CarRentalExploreNavigator } from './CarRentalExploreNavigator';
import { ProfileScreen } from '@/screens/main/Profile/ProfileScreen';
// import { CarRentalBookingNavigator } from './CarRentalBookingNavigator';
import CarRentalHomeScreen from '../screens/HomeScreen/CarRentalHomeScreen';
import BookingsScreen from '../screens/Bookings/BookingsScreen';

const Tab = createBottomTabNavigator();

export function CarRentalTabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0A6A4B',
      }}
    >
      <Tab.Screen
        name="Explore"
        component={CarRentalHomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="car" color={color} size={size} />
          ),
        }}
      />

      <Tab.Screen
        name="Bookings"
        component={BookingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="calendar" color={color} size={size} />
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="person" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
