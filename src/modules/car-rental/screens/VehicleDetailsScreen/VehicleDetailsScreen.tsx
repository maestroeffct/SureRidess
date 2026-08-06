import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StyleSheet,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@react-native-vector-icons/ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';

import { Typo } from '@/components/AppText/Typo';
import { AppButton } from '@/components/AppButton/CustomButton';
import { CheckItem } from '@/components/CheckItem/CheckItem';
import { InfoText } from '@/components/InfoText/InfoText';
import { InsuranceCard } from '@/components/Rental/InsuranceCard/InsuranceCard';
import { TimelineLocation } from '@/components/Timeline/TimelineLocation';
import { formatDate, formatTime } from '@/helpers/dateTime';
import type {
  RentalCar,
  RentalCarFeature,
  RentalCarFeatureLink,
  RentalInsurancePackage,
} from '@/types/rental';
import { getCarWithFeatures, listCarProtectionPlans } from '@/services/rental.service';
import { previewBookingPrice, PricingPreview } from '@/services/pricing.service';
import { PriceBreakdown } from '@/components/Rental/PriceBreakdown/PriceBreakdown';
import { useCurrency, useFormatMoney } from '@/providers/CurrencyProvider';
import { FavoriteButton } from '@/components/FavoriteButton/FavoriteButton';
import { ReviewsSection } from '@/components/Rental/ReviewsSection/ReviewsSection';
import { useTheme } from '@/theme/ThemeProvider';
import { ImageSize, optimizeImageUrl } from '@/helpers/image';

const GREEN = '#0A6A4B';
const SW = Dimensions.get('window').width;
const HERO_H = 300;

const VehicleDetailsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { currency: userCurrency } = useCurrency();
  const fmtMoney = useFormatMoney();
  const { mode, colors } = useTheme();

  const routeCar: RentalCar | undefined = route?.params?.car;
  const vehicleId: string | undefined = route?.params?.vehicleId;
  const search = route?.params?.search;
  const pickupLocationId = route?.params?.pickupLocationId;
  const dropoffLocationId = route?.params?.dropoffLocationId;
  const pickupLocationName = route?.params?.pickupLocationName;
  const dropoffLocationName = route?.params?.dropoffLocationName;

  const [insurance, setInsurance] = useState('none');
  const [car, setCar] = useState<RentalCar | undefined>(routeCar);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [pricing, setPricing] = useState<PricingPreview | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [protectionPlans, setProtectionPlans] = useState<RentalInsurancePackage[] | null>(null);

  useEffect(() => {
    if (routeCar) setCar(routeCar);
  }, [routeCar]);

  useEffect(() => {
    const loadDetails = async () => {
      if (!vehicleId) return;
      const hasFeatures = !!(car?.features || car?.groupedFeatures);
      const hasMultipleImages = (car?.images?.length ?? 0) > 1;
      if (hasFeatures && hasMultipleImages) return;
      try {
        const detail = await getCarWithFeatures(vehicleId);
        setCar(prev => ({
          ...(prev ?? detail),
          ...detail,
          location: detail.location ?? prev?.location,
          provider: detail.provider ?? prev?.provider,
          images: detail.images?.length ? detail.images : prev?.images ?? [],
        }));
      } catch (error) {
        console.warn('[VehicleDetails] Failed to load car details', error);
      }
    };
    loadDetails();
  }, [vehicleId, car?.features, car?.groupedFeatures, car?.images?.length]);

  // Fetch admin-APPROVED protection plans for this car. Preferred over
  // the plans embedded on the car detail response because it filters out
  // PENDING/REJECTED rows and includes provider-wide plans.
  useEffect(() => {
    const carId = vehicleId || car?.id;
    if (!carId) return;
    let cancelled = false;
    listCarProtectionPlans(carId)
      .then(items => { if (!cancelled) setProtectionPlans(items); })
      .catch(() => { if (!cancelled) setProtectionPlans(null); });
    return () => { cancelled = true; };
  }, [vehicleId, car?.id]);

  // Fetch accurate pricing from the backend whenever dates or insurance changes
  useEffect(() => {
    if (!search?.pickupAt || !search?.returnAt || !car?.id) return;
    const fetchPricing = async () => {
      setPricingLoading(true);
      try {
        const result = await previewBookingPrice({
          carId: car.id,
          pickupAt: search.pickupAt,
          returnAt: search.returnAt,
          insuranceId: insurance === 'none' ? undefined : insurance,
          displayCurrency: userCurrency,
        });
        setPricing(result);
      } catch {
        setPricing(null);
      } finally {
        setPricingLoading(false);
      }
    };
    fetchPricing();
  }, [car?.id, search?.pickupAt, search?.returnAt, insurance, userCurrency]);

  const fmt = (value?: string) =>
    value
      ? value.replace(/_/g, ' ').toLowerCase().replace(/(^\w|\s\w)/g, m => m.toUpperCase())
      : '';

  const images = (car?.images ?? []) as Array<
    { url?: string; imageUrl?: string; path?: string; isPrimary?: boolean } | string
  >;
  const imageUrls = images
    .map(img => (typeof img === 'string' ? img : img.url ?? img.imageUrl ?? img.path))
    .filter((url): url is string => !!url)
    .map(url => optimizeImageUrl(url, { width: ImageSize.HERO }) ?? url);
  const FALLBACK = 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=600';
  const displayImages = imageUrls.length > 0 ? imageUrls : [FALLBACK];

  const title = car?.brand && car?.model ? `${car.brand} ${car.model}` : 'Vehicle Details';
  const locationName = car?.location?.name ?? pickupLocationName ?? '';
  const locationAddress = car?.location?.address ?? '';

  const normalizeFeatures = (items?: Array<RentalCarFeature | RentalCarFeatureLink>): RentalCarFeature[] => {
    if (!items) return [];
    return items.map(item => ('feature' in item ? item.feature : item)).filter(Boolean) as RentalCarFeature[];
  };

  const allFeatures: RentalCarFeature[] = useMemo(() => {
    if (car?.features?.length) return normalizeFeatures(car.features);
    if (car?.groupedFeatures) return Object.values(car.groupedFeatures).flat();
    return [];
  }, [car?.features, car?.groupedFeatures]);

  const comfortFeatures = car?.groupedFeatures?.COMFORT ?? allFeatures.filter(f => f.category === 'COMFORT');
  const safetyFeatures = car?.groupedFeatures?.SAFETY ?? allFeatures.filter(f => f.category === 'SAFETY');

  const pickupAt = search?.pickupAt ? new Date(search.pickupAt) : null;
  const returnAt = search?.returnAt ? new Date(search.returnAt) : null;
  const totalDays = pricing?.rentalDays ?? (pickupAt && returnAt
    ? Math.max(1, Math.ceil((returnAt.getTime() - pickupAt.getTime()) / 86400000))
    : 1);
  // Use API pricing when available, fall back to local estimate
  const totalPrice = pricing?.totalPrice ?? (car?.dailyRate && totalDays ? car.dailyRate * totalDays : undefined);
  const depositAmount = pricing?.depositAmount;
  const taxAmount = pricing?.taxAmount ?? 0;

  const hasBookingData = !!search?.pickupAt && !!search?.returnAt && !!(pickupLocationId || car?.location?.id);

  // Protection plans from the dedicated APPROVED-only endpoint win; fall
  // back to the plans embedded on the car detail response when that
  // request hasn't landed (or errored on older backends).
  const insurancePackages: RentalInsurancePackage[] =
    (protectionPlans && protectionPlans.length > 0
      ? protectionPlans
      : car?.insurancePackages) ?? [];
  // Source currency: what the backend says these prices are in
  const sourceCurrency = pricing?.currency ?? car?.currency ?? 'NGN';
  const fmtPrice = (amount?: number) =>
    typeof amount !== 'number' ? 'Free' : fmtMoney(amount, sourceCurrency, { round: true });
  const fmtInsurance = (pkg: RentalInsurancePackage) => {
    const pkgCurrency = pkg.currency ?? sourceCurrency;
    if (typeof pkg.dailyPrice === 'number') return `${fmtMoney(pkg.dailyPrice, pkgCurrency, { round: true })} / Day`;
    if (typeof pkg.dailyRate === 'number') return `${fmtMoney(pkg.dailyRate, pkgCurrency, { round: true })} / Day`;
    if (typeof pkg.price === 'number') return fmtMoney(pkg.price, pkgCurrency, { round: true });
    if (typeof pkg.amount === 'number') return fmtMoney(pkg.amount, pkgCurrency, { round: true });
    return 'Free';
  };

  const handleProceedToPayment = () => {
    if (!hasBookingData) {
      navigation.navigate('CarRentalFlowNavigator', {
        screen: 'SearchLocation',
        params: {
          lockedCarId: vehicleId || car?.id,
          lockedCar: car,
          insuranceId: insurance === 'none' ? undefined : insurance,
          paymentMethod: 'ONLINE',
        },
      });
      return;
    }
    navigation.navigate('PaymentScreen', {
      vehicleId: vehicleId || car?.id,
      car,
      search,
      pickupLocationId: pickupLocationId || car?.location?.id,
      dropoffLocationId: dropoffLocationId || pickupLocationId || car?.location?.id,
      pickupLocationName,
      dropoffLocationName,
      insuranceId: insurance === 'none' ? undefined : insurance,
      paymentMethod: 'ONLINE',
    });
  };

  // Quick-stat chips
  const stats = [
    car?.transmission && { icon: 'settings-outline', label: fmt(car.transmission) },
    typeof car?.seats === 'number' && { icon: 'people-outline', label: `${car.seats} Seats` },
    typeof car?.hasAC === 'boolean' && { icon: 'snow-outline', label: car.hasAC ? 'A/C' : 'No A/C' },
    car?.mileagePolicy && { icon: 'speedometer-outline', label: `${fmt(car.mileagePolicy)} Mileage` },
    car?.category && { icon: 'car-outline', label: fmt(car.category) },
  ].filter(Boolean) as { icon: string; label: string }[];

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* ── IMAGE HERO ── */}
        <View style={s.hero}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={StyleSheet.absoluteFill}
            onMomentumScrollEnd={e =>
              setActiveImageIndex(Math.round(e.nativeEvent.contentOffset.x / SW))
            }
          >
            {displayImages.map((uri, idx) => (
              <Image
                key={`${uri}-${idx}`}
                source={{ uri }}
                style={{ width: SW, height: HERO_H }}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          {/* Gradients are decoration only — let swipe gestures pass through */}
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(0,0,0,0.55)', 'transparent']}
            style={[s.gradTop, { height: insets.top + 60 }]}
          />
          <LinearGradient
            pointerEvents="none"
            colors={['transparent', 'rgba(0,0,0,0.75)']}
            style={s.gradBottom}
          />

          {/* Back button */}
          <TouchableOpacity
            style={[s.backBtn, { top: insets.top + 10 }]}
            onPress={() => navigation.goBack()}
          >
            <Icon name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>

          {/* Favorite */}
          {car?.id ? (
            <View style={[s.favoriteWrap, { top: insets.top + 10 }]}>
              <FavoriteButton carId={car.id} variant="inline" size={20} />
            </View>
          ) : null}

          {/* Image counter */}
          {displayImages.length > 1 && (
            <View style={s.imgCounter}>
              <Typo style={s.imgCounterText}>
                {activeImageIndex + 1}/{displayImages.length}
              </Typo>
            </View>
          )}

          {/* Car name + location overlay — non-interactive so the underlying
              carousel still receives swipe gestures across the bottom of the hero */}
          <View pointerEvents="none" style={s.heroInfo}>
            {car?.category && (
              <View style={s.categoryBadge}>
                <Typo style={s.categoryBadgeText}>{fmt(car.category)}</Typo>
              </View>
            )}
            <Typo style={s.heroTitle}>{title}</Typo>
            {locationName ? (
              <View style={s.heroLocRow}>
                <Icon name="location" size={12} color="rgba(255,255,255,0.8)" />
                <Typo style={s.heroLoc}>{locationName}</Typo>
              </View>
            ) : null}
          </View>
        </View>

        {/* ── BODY ── */}
        <View style={[s.body, { backgroundColor: colors.background }]}>
          {/* Price + stats row */}
          <View style={s.priceRow}>
            <View style={s.priceInline}>
              <Typo style={s.priceAmount}>
                {car?.dailyRate ? fmtPrice(car.dailyRate) : '—'}
              </Typo>
              <Typo style={[s.priceLabel, { color: colors.textSecondary }]}>
                {' '}/ day
              </Typo>
            </View>
            {totalDays > 1 && totalPrice ? (
              <View
                style={[
                  s.totalBadge,
                  {
                    backgroundColor: mode === 'dark' ? '#0F3027' : '#F0FDF4',
                    borderColor: mode === 'dark' ? '#1F5B49' : '#A7F3D0',
                  },
                ]}
              >
                <Typo style={[s.totalBadgeLabel, { color: colors.textSecondary }]}>
                  {totalDays} day{totalDays !== 1 ? 's' : ''} total
                </Typo>
                <Typo style={s.totalBadgeAmount}>{fmtPrice(totalPrice)}</Typo>
              </View>
            ) : null}
          </View>

          {/* Quick stats */}
          {stats.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.statsScroll}>
              {stats.map(st => (
                <View
                  key={st.label}
                  style={[
                    s.statChip,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Icon name={st.icon as any} size={14} color={colors.textSecondary} />
                  <Typo style={[s.statLabel, { color: colors.textPrimary }]}>
                    {st.label}
                  </Typo>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Provider */}
          <View
            style={[
              s.providerCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={s.providerAvatarWrap}>
              <Typo style={s.providerInitials}>
                {car?.provider?.name?.slice(0, 2).toUpperCase() || 'PR'}
              </Typo>
            </View>
            <View style={s.providerInfo}>
              <Typo style={[s.providerName, { color: colors.textPrimary }]}>
                {car?.provider?.name || 'Provider'}
              </Typo>
              <Typo style={[s.providerSub, { color: colors.textSecondary }]}>
                {car?.provider?.isVerified ? 'Verified Provider' : 'Rental Service'}
              </Typo>
            </View>
            {car?.provider?.isVerified && (
              <View
                style={[
                  s.verifiedBadge,
                  { backgroundColor: mode === 'dark' ? '#0F3027' : '#F0FDF4' },
                ]}
              >
                <Icon name="checkmark-circle" size={18} color={mode === 'dark' ? '#34D399' : GREEN} />
                <Typo style={[s.verifiedText, { color: mode === 'dark' ? '#34D399' : GREEN }]}>
                  Verified
                </Typo>
              </View>
            )}
          </View>

          {/* Includes */}
          <SectionCard title="This Booking Includes">
            {(comfortFeatures?.length ? comfortFeatures : allFeatures).slice(0, 4).map(f => (
              <CheckItem key={f.id} label={f.name} />
            ))}
            {allFeatures.length === 0 && (
              <>
                <CheckItem label="Vehicle Protection" />
                <CheckItem label="Theft Protection" />
                <CheckItem label="Third-Party Protection" />
              </>
            )}
          </SectionCard>

          <InfoText label="Useful information for your booking" />

          {/* Safety */}
          <SectionCard title="Safety & Security">
            {(safetyFeatures?.length ? safetyFeatures : allFeatures).slice(0, 4).map(f => (
              <CheckItem key={f.id} label={f.name} />
            ))}
            {allFeatures.length === 0 && (
              <>
                <CheckItem label="ABS Braking System" />
                <CheckItem label="Airbags (Front & Side)" />
                <CheckItem label="GPS Tracking" />
              </>
            )}
          </SectionCard>

          {/* Reviews */}
          {car?.id ? (
            <SectionCard title="Reviews">
              <ReviewsSection
                carId={car.id}
                initialAverage={car.rating}
                initialCount={car.reviewCount}
              />
            </SectionCard>
          ) : null}

          {/* Protection Plans */}
          <SectionCard title="Protection Plans">
            <InsuranceCard
              title="No Protection"
              price="Free"
              selected={insurance === 'none'}
              onPress={() => setInsurance('none')}
              description="Skip protection — you'll be liable for the full excess in the event of a claim"
            />
            {insurancePackages.length > 0
              ? insurancePackages.map(pkg => (
                  <InsuranceCard
                    key={pkg.id}
                    title={pkg.name}
                    price={fmtInsurance(pkg)}
                    selected={insurance === pkg.id}
                    onPress={() => setInsurance(pkg.id)}
                    description={pkg.description || 'Protection plan provided by the host'}
                    tier={pkg.tier}
                    deductibleLabel={
                      typeof pkg.deductibleAmount === 'number' && pkg.deductibleAmount > 0
                        ? fmtMoney(pkg.deductibleAmount, pkg.currency ?? sourceCurrency, { round: true })
                        : undefined
                    }
                    highlights={pkg.productHighlights ?? undefined}
                  />
                ))
              : <InfoText label="No protection plans available for this car." />}
          </SectionCard>

          {/* Pick-up & Drop-off */}
          {hasBookingData ? (
            <SectionCard title="Pick-up & Drop-off">
              <TimelineLocation
                label="Pick-up"
                icon="location"
                color={GREEN}
                date={pickupAt ? `${formatDate(pickupAt)} at ${formatTime(pickupAt)}` : ''}
                place={pickupLocationName || locationName}
                address={locationAddress || 'Pickup location'}
              />
              <TimelineLocation
                label="Drop-off"
                icon="location"
                color="#F59E0B"
                date={returnAt ? `${formatDate(returnAt)} at ${formatTime(returnAt)}` : ''}
                place={dropoffLocationName || locationName}
                address={locationAddress || 'Drop-off location'}
                isLast
              />
            </SectionCard>
          ) : (
            <View
              style={[
                s.noDatesCard,
                {
                  backgroundColor: mode === 'dark' ? '#2A1F05' : '#FFFBEB',
                  borderColor: mode === 'dark' ? '#78350F' : '#FCD34D',
                },
              ]}
            >
              <Icon
                name="warning-outline"
                size={24}
                color={mode === 'dark' ? '#FBBF24' : '#D97706'}
              />
              <View style={{ flex: 1 }}>
                <Typo
                  style={[
                    s.noDatesTitle,
                    { color: mode === 'dark' ? '#FBBF24' : '#D97706' },
                  ]}
                >
                  No dates selected
                </Typo>
                <Typo style={[s.noDatesHint, { color: colors.textSecondary }]}>
                  You'll be asked to choose dates before checkout
                </Typo>
              </View>
            </View>
          )}

          {/* Price Breakdown */}
          {hasBookingData && (
            <SectionCard title="Price Breakdown">
              <PriceBreakdown
                pricing={pricing}
                loading={pricingLoading}
                fallbackDailyRate={car?.dailyRate}
                fallbackDays={totalDays}
                fallbackCurrency={car?.currency ?? 'NGN'}
                insuranceLabel={
                  insurance !== 'none'
                    ? insurancePackages.find(p => p.id === insurance)?.name
                    : undefined
                }
              />
            </SectionCard>
          )}

        </View>
      </ScrollView>

      {/* ── BOTTOM BAR ── */}
      <View
        style={[
          s.bottomBar,
          {
            paddingBottom: insets.bottom + 12,
            backgroundColor: colors.background,
            borderTopColor: colors.border,
          },
        ]}
      >
        <View style={s.bottomPrice}>
          {pricingLoading ? (
            <Typo style={[s.bottomPriceSub, { color: colors.textSecondary }]}>Calculating price…</Typo>
          ) : (
            <>
              <Typo style={s.bottomPriceAmount}>
                {totalPrice ? fmtPrice(totalPrice) : '—'}
              </Typo>
              {hasBookingData && pricing ? (
                <Typo style={[s.bottomPriceSub, { color: colors.textSecondary }]}>
                  {totalDays} day{totalDays !== 1 ? 's' : ''}
                  {taxAmount > 0 ? ` · incl. ${fmtPrice(taxAmount)} tax` : ''}
                </Typo>
              ) : hasBookingData && car?.dailyRate ? (
                <Typo style={[s.bottomPriceSub, { color: colors.textSecondary }]}>
                  {totalDays} day{totalDays !== 1 ? 's' : ''} · {fmtPrice(car.dailyRate)}/day
                </Typo>
              ) : (
                <Typo style={[s.bottomPriceSub, { color: colors.textSecondary }]}>Select dates to see price</Typo>
              )}
              {depositAmount && depositAmount > 0 ? (
                <Typo style={[s.bottomPriceSub, { color: colors.textSecondary }]}>
                  + {fmtPrice(depositAmount)} deposit (collected at pickup)
                </Typo>
              ) : null}
            </>
          )}
        </View>
        <AppButton
          title={hasBookingData ? 'Book Now' : 'Choose Dates'}
          onPress={handleProceedToPayment}
          style={s.bookBtn}
        />
      </View>
    </View>
  );
};

export default VehicleDetailsScreen;

/* ── Section card wrapper ── */
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[sc.wrap, { borderBottomColor: colors.border }]}>
      <Typo style={[sc.title, { color: colors.textPrimary }]}>{title}</Typo>
      {children}
    </View>
  );
}
const sc = StyleSheet.create({
  wrap: {
    marginBottom: 8,
    paddingTop: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    paddingBottom: 16,
  },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
});

const s = StyleSheet.create({
  root: { flex: 1 },

  /* hero */
  hero: {
    height: HERO_H,
    backgroundColor: '#111',
    overflow: 'hidden',
  },
  gradTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  gradBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    zIndex: 1,
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 2,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteWrap: {
    position: 'absolute',
    right: 16,
    zIndex: 2,
  },
  imgCounter: {
    position: 'absolute',
    right: 16,
    bottom: 14,
    zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  imgCounterText: { fontSize: 12, color: '#fff', fontWeight: '600' },
  heroInfo: {
    position: 'absolute',
    bottom: 14,
    left: 16,
    right: 60,
    zIndex: 2,
    gap: 4,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 4,
  },
  categoryBadgeText: { fontSize: 11, color: '#fff', fontWeight: '600', letterSpacing: 0.5 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  heroLocRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroLoc: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },

  /* body */
  body: { paddingTop: 4 },

  /* price row */
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  priceInline: { flexDirection: 'row', alignItems: 'baseline' },
  priceAmount: { fontSize: 28, fontWeight: '800', color: GREEN },
  priceLabel: { fontSize: 13, fontWeight: '500' },
  totalBadge: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'flex-end',
    borderWidth: 1,
  },
  totalBadgeLabel: { fontSize: 11 },
  totalBadgeAmount: { fontSize: 15, fontWeight: '700', color: GREEN },

  /* stats scroll */
  statsScroll: { paddingHorizontal: 16, paddingBottom: 12 },

  /* stat chip */
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 8,
    borderWidth: 1,
  },
  statLabel: { fontSize: 12, fontWeight: '600' },

  /* provider card */
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  providerAvatarWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#0A6A4B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerInitials: { color: '#fff', fontWeight: '800', fontSize: 15 },
  providerInfo: { flex: 1, gap: 3 },
  providerName: { fontSize: 14, fontWeight: '700' },
  providerSub: { fontSize: 12 },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  verifiedText: { fontSize: 11, fontWeight: '700' },

  /* no dates card */
  noDatesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  noDatesTitle: { fontSize: 14, fontWeight: '700' },
  noDatesHint: { fontSize: 12, marginTop: 2 },

  /* bottom bar */
  bottomBar: {
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  bottomPrice: { flex: 1 },
  bottomPriceAmount: { fontSize: 22, fontWeight: '800', color: GREEN },
  bottomPriceSub: { fontSize: 12, marginTop: 2 },
  bookBtn: { flex: 1 },
});
