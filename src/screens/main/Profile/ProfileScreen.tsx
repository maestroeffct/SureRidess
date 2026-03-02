import React from 'react';
import { ScrollView, View } from 'react-native';

import { ScreenWrapper } from '@/components/Screenwrapper/Screenwrapper';
import { AppHeroHeader } from '@/components/AppHeroHeader/AppHeroHeader';
import { AppContentContainer } from '@/components/AppContentContainer/AppContentContainer';
import { ProfileInfoRow } from '@/components/ProfileInfoRow/ProfileInfoRow';
import { AppButton } from '@/components/AppButton/CustomButton';

import { useAuth } from '@/providers/AuthProvider';
import { logoutUser } from '@/services/auth.service';
import styles from './styles';
import { removeItem, StorageKeys } from '@/helpers/storage';

export const ProfileScreen = () => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await removeItem(StorageKeys.LAST_MODULE);
      await logoutUser();
      logout();
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  return (
    <ScreenWrapper padded={false}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HERO */}
        <AppHeroHeader titleText="Profile" />

        {/* CONTENT */}
        <AppContentContainer>
          <ProfileInfoRow label="First Name" value="Jola" />
          <ProfileInfoRow label="Last Name" value="Akin" />
          <ProfileInfoRow label="Email" value="jolaakin@gmail.com" verified />
          <ProfileInfoRow label="Phone Number" value="08128900048" verified />
          <ProfileInfoRow label="Nationality" value="Nigerian" />
          <ProfileInfoRow label="Date of Birth" value="06/02/2000" />
          <ProfileInfoRow label="Password" value="**********" />

          {/* LOGOUT BUTTON */}
          <View style={styles.button}>
            <AppButton title="Logout" onPress={handleLogout} />
          </View>
        </AppContentContainer>
      </ScrollView>
    </ScreenWrapper>
  );
};

export default ProfileScreen;
