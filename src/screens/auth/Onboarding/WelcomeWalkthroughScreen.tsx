import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { Typo } from '@/components/AppText/Typo';
import { setItem, StorageKeys } from '@/helpers/storage';

const { width: W } = Dimensions.get('window');
const GREEN = '#0A6A4B';
const GREEN_DARK = '#064030';

type Slide = {
  key: string;
  icon: React.ComponentProps<typeof Icon>['name'];
  titleKey: string;
  bodyKey: string;
};

const SLIDES: Slide[] = [
  { key: 'welcome', icon: 'car-sport-outline', titleKey: 'slide1Title', bodyKey: 'slide1Body' },
  { key: 'browse', icon: 'search-outline', titleKey: 'slide2Title', bodyKey: 'slide2Body' },
  { key: 'verify', icon: 'shield-checkmark-outline', titleKey: 'slide3Title', bodyKey: 'slide3Body' },
];

/**
 * Runs once, right after signup + country selection (see RootNavigator).
 * Purely informational — the last slide's two CTAs both land the user in
 * the app; KYC isn't required here since the existing KYC-prompt modal in
 * RootNavigator already nudges unverified users on every launch.
 */
export function WelcomeWalkthroughScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation('onboarding');
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);
  const isLast = index === SLIDES.length - 1;

  const markDone = () => {
    void setItem(StorageKeys.HAS_COMPLETED_POST_AUTH_ONBOARDING, true);
  };

  // Main / KYCFlow are declared as siblings of this screen in the same
  // authenticated stack (see RootNavigator), so a plain replace swaps this
  // onboarding screen out of history entirely — no "back" path returns here.
  const goToMain = () => {
    markDone();
    navigation.replace('Main');
  };

  const goToKyc = () => {
    markDone();
    navigation.replace('KYCFlow', { screen: 'KycStatus' });
  };

  const next = () => {
    if (isLast) {
      goToMain();
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    setIndex(i => i + 1);
  };

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / W);
    if (i !== index) setIndex(i);
  };

  return (
    <View style={[s.root, { backgroundColor: GREEN }]}>
      <StatusBar barStyle="light-content" backgroundColor={GREEN} />
      <SafeAreaView style={s.safe}>
        <TouchableOpacity style={s.skipBtn} onPress={goToMain} activeOpacity={0.7}>
          <Typo style={s.skipText}>{t('welcomeWalkthrough.skip')}</Typo>
        </TouchableOpacity>

        <FlatList
          ref={listRef}
          data={SLIDES}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onMomentumScrollEnd={onMomentumScrollEnd}
          keyExtractor={item => item.key}
          renderItem={({ item }) => (
            <View style={[s.slide, { width: W }]}>
              <View style={s.iconWrap}>
                <Icon name={item.icon} size={64} color="#fff" />
              </View>
              <Typo style={s.title}>{t(`welcomeWalkthrough.${item.titleKey}`)}</Typo>
              <Typo style={s.subtitle}>{t(`welcomeWalkthrough.${item.bodyKey}`)}</Typo>
            </View>
          )}
        />

        <View style={s.dots}>
          {SLIDES.map((slide, i) => (
            <View key={slide.key} style={[s.dot, i === index && s.dotActive]} />
          ))}
        </View>

        <View style={s.bottom}>
          {isLast ? (
            <>
              <TouchableOpacity style={s.cta} onPress={goToKyc} activeOpacity={0.85}>
                <Typo style={s.ctaText}>{t('welcomeWalkthrough.verifyNow')}</Typo>
              </TouchableOpacity>
              <TouchableOpacity style={s.ghostBtn} onPress={goToMain} activeOpacity={0.7}>
                <Typo style={s.ghostBtnText}>{t('welcomeWalkthrough.exploreFirst')}</Typo>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={s.cta} onPress={next} activeOpacity={0.85}>
              <Typo style={s.ctaText}>{t('welcomeWalkthrough.next')}</Typo>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  skipBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  skipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
  slide: {
    flex: 1,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 340,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    width: 22,
    backgroundColor: '#fff',
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 12,
    gap: 12,
  },
  cta: {
    backgroundColor: '#fff',
    borderRadius: 14,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: GREEN_DARK,
    fontSize: 16,
    fontWeight: '700',
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
});
