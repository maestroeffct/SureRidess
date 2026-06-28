import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from '@react-native-vector-icons/ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// import { CarRentalExploreNavigator } from './CarRentalExploreNavigator';
import { ProfileScreen } from '@/screens/main/Profile/ProfileScreen';
// import { CarRentalBookingNavigator } from './CarRentalBookingNavigator';
import CarRentalHomeScreen from '../screens/HomeScreen/CarRentalHomeScreen';
import BookingsScreen from '../screens/Bookings/BookingsScreen';
import { FavoritesScreen } from '../screens/Favorites/FavoritesScreen';
import { useTheme } from '@/theme/ThemeProvider';
import { useFavorites } from '@/providers/FavoritesProvider';

const Tab = createBottomTabNavigator();

export function CarRentalTabsNavigator() {
  const { colors } = useTheme();
  const { favorites } = useFavorites();
  const insets = useSafeAreaInsets();
  const favCount = favorites.length;

  // Pad the tab bar above Android 3-button / gesture handle and the iOS home
  // indicator. Without this, the labels sit on top of the system gesture line.
  const bottomInset =
    Platform.OS === 'android' ? Math.max(insets.bottom, 12) : insets.bottom;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        // Cross-fade between tabs so screens don't pop in. Available since
        // @react-navigation/bottom-tabs v7; `shift` slides, `fade` cross-fades.
        animation: 'shift',
        // Paint the area BEHIND the active screen with the theme background.
        // Without this the navigator's default white shows through during
        // the shift animation and on lazy-mount, causing a flash on dark mode.
        sceneStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: '#0A6A4B',
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 56 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          marginBottom: 0,
        },
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
        name="Saved"
        component={FavoritesScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="heart" color={color} size={size} />
          ),
          tabBarBadge: favCount > 0 ? favCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#EF4444',
            color: '#fff',
            fontSize: 10,
          },
        }}
      />

      <Tab.Screen
        name="Settings"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="settings-outline" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
