import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  Modal,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import {
  CompositeNavigationProp,
  useNavigation,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';

import { Typo } from '@/components/AppText/Typo';
import { useTheme } from '@/theme/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import type { MainStackParamList, MainDrawerParamList } from '@/navigation/types';
import { removeItem, setItem, StorageKeys } from '@/helpers/storage';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { logoutUser } from '@/services/auth.service';
import { AppAlert } from '@/components/AppAlert/AppAlert';
import { PromoBannerCarousel } from '@/components/PromoBannerCarousel/PromoBannerCarousel';
import { KycBanner } from '@/components/KycBanner/KycBanner';

type NavProp = CompositeNavigationProp<
  DrawerNavigationProp<MainDrawerParamList>,
  NativeStackNavigationProp<MainStackParamList>
>;

type Module = {
  key: string;
  title: string;
  description: string;
  icon: React.ComponentProps<typeof Icon>['name'];
  accent: string;
  enabled: boolean;
  onPress?: () => void;
};

function initials(first?: string | null, last?: string | null) {
  return ((first?.[0] ?? '') + (last?.[0] ?? '')).toUpperCase() || 'U';
}

export function HomeScreen() {
  const { colors, mode } = useTheme();
  const { user, logout } = useAuth();
  const navigation = useNavigation<NavProp>();
  const { count: unreadCount } = useUnreadNotifications();

  const insets = useSafeAreaInsets();
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [logoutAlertOpen, setLogoutAlertOpen] = useState(false);

  const firstName = user?.firstName?.trim() || 'there';

  const handleLogout = async () => {
    setLogoutAlertOpen(false);
    try {
      await removeItem(StorageKeys.LAST_MODULE);
      await logoutUser();
      logout();
    } catch {
      logout();
    }
  };

  const modules: Module[] = [
    {
      key: 'car_rental',
      title: 'Car Rental',
      description: 'Rent verified vehicles near you',
      icon: 'car-outline',
      accent: '#0A6A4B',
      enabled: true,
      onPress: async () => {
        await setItem(StorageKeys.LAST_MODULE, 'car_rental');
        navigation.navigate('CarRentalTabs');
      },
    },
    {
      key: 'rideshare',
      title: 'Ride Share',
      description: 'Pool rides with trusted drivers',
      icon: 'people-outline',
      accent: '#4F46E5',
      enabled: false,
    },
    {
      key: 'mobile_mechanic',
      title: 'Mobile Mechanic',
      description: 'On-demand repairs at your location',
      icon: 'construct-outline',
      accent: '#0369A1',
      enabled: false,
    },
    {
      key: 'emergency',
      title: 'Emergency Assistance',
      description: 'Roadside help when you need it most',
      icon: 'alert-circle-outline',
      accent: '#DC2626',
      enabled: false,
    },
    {
      key: 'insurance',
      title: 'Insurance',
      description: 'Protect your vehicle & journeys',
      icon: 'shield-checkmark-outline',
      accent: '#2F6F62',
      enabled: false,
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#0A6A4B' }}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      {/* ── GREEN HERO HEADER ── */}
      <View style={[s.hero, { paddingTop: insets.top + 8 }]}>
        {/* Top bar */}
        <View style={s.topBar}>
          <View style={s.logoRow}>
            <Image
              source={require('@/assets/images/logo.png')}
              style={s.logoImg}
              resizeMode="contain"
            />
            <Typo style={s.logoText}>SURERIDE</Typo>
          </View>

          <View style={s.topRight}>
            {/* Bell */}
            <TouchableOpacity
              style={s.topBarBtn}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('NotificationInbox')}
            >
              <Icon name="notifications-outline" size={22} color="#fff" />
              {unreadCount > 0 ? (
                <View style={s.badge}>
                  <Typo style={s.badgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Typo>
                </View>
              ) : null}
            </TouchableOpacity>

            {/* Avatar — opens account menu */}
            <TouchableOpacity
              style={s.avatarBtn}
              activeOpacity={0.8}
              onPress={() => setAvatarMenuOpen(true)}
            >
              <Typo style={s.avatarText}>
                {initials(user?.firstName, user?.lastName)}
              </Typo>
            </TouchableOpacity>
          </View>
        </View>

        {/* Greeting */}
        <View style={s.greeting}>
          <Typo style={s.greetSub}>Good to see you,</Typo>
          <Typo style={s.greetName}>Hello, {firstName}</Typo>
          <Typo style={s.greetCaption}>
            Choose a service to get started
          </Typo>
        </View>
      </View>

      {/* ── SERVICE LIST ── */}
      <ScrollView
        style={[s.sheet, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Admin-managed promo banners (HOME_HERO) — renders nothing if
            none are active, so no layout shift when the list is empty. */}
        <KycBanner />
        <PromoBannerCarousel placement="HOME_HERO" topGap={16} bottomGap={4} />

        <Typo style={[s.listHeader, { color: colors.textSecondary }]}>
          Available Services
        </Typo>

        {modules.map(mod => (
          <ModuleRow
            key={mod.key}
            mod={mod}
            colors={colors}
          />
        ))}

        {/* Coming soon note */}
        <Typo style={[s.footnote, { color: colors.textSecondary }]}>
          More services launching soon
        </Typo>
      </ScrollView>

      {/* ── ACCOUNT MENU POPUP ── */}
      <Modal
        visible={avatarMenuOpen}
        transparent
        animationType="fade"
        hardwareAccelerated
        presentationStyle="overFullScreen"
        onRequestClose={() => setAvatarMenuOpen(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={s.menuBackdrop}
          onPress={() => setAvatarMenuOpen(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[s.menuCard, { backgroundColor: colors.surface }]}
            onPress={e => e.stopPropagation()}
          >
            {/* User info header */}
            <View style={[s.menuHeader, { borderBottomColor: colors.border }]}>
              <View style={s.menuAvatar}>
                <Typo style={s.menuAvatarText}>
                  {initials(user?.firstName, user?.lastName)}
                </Typo>
              </View>
              <View style={{ flex: 1 }}>
                <Typo style={[s.menuName, { color: colors.textPrimary }]} numberOfLines={1}>
                  {user?.firstName} {user?.lastName}
                </Typo>
                {user?.email ? (
                  <Typo style={[s.menuEmail, { color: colors.textSecondary }]} numberOfLines={1}>
                    {user.email}
                  </Typo>
                ) : null}
              </View>
            </View>

            {/* Log out action */}
            <TouchableOpacity
              style={s.menuItem}
              onPress={() => {
                setAvatarMenuOpen(false);
                setLogoutAlertOpen(true);
              }}
              activeOpacity={0.6}
            >
              <View style={[s.menuItemIcon, { backgroundColor: '#FEF2F2' }]}>
                <Icon name="log-out-outline" size={18} color="#EF4444" />
              </View>
              <Typo style={[s.menuItemLabel, { color: '#EF4444' }]}>Log out</Typo>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── LOGOUT CONFIRMATION ── */}
      <AppAlert
        visible={logoutAlertOpen}
        title="Log out"
        message="Are you sure you want to log out?"
        buttons={[
          { text: 'Cancel', style: 'cancel', onPress: () => setLogoutAlertOpen(false) },
          { text: 'Log out', style: 'destructive', onPress: handleLogout },
        ]}
        onDismiss={() => setLogoutAlertOpen(false)}
      />
    </View>
  );
}

/* ─────────────────────────────────── */
/*  Module Row Card                    */
/* ─────────────────────────────────── */

function ModuleRow({
  mod,
  colors,
}: {
  mod: Module;
  colors: any;
}) {
  return (
    <TouchableOpacity
      style={[
        s.moduleCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
        !mod.enabled && s.moduleCardDisabled,
      ]}
      activeOpacity={mod.enabled ? 0.75 : 1}
      onPress={mod.enabled ? mod.onPress : undefined}
    >
      {/* Icon circle */}
      <View style={[s.moduleIcon, { backgroundColor: mod.accent + '18' }]}>
        <Icon name={mod.icon} size={24} color={mod.accent} />
      </View>

      {/* Text */}
      <View style={s.moduleText}>
        <Typo style={[s.moduleTitle, { color: colors.textPrimary }, !mod.enabled && { opacity: 0.5 }]}>
          {mod.title}
        </Typo>
        <Typo style={[s.moduleDesc, { color: colors.textSecondary }, !mod.enabled && { opacity: 0.5 }]}>
          {mod.description}
        </Typo>
      </View>

      {/* Right */}
      {mod.enabled ? (
        <View style={[s.launchBtn, { backgroundColor: mod.accent }]}>
          <Icon name="arrow-forward" size={16} color="#fff" />
        </View>
      ) : (
        <View style={[s.soonPill, { backgroundColor: colors.background }]}>
          <Typo style={[s.soonText, { color: colors.textSecondary }]}>Soon</Typo>
        </View>
      )}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  /* hero */
  hero: {
    backgroundColor: '#0A6A4B',
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginBottom: 20,
  },
  topBarBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoImg: {
    width: 32,
    height: 32,
  },
  logoText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0A6A4B',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },

  greeting: {
    gap: 4,
  },
  greetSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
  greetName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 30,
  },
  greetCaption: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    marginTop: 4,
  },

  /* sheet */
  sheet: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 20,
    marginTop: -8,
  },
  listHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
    paddingHorizontal: 4,
  },

  /* module card */
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
    gap: 14,
  },
  moduleCardDisabled: {
    opacity: 0.7,
  },
  moduleIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleText: {
    flex: 1,
    gap: 3,
  },
  moduleTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  moduleDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  launchBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soonPill: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  soonText: {
    fontSize: 11,
    fontWeight: '600',
  },

  footnote: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 12,
  },

  /* ── account menu ── */
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingTop: 70,
    paddingHorizontal: 16,
    alignItems: 'flex-end',
  },
  menuCard: {
    width: 260,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 16,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderBottomWidth: 1,
  },
  menuAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0A6A4B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuAvatarText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  menuName: {
    fontSize: 14,
    fontWeight: '700',
  },
  menuEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  menuItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemLabel: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});
