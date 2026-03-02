import React, { useState } from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import {
  CompositeNavigationProp,
  useNavigation,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ScreenWrapper } from '@/components/Screenwrapper/Screenwrapper';
import { Typo } from '@/components/AppText/Typo';
import { useTheme } from '@/theme/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import type { MainStackParamList } from '@/navigation/types';

import styles from './styles';
import { ModuleCard } from '@/components/ModuleCard/ModuleCard';
import { setItem, StorageKeys } from '@/helpers/storage';
import type { MainDrawerParamList } from '@/navigation/types';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { UserProfilePopup } from '@/components/UserProfilePop/UserProfilePopup';

type NavProp = CompositeNavigationProp<
  DrawerNavigationProp<MainDrawerParamList>,
  NativeStackNavigationProp<MainStackParamList>
>;
export function HomeScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<NavProp>();

  const [showProfile, setShowProfile] = useState(false);

  const modules: {
    title: string;
    icon: React.ComponentProps<typeof Icon>['name'];
    background: string;
    enabled: boolean;
    onPress?: () => void;
  }[] = [
    {
      title: 'CAR RENTAL',
      icon: 'car-outline',
      background: '#066215ff',
      enabled: true,
      onPress: async () => {
        await setItem(StorageKeys.LAST_MODULE, 'car_rental');
        navigation.navigate('CarRentalTabs');
      },
    },

    {
      title: 'RIDE SHARE',
      icon: 'people-outline',
      background: '#121c66ff',
      enabled: false,
    },
    {
      title: 'MOBILE MECHANIC',
      icon: 'construct-outline',
      background: '#07505dff',
      enabled: false,
    },
    {
      title: 'EMERGENCY ASSISTANCE',
      icon: 'alert-circle-outline',
      background: '#6c1a03ff',
      enabled: false,
    },
    {
      title: 'INSURANCE',
      icon: 'shield-checkmark-outline',
      background: '#2F6F62',
      enabled: false,
    },
  ];

  return (
    <ScreenWrapper scrollable>
      {/* TOP BAR */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Icon name="menu-outline" size={26} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.logoWrap}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={{ width: 50, height: 50 }}
            resizeMode="contain"
          />
          <Typo variant="subheading" style={styles.logoText}>
            SURERIDE
          </Typo>
        </View>

        <TouchableOpacity onPress={() => setShowProfile(true)}>
          <Icon
            name="person-circle-outline"
            size={32}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      {/* WELCOME */}
      <View style={styles.welcomeBox}>
        <Typo variant="heading" style={styles.welcomeText}>
          Welcome back, {user?.firstName || 'User'}!
        </Typo>
        <Typo variant="body" style={styles.welcomeSubtext}>
          Explore your SureRide options
        </Typo>
      </View>

      {/* MODULE GRID */}
      <View style={styles.grid}>
        {modules.map(module => (
          <ModuleCard
            key={module.title}
            title={module.title}
            icon={module.icon}
            background={module.background}
            onPress={module.onPress}
            disabled={!module.enabled}
          />
        ))}
      </View>
      <UserProfilePopup
        visible={showProfile}
        onClose={() => setShowProfile(false)}
      />
    </ScreenWrapper>
  );
}
