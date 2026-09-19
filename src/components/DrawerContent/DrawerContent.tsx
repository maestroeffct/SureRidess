import React from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useTranslation } from 'react-i18next';

import { Typo } from '@/components/AppText/Typo';
import { useAuth } from '@/providers/AuthProvider';
import { setItem, removeItem, StorageKeys } from '@/helpers/storage';

import styles from './styles';

export function DrawerContent({ navigation }: DrawerContentComponentProps) {
  const { user, logout } = useAuth();
  const { t } = useTranslation('common');

  const apps = [
    { key: 'car_rental', label: t('drawerContent.apps.carRental'), enabled: true },
    { key: 'rideshare', label: t('drawerContent.apps.rideshare'), enabled: false },
    { key: 'mobile_mechanic', label: t('drawerContent.apps.mobileMechanic'), enabled: false },
    { key: 'insurance', label: t('drawerContent.apps.insurance'), enabled: false },
    { key: 'auto_deal', label: t('drawerContent.apps.autoDealMarketplace'), enabled: false },
    { key: 'spare_parts', label: t('drawerContent.apps.spareParts'), enabled: false },
    { key: 'remote_diag', label: t('drawerContent.apps.remoteDiagnostics'), enabled: false },
  ];

  const handleAppPress = async (key: string, enabled: boolean) => {
    if (!enabled) return;

    await setItem(StorageKeys.LAST_MODULE, key);
    navigation.closeDrawer();

    if (key === 'car_rental') {
      navigation.navigate('MainStack', {
        screen: 'CarRentalTabs',
      });
    }
  };

  const initials = `${user?.firstName?.[0] || ''}${
    user?.lastName?.[0] || ''
  }`.toUpperCase();

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Image
          source={require('@/assets/images/logo-text.png')}
          style={styles.tagline}
          resizeMode="contain"
        />
        {/* <Typo variant="caption" style={styles.tagline}>
          Your complete mobility partner
        </Typo> */}
      </View>

      {/* APPS */}
      <Typo style={styles.sectionTitle}>{t('drawerContent.appsSectionTitle')}</Typo>

      {apps.map(app => (
        <TouchableOpacity
          key={app.key}
          style={[styles.appItem, app.enabled && styles.activeAppItem]}
          activeOpacity={app.enabled ? 0.7 : 1}
          onPress={() => handleAppPress(app.key, app.enabled)}
        >
          <Typo style={[styles.appText, app.enabled && styles.activeAppText]}>
            {app.label}
          </Typo>
        </TouchableOpacity>
      ))}

      {/* DIVIDER */}
      <View style={styles.divider} />

      {/* ACCOUNT SETTINGS */}
      <Typo style={styles.sectionTitle}>{t('drawerContent.accountSettingsSectionTitle')}</Typo>

      <TouchableOpacity
        style={styles.appItem}
        onPress={() => navigation.navigate('MainStack', { screen: 'Profile' })}
      >
        <Typo style={styles.appText}>{t('drawerContent.profile')}</Typo>
      </TouchableOpacity>

      <TouchableOpacity style={styles.appItem}>
        <Typo style={styles.appText}>{t('drawerContent.settings')}</Typo>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.appItem}
        onPress={async () => {
          await removeItem(StorageKeys.LAST_MODULE);
          logout();
        }}
      >
        <Typo style={styles.logoutText}>{t('drawerContent.logOut')}</Typo>
      </TouchableOpacity>

      {/* FOOTER */}
      <View style={styles.footer}>
        <View style={styles.avatar}>
          <Typo style={styles.avatarText}>{initials}</Typo>
        </View>

        <View>
          <Typo style={styles.userName}>
            {user?.firstName} {user?.lastName}
          </Typo>
          <Typo style={styles.userEmail}>{user?.email}</Typo>
        </View>
      </View>
    </View>
  );
}
