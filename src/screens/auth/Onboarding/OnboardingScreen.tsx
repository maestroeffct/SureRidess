import React, { useCallback } from 'react';
import {
  Dimensions,
  Image,
  ImageBackground,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Typo } from '@/components/AppText/Typo';
import { setItem, StorageKeys } from '@/helpers/storage';

const { width: W, height: H } = Dimensions.get('window');
const GREEN = '#0A6A4B';
const GREEN_DARK = '#052A1D';

const HERO = require('@/assets/images/car.png');
const LOGO = require('@/assets/images/logo-text.png');

/**
 * One-screen onboarding: full-bleed car hero, brand mark, one tagline,
 * two CTAs. New users hit Get Started (goes to CountrySelect, then Auth);
 * returning users hit Sign In (jumps straight to Auth).
 */
export function OnboardingScreen() {
  const navigation = useNavigation<any>();

  const markSeen = useCallback(async () => {
    await setItem(StorageKeys.HAS_SEEN_ONBOARDING, true);
  }, []);

  const getStarted = useCallback(async () => {
    await markSeen();
    navigation.replace('CountrySelect');
  }, [markSeen, navigation]);

  const signIn = useCallback(async () => {
    await markSeen();
    navigation.replace('Auth');
  }, [markSeen, navigation]);

  return (
    <View style={s.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <ImageBackground source={HERO} style={s.hero} resizeMode="cover">
        <LinearGradient
          colors={['rgba(5,42,29,0.35)', 'rgba(5,42,29,0.85)', GREEN_DARK]}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFill}
        />

        <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
          {/* Top brand mark */}
          <View style={s.brandWrap}>
            <Image source={LOGO} style={s.logo} resizeMode="contain" />
          </View>

          {/* Bottom content */}
          <View style={s.copyWrap}>
            <Typo style={s.title}>Rent a car in seconds.</Typo>
            <Typo style={s.subtitle}>
              Verified vehicles from trusted hosts across Nigeria and West
              Africa. Book online, pick up, drive.
            </Typo>

            <View style={s.ctaGroup}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={getStarted}
                style={s.primaryBtn}
              >
                <Typo style={s.primaryBtnText}>Get Started</Typo>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={signIn}
                style={s.ghostBtn}
              >
                <Typo style={s.ghostBtnText}>I already have an account</Typo>
              </TouchableOpacity>
            </View>

            <Typo style={s.legal}>
              By continuing you agree to our Terms and Privacy Policy.
            </Typo>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: GREEN_DARK },
  hero: { flex: 1, width: W, height: H },
  safe: { flex: 1, justifyContent: 'space-between' },
  brandWrap: {
    alignItems: 'center',
    paddingTop: 24,
  },
  logo: {
    width: 140,
    height: 42,
    tintColor: '#fff',
  },
  copyWrap: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    gap: 14,
  },
  title: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 15,
    lineHeight: 22,
  },
  ctaGroup: {
    marginTop: 18,
    gap: 12,
  },
  primaryBtn: {
    height: 54,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: GREEN,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  ghostBtn: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  legal: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 6,
  },
});
