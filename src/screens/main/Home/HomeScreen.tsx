import React from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import {
  CompositeNavigationProp,
  useNavigation,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';

import { Typo } from '@/components/AppText/Typo';
import { useTheme } from '@/theme/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import type { MainStackParamList, MainDrawerParamList } from '@/navigation/types';
import { setItem, StorageKeys } from '@/helpers/storage';
import { DrawerNavigationProp } from '@react-navigation/drawer';

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
  const { user } = useAuth();
  const navigation = useNavigation<NavProp>();

  const firstName = user?.firstName?.trim() || 'there';

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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A6A4B' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0A6A4B" />

      {/* ── GREEN HERO HEADER ── */}
      <View style={s.hero}>
        {/* Top bar */}
        <View style={s.topBar}>
          <TouchableOpacity
            style={s.topBarBtn}
            onPress={() => navigation.openDrawer()}
            activeOpacity={0.7}
          >
            <Icon name="menu-outline" size={24} color="#fff" />
          </TouchableOpacity>

          <View style={s.logoRow}>
            <Image
              source={require('@/assets/images/logo.png')}
              style={s.logoImg}
              resizeMode="contain"
            />
            <Typo style={s.logoText}>SURERIDE</Typo>
          </View>

          {/* Avatar */}
          <TouchableOpacity
            style={s.avatarBtn}
            activeOpacity={0.8}
            onPress={() => {}}
          >
            <Typo style={s.avatarText}>
              {initials(user?.firstName, user?.lastName)}
            </Typo>
          </TouchableOpacity>
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
    </SafeAreaView>
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
        <View style={s.soonPill}>
          <Typo style={s.soonText}>Soon</Typo>
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
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  soonText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },

  footnote: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 12,
  },
});
