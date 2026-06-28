/**
 * Horizontal swipeable carousel for admin-configured promo banners.
 * Renders nothing while loading or when there's no active banner for the
 * given placement — callers don't need to gate the surrounding layout.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Linking,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Typo } from '@/components/AppText/Typo';
import {
  fetchPromoBanners,
  type BannerPlacement,
  type PromoBanner,
} from '@/services/banners.service';

// Known in-app routes that banner CTAs can deep-link to. Keeps Linking for
// external schemes (https, tel, mailto, whatsapp) but routes our own paths
// through React Navigation so they don't bounce out to the browser.
const IN_APP_ROUTES: Record<string, { stack: string; screen: string }> = {
  'request-limousine': {
    stack: 'CarRentalFlowNavigator',
    screen: 'RequestLimousine',
  },
};

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_HORIZONTAL_PADDING = 16;
const CARD_W = SCREEN_W - CARD_HORIZONTAL_PADDING * 2;
const CARD_H = Math.round(CARD_W * 0.42);
const AUTO_ROTATE_MS = 5000;

type Props = {
  placement: BannerPlacement;
  /** Padding above / below the carousel block. Defaults to 12/8. */
  topGap?: number;
  bottomGap?: number;
};

export function PromoBannerCarousel({ placement, topGap = 12, bottomGap = 8 }: Props) {
  const navigation = useNavigation<any>();
  const [banners, setBanners] = useState<PromoBanner[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList<PromoBanner>>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPromoBanners(placement).then(items => {
      if (!cancelled) setBanners(items);
    });
    return () => {
      cancelled = true;
    };
  }, [placement]);

  // Auto-rotate when there's more than one banner. Pause logic is cheap
  // because we only restart on activeIndex change.
  useEffect(() => {
    if (banners.length <= 1) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveIndex(prev => {
        const next = (prev + 1) % banners.length;
        listRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, AUTO_ROTATE_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [banners.length, activeIndex]);

  const handlePress = useCallback(
    (banner: PromoBanner) => {
      const url = banner.ctaUrl?.trim();
      if (!url) return;

      // Match in-app routes first — supports both `sureride://request-limousine`
      // and plain `/request-limousine` paths so admins don't have to remember
      // the scheme. Fall through to Linking for https/tel/mailto/whatsapp.
      const pathKey = url
        .replace(/^sureride:\/\//, '')
        .replace(/^\/+/, '')
        .split(/[?#]/)[0];
      const inApp = IN_APP_ROUTES[pathKey];
      if (inApp) {
        navigation.navigate(inApp.stack, { screen: inApp.screen });
        return;
      }

      Linking.openURL(url).catch(() => {});
    },
    [navigation],
  );

  if (banners.length === 0) return null;

  return (
    <View style={{ marginTop: topGap, marginBottom: bottomGap }}>
      <FlatList
        ref={listRef}
        data={banners}
        horizontal
        pagingEnabled
        snapToInterval={CARD_W + 12}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: CARD_HORIZONTAL_PADDING }}
        onMomentumScrollEnd={e => {
          const idx = Math.round(
            e.nativeEvent.contentOffset.x / (CARD_W + 12),
          );
          setActiveIndex(idx);
        }}
        renderItem={({ item }) => (
          <BannerCard banner={item} onPress={() => handlePress(item)} />
        )}
        ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
      />

      {banners.length > 1 ? (
        <View style={s.dots}>
          {banners.map((_, i) => (
            <Animated.View
              key={i}
              style={[
                s.dot,
                i === activeIndex ? s.dotActive : s.dotInactive,
              ]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function BannerCard({
  banner,
  onPress,
}: {
  banner: PromoBanner;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[s.card, { width: CARD_W, height: CARD_H }]}
    >
      <Image
        source={{ uri: banner.imageUrl }}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />
      {/* Subtle bottom-to-top gradient stand-in via a dim overlay so the
          title stays legible regardless of the underlying image. */}
      <View style={s.scrim} />
      <View style={s.copy}>
        {banner.title ? (
          <Typo style={s.title} numberOfLines={2}>
            {banner.title}
          </Typo>
        ) : null}
        {banner.ctaLabel ? (
          <View style={s.ctaPill}>
            <Typo style={s.ctaLabel}>{banner.ctaLabel}</Typo>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0A6A4B',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  copy: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 14,
    gap: 8,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  ctaPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  ctaLabel: {
    color: '#0A6A4B',
    fontSize: 12,
    fontWeight: '700',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 18,
    backgroundColor: '#0A6A4B',
  },
  dotInactive: {
    width: 6,
    backgroundColor: 'rgba(10,106,75,0.25)',
  },
});
