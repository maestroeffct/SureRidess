import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Typo } from '@/components/AppText/Typo';
import styles from './styles';

export function ProfileScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Typo variant="heading">Profile</Typo>
        <Typo variant="body">Manage your account & preferences</Typo>
      </View>

      {/* Menu */}
      <View style={styles.menu}>
        <ProfileItem title="Personal Information" />
        <ProfileItem title="Bookings & Trips" />
        <ProfileItem title="Payment Methods" />
        <ProfileItem title="Settings" />
        <ProfileItem title="Logout" danger />
      </View>
    </View>
  );

  function ProfileItem({ title, danger }: { title: string; danger?: boolean }) {
    return (
      <TouchableOpacity
        style={[
          styles.item,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <Typo color={danger ? colors.danger : colors.textPrimary}>{title}</Typo>
      </TouchableOpacity>
    );
  }
}
