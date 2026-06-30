import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenWrapper } from '@/components/Screenwrapper/Screenwrapper';
import { Typo } from '@/components/AppText/Typo';
import { AppSelectSheet } from '@/components/AppSelectSheet/AppSelectSheet';
import { useAuth } from '@/providers/AuthProvider';
import { useBrowseCountry } from '@/providers/CountryProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { listRentalCars } from '@/services/rental.service';
import { useCurrency, useFormatMoney } from '@/providers/CurrencyProvider';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { SUPPORTED_CURRENCIES, symbolFor } from '@/helpers/currency';
import { ImageSize, optimizeImageUrl } from '@/helpers/image';
import { flagForCountry } from '@/helpers/region';
import type { RentalCar } from '@/types/rental';
import { PromoBannerCarousel } from '@/components/PromoBannerCarousel/PromoBannerCarousel';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_BG = require('@/assets/images/car_back.png');

const GREEN = '#0A6A4B';
const GREEN_DARK = '#064030';

const CATEGORIES = ['All', 'Economy', 'Luxury', 'SUV', 'Van', 'Electric'];
const CATEGORY_MAP: Record<string, string> = {
  Economy: 'ECONOMY',
  Luxury: 'LUXURY',
  SUV: 'SUV',
  Van: 'VAN',
  Electric: 'ELECTRIC',
};

const CarRentalHomeScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors, mode } = useTheme();
  const { count: unreadCount } = useUnreadNotifications();
  const { currency: displayCurrency, setCurrency: setDisplayCurrency } = useCurrency();
  const {
    country: browseCountry,
    setCountry: setBrowseCountry,
    markets,
    refreshMarkets,
  } = useBrowseCountry();

  const [cars, setCars] = useState<RentalCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [currencyPickerOpen, setCurrencyPickerOpen] = useState(false);
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);

  const currencySymbol = symbolFor(displayCurrency);
  const browseCountryFlag = flagForCountry(browseCountry);

  const firstName = user?.firstName?.trim() || 'there';
  const avatarText =
    `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || 'SU';

  const openSearchLocation = () =>
    navigation.navigate('CarRentalFlowNavigator', { screen: 'SearchLocation' });

  const navigateToCar = (car: RentalCar) =>
    navigation.navigate('CarRentalFlowNavigator', {
      screen: 'VehicleDetails',
      params: { vehicleId: car.id, car },
    });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await listRentalCars();
        setCars(data);
      } catch (e) {
        console.warn('Failed to load cars', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredCars = useMemo(
    () =>
      activeCategory === 'All'
        ? cars
        : cars.filter(
            car => car.category?.toUpperCase() === CATEGORY_MAP[activeCategory],
          ),
    [activeCategory, cars],
  );

  const featuredCars = useMemo(() => filteredCars.slice(0, 8), [filteredCars]);

  const newestCars = useMemo(() => {
    const sorted = [...filteredCars].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
    return sorted.slice(0, 8);
  }, [filteredCars]);

  return (
    <ScreenWrapper padded={false}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* ──────────────── HERO ──────────────── */}
        <View style={s.heroWrap}>
          <ImageBackground
            source={HERO_BG}
            style={[s.heroBg, { paddingTop: insets.top + 12 }]}
            imageStyle={s.heroImage}
            resizeMode="cover"
          >
            <LinearGradient
              colors={[`${GREEN}E6`, `${GREEN}F2`, `${GREEN_DARK}F2`]}
              style={StyleSheet.absoluteFill}
            />

            {/* Top bar */}
            <View style={s.topBar}>
              <TouchableOpacity
                style={s.bellWrap}
                onPress={() => navigation.navigate('NotificationInbox')}
                activeOpacity={0.7}
              >
                <Ionicons name="notifications-outline" size={24} color="#fff" />
                {unreadCount > 0 ? (
                  <View style={s.bellBadge}>
                    <Typo style={s.bellBadgeText}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Typo>
                  </View>
                ) : null}
              </TouchableOpacity>

              <View style={s.topRightGroup}>
                <TouchableOpacity
                  style={s.topChip}
                  onPress={() => {
                    // Refresh in the background so admin updates land in the
                    // sheet by the time it's interactable.
                    void refreshMarkets();
                    setCountryPickerOpen(true);
                  }}
                  activeOpacity={0.8}
                  accessibilityLabel={`Browse region, currently ${browseCountry}`}
                >
                  {browseCountryFlag ? (
                    <Typo style={s.countryFlag}>{browseCountryFlag}</Typo>
                  ) : (
                    <Typo style={s.topChipFallback}>{browseCountry}</Typo>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.topChip}
                  onPress={() => setCurrencyPickerOpen(true)}
                  activeOpacity={0.8}
                  accessibilityLabel={`Change display currency, currently ${displayCurrency}`}
                >
                  <Typo style={s.currencySymbol}>
                    {currencySymbol || displayCurrency}
                  </Typo>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.avatar}
                  onPress={() =>
                    navigation.navigate('CarRentalTabs', { screen: 'Settings' })
                  }
                  activeOpacity={0.8}
                >
                  <Typo style={s.avatarText}>{avatarText}</Typo>
                </TouchableOpacity>
              </View>
            </View>

            {/* Greeting */}
            <View style={s.greetingBlock}>
              <Typo style={s.greeting}>Hello, {firstName} 👋</Typo>
              <Typo style={s.tagline}>Where are you headed today?</Typo>
            </View>

            {/* Spacer pushes the chips to the bottom of the hero */}
            <View style={{ flex: 1 }} />

            {/* Category chips — sit just above the floating search widget */}
            <View style={s.chipsRow}>
              <FlatList
                data={CATEGORIES}
                horizontal
                keyExtractor={item => item}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.chipsContent}
                renderItem={({ item }) => {
                  const active = activeCategory === item;
                  return (
                    <TouchableOpacity
                      onPress={() => setActiveCategory(item)}
                      activeOpacity={0.8}
                      style={[
                        s.chip,
                        active && s.chipActive,
                      ]}
                    >
                      <Typo
                        style={[
                          s.chipText,
                          active && s.chipTextActive,
                        ]}
                      >
                        {item}
                      </Typo>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>

            {/* Wavy bottom edge — overlapping circles in page-bg colour cut a scalloped
                curve into the hero. Pure Views so no SVG dep / rebuild required. */}
            <View style={s.waveRow} pointerEvents="none">
              {Array.from({ length: 6 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    s.waveBump,
                    { backgroundColor: colors.background },
                  ]}
                />
              ))}
            </View>
          </ImageBackground>

          {/* Search widget — overlaps the bottom edge of the hero */}
          <View style={s.searchWidgetWrap}>
            <View
              style={[
                s.searchWidget,
                {
                  backgroundColor: colors.surface,
                  shadowColor: mode === 'dark' ? '#000' : '#000',
                },
              ]}
            >
              <TouchableOpacity
                style={s.searchField}
                onPress={openSearchLocation}
                activeOpacity={0.7}
              >
                <Ionicons name="location-outline" size={18} color={GREEN} />
                <Typo style={[s.searchFieldLabel, { color: colors.textSecondary }]}>
                  Pickup
                </Typo>
              </TouchableOpacity>

              <View
                style={[s.searchDivider, { backgroundColor: colors.border }]}
              />

              <TouchableOpacity
                style={s.searchField}
                onPress={openSearchLocation}
                activeOpacity={0.7}
              >
                <Ionicons name="calendar-outline" size={18} color={GREEN} />
                <Typo style={[s.searchFieldLabel, { color: colors.textSecondary }]}>
                  Dates
                </Typo>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.searchButton}
                onPress={openSearchLocation}
                activeOpacity={0.85}
              >
                <Ionicons name="search" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ──────────────── CONTENT ──────────────── */}
        {loading ? (
          <ActivityIndicator
            size="large"
            color={GREEN}
            style={{ marginVertical: 60 }}
          />
        ) : filteredCars.length === 0 ? (
          <View style={s.emptyWrap}>
            <Ionicons name="car-outline" size={56} color={colors.border} />
            <Typo style={[s.emptyTitle, { color: colors.textPrimary }]}>
              No vehicles available
            </Typo>
            <Typo style={[s.emptyHint, { color: colors.textSecondary }]}>
              Try a different category or check back later
            </Typo>
          </View>
        ) : (
          <>
            {/* Admin-managed promo banners (HOME_HERO) — renders nothing if
                there are no active banners, so no layout shift when empty. */}
            <PromoBannerCarousel placement="HOME_HERO" topGap={16} bottomGap={4} />

            <SectionHeader
              title="Featured"
              onSeeAll={openSearchLocation}
              colors={colors}
            />
            <FlatList
              data={featuredCars}
              horizontal
              keyExtractor={item => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}
              snapToInterval={SCREEN_WIDTH * 0.78 + 14}
              decelerationRate="fast"
              renderItem={({ item: car }) => (
                <FeaturedCard
                  car={car}
                  onPress={() => navigateToCar(car)}
                  colors={colors}
                />
              )}
            />

            {newestCars.length > 0 && (
              <>
                <SectionHeader
                  title="Newest arrivals"
                  onSeeAll={openSearchLocation}
                  colors={colors}
                  topSpacing={28}
                />
                <FlatList
                  data={newestCars}
                  horizontal
                  keyExtractor={item => item.id}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}
                  snapToInterval={SCREEN_WIDTH * 0.78 + 14}
                  decelerationRate="fast"
                  renderItem={({ item: car }) => (
                    <FeaturedCard
                      car={car}
                      onPress={() => navigateToCar(car)}
                      colors={colors}
                    />
                  )}
                />
              </>
            )}

            {/* Browse-all CTA — replaces the old "All Vehicles" catalog */}
            <TouchableOpacity
              style={[s.browseAllCta, { borderColor: colors.border }]}
              activeOpacity={0.85}
              onPress={openSearchLocation}
            >
              <View style={s.browseAllIcon}>
                <Ionicons name="search" size={18} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Typo style={[s.browseAllTitle, { color: colors.textPrimary }]}>
                  Looking for something specific?
                </Typo>
                <Typo style={[s.browseAllHint, { color: colors.textSecondary }]}>
                  Search by location and dates to see every available car
                </Typo>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <AppSelectSheet
        visible={currencyPickerOpen}
        title="Display Currency"
        searchPlaceholder="Search currency"
        options={SUPPORTED_CURRENCIES.map(c => {
          const sym = symbolFor(c.code);
          return {
            label: `${sym ? `${sym}  ` : ''}${c.code} — ${c.name}`,
            value: c.code,
          };
        })}
        selected={displayCurrency}
        onClose={() => setCurrencyPickerOpen(false)}
        onSelect={opt => {
          setDisplayCurrency(String(opt.value));
          setCurrencyPickerOpen(false);
        }}
      />

      <AppSelectSheet
        visible={countryPickerOpen}
        title="Browse cars in"
        searchPlaceholder="Search country"
        options={markets.map(c => {
          const flag = flagForCountry(c.code);
          return {
            label: `${flag ? `${flag}  ` : ''}${c.name}`,
            value: c.code,
          };
        })}
        selected={browseCountry}
        onClose={() => setCountryPickerOpen(false)}
        onSelect={opt => {
          const code = String(opt.value);
          setBrowseCountry(code);
          // Pair the display currency to the country the user just picked.
          // Reasonable default — they can still override via the currency chip.
          const target = markets.find(m => m.code === code);
          if (target) setDisplayCurrency(target.currency);
          setCountryPickerOpen(false);
        }}
      />
    </ScreenWrapper>
  );
};

export default CarRentalHomeScreen;

/* ────────────────────────────────────────────────────
   SECTION HEADER
──────────────────────────────────────────────────── */

type ColorSet = {
  surface: string;
  background: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  primary: string;
};

function SectionHeader({
  title,
  onSeeAll,
  colors,
  topSpacing = 8,
}: {
  title: string;
  onSeeAll?: () => void;
  colors: ColorSet;
  topSpacing?: number;
}) {
  return (
    <View style={[s.sectionHeader, { marginTop: topSpacing }]}>
      <Typo style={[s.sectionTitle, { color: colors.textPrimary }]}>
        {title}
      </Typo>
      {onSeeAll ? (
        <TouchableOpacity activeOpacity={0.7} onPress={onSeeAll}>
          <Typo style={s.sectionLink}>See all</Typo>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

/* ────────────────────────────────────────────────────
   FEATURED CARD
──────────────────────────────────────────────────── */

function FeaturedCard({
  car,
  onPress,
  colors,
}: {
  car: RentalCar;
  onPress: () => void;
  colors: ColorSet;
}) {
  const cardWidth = SCREEN_WIDTH * 0.78;
  const fmtMoney = useFormatMoney();

  const title =
    car.brand && car.model ? `${car.brand} ${car.model}` : 'Vehicle';
  const location = car.location?.name ?? 'Nigeria';
  const dailyRate = fmtMoney(car.dailyRate, car.currency ?? 'NGN', { round: true });

  const rawImageUrl =
    car.images?.find(img => img.isPrimary)?.url ?? car.images?.[0]?.url;
  const imageUrl = optimizeImageUrl(rawImageUrl, { width: ImageSize.CARD });
  const imageSource = imageUrl
    ? { uri: imageUrl }
    : require('@/assets/images/car.png');

  const formatLabel = (value?: string) => {
    if (!value) return '';
    return value
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/(^\w|\s\w)/g, m => m.toUpperCase());
  };

  const categoryLabel = car.category ? formatLabel(car.category) : '';
  const showVerified = car.provider?.isVerified === true;
  const transmission = car.transmission ? formatLabel(car.transmission) : null;
  const seats = typeof car.seats === 'number' ? car.seats : null;
  const reviewCount = typeof car.reviewCount === 'number' ? car.reviewCount : 0;
  // Only show the rating when the car actually has reviews — "0.0" with a star
  // icon reads as "this car got a 0" rather than "no ratings yet".
  const rating =
    reviewCount > 0 && typeof car.rating === 'number' ? car.rating : null;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[
        s.card,
        {
          width: cardWidth,
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={{ position: 'relative' }}>
        <Image
          source={imageSource}
          style={s.cardImage}
          resizeMode="cover"
        />
        {categoryLabel ? (
          <View style={s.categoryPill}>
            <Typo style={s.categoryPillText}>{categoryLabel}</Typo>
          </View>
        ) : null}
        {showVerified && (
          <View style={s.verifiedPill}>
            <Ionicons name="checkmark-circle" size={12} color="#fff" />
            <Typo style={s.verifiedPillText}>Verified</Typo>
          </View>
        )}
      </View>

      <View style={{ padding: 14, gap: 8 }}>
        <Typo
          style={[s.cardTitle, { color: colors.textPrimary }]}
          numberOfLines={1}
        >
          {title}
        </Typo>

        <View style={s.cardMetaRow}>
          <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
          <Typo
            style={[s.cardMetaText, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {location}
          </Typo>
          {rating !== null && (
            <>
              <View style={s.cardMetaDot} />
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Typo style={[s.cardMetaText, { color: colors.textPrimary, fontWeight: '600' }]}>
                {rating.toFixed(1)}
              </Typo>
              {reviewCount > 0 && (
                <Typo style={[s.cardMetaText, { color: colors.textSecondary }]}>
                  ({reviewCount})
                </Typo>
              )}
            </>
          )}
        </View>

        <View style={s.cardFooter}>
          <View style={{ flexDirection: 'row', gap: 6, flex: 1 }}>
            {transmission && (
              <View style={[s.specChip, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Ionicons name="settings-outline" size={10} color={colors.textSecondary} />
                <Typo style={[s.specChipText, { color: colors.textSecondary }]}>
                  {transmission}
                </Typo>
              </View>
            )}
            {seats !== null && (
              <View style={[s.specChip, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Ionicons name="people-outline" size={10} color={colors.textSecondary} />
                <Typo style={[s.specChipText, { color: colors.textSecondary }]}>
                  {seats}
                </Typo>
              </View>
            )}
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <Typo style={s.cardPrice}>{dailyRate}</Typo>
            <Typo style={[s.cardPriceUnit, { color: colors.textSecondary }]}>
              per day
            </Typo>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

/* ────────────────────────────────────────────────────
   STYLES
──────────────────────────────────────────────────── */

const s = StyleSheet.create({
  heroWrap: {
    marginBottom: 44, // room for floating search widget to overlap
  },
  heroBg: {
    paddingHorizontal: 20,
    paddingBottom: 64, // reserves space for the wave + chips above the floating search
    minHeight: 380,
    flexDirection: 'column',
    overflow: 'hidden',
  },
  heroImage: {
    // The image fills the hero box; the gradient on top handles colour.
  },
  // The bumps are wider than they are tall so each one's curved top reads as a
  // gentle wave. They sit half off the bottom of the hero so only the upper
  // half is visible — that's what creates the scalloped silhouette.
  waveRow: {
    position: 'absolute',
    left: -10,
    right: -10,
    bottom: -28,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  waveBump: {
    flex: 1,
    height: 56,
    marginHorizontal: -6,
    borderRadius: 999,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bellWrap: {
    position: 'relative',
    padding: 4,
  },
  bellBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: GREEN,
  },
  bellBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 11,
  },
  topRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  topChip: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  countryFlag: {
    fontSize: 19,
    // Flag emojis have inconsistent baselines on Android — small lineHeight
    // bump keeps them visually centred inside the circle.
    lineHeight: 22,
  },
  currencySymbol: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  topChipFallback: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  greetingBlock: {
    marginTop: 26,
  },
  greeting: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  tagline: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },

  chipsRow: {
    marginHorizontal: -20, // cancel hero's paddingHorizontal so chips scroll edge-to-edge
  },
  chipsContent: {
    paddingHorizontal: 20,
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  chipActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  chipTextActive: {
    color: GREEN_DARK,
    fontWeight: '700',
  },

  searchWidgetWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: -28,
  },
  searchWidget: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  searchField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  searchFieldLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  searchDivider: {
    width: 1,
    height: 24,
  },
  searchButton: {
    backgroundColor: GREEN,
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionLink: {
    fontSize: 13,
    color: GREEN,
    fontWeight: '600',
  },

  card: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
  },
  cardImage: {
    width: '100%',
    height: 150,
  },
  categoryPill: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryPillText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  verifiedPill: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#16A34A',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedPillText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  cardMetaText: {
    fontSize: 12,
  },
  cardMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 4,
    gap: 8,
  },
  specChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  specChipText: {
    fontSize: 10,
    fontWeight: '500',
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: GREEN,
  },
  cardPriceUnit: {
    fontSize: 10,
    marginTop: 1,
  },

  browseAllCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 28,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  browseAllIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  browseAllTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  browseAllHint: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },

  emptyWrap: {
    alignItems: 'center',
    marginTop: 80,
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  emptyHint: {
    fontSize: 13,
    textAlign: 'center',
  },
});
