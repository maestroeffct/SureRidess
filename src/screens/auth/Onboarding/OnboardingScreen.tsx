import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import { Typo } from '@/components/AppText/Typo';
import { setItem, StorageKeys } from '@/helpers/storage';

const { width: W } = Dimensions.get('window');
const SLIDE_DURATION = 3500;

type Slide = {
  key: string;
  accent: string;
  icon: React.ComponentProps<typeof Icon>['name'];
  title: string;
  subtitle: string;
};

const SLIDES: Slide[] = [
  {
    key: 'ride',
    accent: '#0A6A4B',
    icon: 'car-sport-outline',
    title: 'Rent Any Car\nNear You',
    subtitle:
      'Browse hundreds of verified vehicles from trusted providers across Nigeria. Pick up and go.',
  },
  {
    key: 'verify',
    accent: '#0369A1',
    icon: 'shield-checkmark-outline',
    title: 'Verified &\nSecure',
    subtitle:
      'Every car and provider is verified. Your KYC keeps your journey safe from booking to drop-off.',
  },
  {
    key: 'book',
    accent: '#6D28D9',
    icon: 'flash-outline',
    title: 'Instant\nConfirmation',
    subtitle:
      'Book in seconds, pay on collection or online. Get your collection code instantly.',
  },
];

export function OnboardingScreen() {
  const navigation = useNavigation<any>();
  const flatRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isLast = activeIndex === SLIDES.length - 1;

  const finish = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    await setItem(StorageKeys.HAS_SEEN_ONBOARDING, true);
    navigation.replace('Auth');
  }, [navigation]);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveIndex(prev => {
        const next = prev === SLIDES.length - 1 ? 0 : prev + 1;
        flatRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, SLIDE_DURATION);
  }, []);

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTimer]);

  const goTo = useCallback(
    (index: number) => {
      flatRef.current?.scrollToIndex({ index, animated: true });
      setActiveIndex(index);
      startTimer();
    },
    [startTimer],
  );

  const next = useCallback(() => {
    if (isLast) {
      finish();
      return;
    }
    goTo(activeIndex + 1);
  }, [isLast, activeIndex, finish, goTo]);

  const backgroundColor = scrollX.interpolate({
    inputRange: SLIDES.map((_, i) => i * W),
    outputRange: SLIDES.map(s => s.accent),
    extrapolate: 'clamp',
  });

  const currentAccent = SLIDES[activeIndex]?.accent ?? '#0A6A4B';

  return (
    <View style={s.root}>
      <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor }]} />
      <StatusBar barStyle="light-content" backgroundColor={currentAccent} />
      <SafeAreaView style={s.safe}>
        {/* Skip */}
        <TouchableOpacity style={s.skipBtn} onPress={finish} activeOpacity={0.7}>
          <Typo style={s.skipText}>Skip</Typo>
        </TouchableOpacity>

        {/* Slides */}
        <FlatList
          ref={flatRef}
          data={SLIDES}
          horizontal
          pagingEnabled
          scrollEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item.key}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false },
          )}
          scrollEventThrottle={16}
          onMomentumScrollEnd={e => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / W);
            setActiveIndex(idx);
            startTimer();
          }}
          renderItem={({ item, index }) => (
            <SlideView slide={item} isActive={index === activeIndex} />
          )}
          style={{ flex: 1 }}
        />

        {/* Bottom */}
        <View style={s.bottom}>
          <View style={s.dots}>
            {SLIDES.map((_, i) => (
              <ProgressDot
                key={i}
                active={i === activeIndex}
                duration={SLIDE_DURATION}
              />
            ))}
          </View>

          <TouchableOpacity style={s.cta} onPress={next} activeOpacity={0.85}>
            <Typo style={[s.ctaText, { color: currentAccent }]}>
              {isLast ? 'Get Started' : 'Next'}
            </Typo>
            <Icon
              name={isLast ? 'arrow-forward-circle' : 'arrow-forward'}
              size={20}
              color={currentAccent}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={finish}
            activeOpacity={0.7}
            style={s.signinRow}>
            <Typo style={s.signinText}>Already have an account? </Typo>
            <Typo style={s.signinLink}>Sign In</Typo>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

/* ─── Slide ─── */
function SlideView({
  slide,
  isActive,
}: {
  slide: Slide;
  isActive: boolean;
}) {
  const iconAnim = useRef(new Animated.Value(0)).current;
  const textAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isActive) {
      iconAnim.setValue(0);
      textAnim.setValue(0);
      Animated.parallel([
        Animated.spring(iconAnim, {
          toValue: 1,
          tension: 55,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(textAnim, {
          toValue: 1,
          duration: 480,
          delay: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isActive, iconAnim, textAnim]);

  const iconScale = iconAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1],
  });

  const textTranslateY = textAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [28, 0],
  });

  return (
    <View style={[s.slide, { width: W }]}>
      <View style={s.brandRow}>
        <Image
          source={require('@/assets/images/logo.png')}
          style={s.brandLogo}
          resizeMode="contain"
        />
        <Typo style={s.brandName}>SURERIDE</Typo>
      </View>

      <Animated.View
        style={[
          s.iconWrap,
          {
            opacity: iconAnim,
            transform: [{ scale: iconScale }],
          },
        ]}>
        <View style={s.iconInner}>
          <Icon name={slide.icon} size={96} color="#fff" />
        </View>
      </Animated.View>

      <Animated.View
        style={[
          s.textWrap,
          {
            opacity: textAnim,
            transform: [{ translateY: textTranslateY }],
          },
        ]}>
        <Typo style={s.title}>{slide.title}</Typo>
        <Typo style={s.subtitle}>{slide.subtitle}</Typo>
      </Animated.View>
    </View>
  );
}

/* ─── Progress Dot ─── */
function ProgressDot({
  active,
  duration,
}: {
  active: boolean;
  duration: number;
}) {
  const widthAnim = useRef(new Animated.Value(active ? 1 : 0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(widthAnim, {
      toValue: active ? 1 : 0,
      tension: 60,
      friction: 8,
      useNativeDriver: false,
    }).start();

    if (active) {
      progressAnim.setValue(0);
      Animated.timing(progressAnim, {
        toValue: 1,
        duration,
        useNativeDriver: false,
      }).start();
    } else {
      progressAnim.setValue(0);
    }
  }, [active, duration, widthAnim, progressAnim]);

  const dotWidth = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [6, 28],
  });

  const dotOpacity = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 1],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={[s.dot, { width: dotWidth, opacity: dotOpacity }]}>
      {active && (
        <Animated.View style={[s.dotProgress, { width: progressWidth }]} />
      )}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
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
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 40,
  },
  brandLogo: {
    width: 36,
    height: 36,
  },
  brandName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
  },
  iconWrap: {
    marginBottom: 48,
  },
  iconInner: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  textWrap: {
    alignItems: 'center',
    gap: 14,
  },
  title: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 42,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 20,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    alignItems: 'center',
  },
  dot: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  dotProgress: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 3,
  },
  cta: {
    backgroundColor: '#fff',
    borderRadius: 16,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
  },
  signinRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signinText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
  signinLink: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
