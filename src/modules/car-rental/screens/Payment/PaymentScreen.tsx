import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  StyleSheet,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@react-native-vector-icons/ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';

import { Typo } from '@/components/AppText/Typo';
import { AppButton } from '@/components/AppButton/CustomButton';
import { TimelineLocation } from '@/components/Timeline/TimelineLocation';
import { formatDate, formatTime } from '@/helpers/dateTime';
import type { RentalCar, RentalInsurancePackage } from '@/types/rental';
import { getCarWithFeatures } from '@/services/rental.service';
import { createBooking, confirmCollectionBooking } from '@/services/booking.service';
import { createPaymentSheetSession, getPaymentConfig } from '@/services/payment.service';
import { initPaymentSheet, initStripe, presentPaymentSheet } from '@stripe/stripe-react-native';
import { STRIPE_MERCHANT_ID, STRIPE_URL_SCHEME } from '@env';
import { showError, showSuccess } from '@/helpers/toast';
import { fetchMe } from '@/services/user.service';
import { DEV_BYPASS_KYC_VERIFICATION } from '@/config/devKyc';
import { previewBookingPrice, PricingPreview } from '@/services/pricing.service';
import { PriceBreakdown } from '@/components/Rental/PriceBreakdown/PriceBreakdown';
import { useCurrency, useFormatMoney } from '@/providers/CurrencyProvider';
import { useTheme } from '@/theme/ThemeProvider';

const GREEN = '#0A6A4B';
const SW = Dimensions.get('window').width;
const HERO_H = 340;

const PaymentScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const routeCar: RentalCar | undefined = route?.params?.car;
  const vehicleId: string | undefined = route?.params?.vehicleId;
  const search = route?.params?.search;
  const pickupLocationName = route?.params?.pickupLocationName;
  const dropoffLocationName = route?.params?.dropoffLocationName;
  const insuranceId: string | undefined = route?.params?.insuranceId;
  const routePickupLocationId: string | undefined = route?.params?.pickupLocationId;
  const routeDropoffLocationId: string | undefined = route?.params?.dropoffLocationId;
  const paymentMethod: 'ONLINE' | 'COLLECTION' = route?.params?.paymentMethod ?? 'ONLINE';

  const { currency: userCurrency } = useCurrency();
  const fmtMoney = useFormatMoney();
  const { mode, colors } = useTheme();
  const [car, setCar] = useState<RentalCar | undefined>(routeCar);
  const [gateway, setGateway] = useState<'stripe' | 'flutterwave'>('stripe');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState<string | undefined>(
    route?.params?.bookingId,
  );
  const [showKycModal, setShowKycModal] = useState(false);
  const [pricing, setPricing] = useState<PricingPreview | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);

  useEffect(() => {
    if (routeCar) setCar(routeCar);
  }, [routeCar]);

  useEffect(() => {
    const carId = vehicleId || car?.id;
    if (!carId || !search?.pickupAt || !search?.returnAt) return;
    let cancelled = false;
    const fetchPricing = async () => {
      try {
        setPricingLoading(true);
        const result = await previewBookingPrice({
          carId,
          pickupAt: search.pickupAt,
          returnAt: search.returnAt,
          insuranceId,
          displayCurrency: userCurrency,
        });
        if (!cancelled) setPricing(result);
      } catch {
        console.warn('[Payment] Pricing preview failed');
      } finally {
        if (!cancelled) setPricingLoading(false);
      }
    };
    fetchPricing();
    return () => { cancelled = true; };
  }, [vehicleId, car?.id, search?.pickupAt, search?.returnAt, insuranceId, userCurrency]);

  useEffect(() => {
    const loadDetails = async () => {
      if (!vehicleId) return;
      const hasInsurance = (car?.insurancePackages?.length ?? 0) > 0;
      const hasImages = (car?.images?.length ?? 0) > 1;
      if (hasInsurance && hasImages) return;
      try {
        const detail = await getCarWithFeatures(vehicleId);
        setCar(prev => ({
          ...(prev ?? detail),
          ...detail,
          location: detail.location ?? prev?.location,
          provider: detail.provider ?? prev?.provider,
          images: detail.images?.length ? detail.images : prev?.images ?? [],
        }));
      } catch {
        console.warn('[Payment] Failed to load car details');
      }
    };
    loadDetails();
  }, [vehicleId, car?.insurancePackages?.length, car?.images?.length]);

  const fmt = (value?: string) =>
    value ? value.replace(/_/g, ' ').toLowerCase().replace(/(^\w|\s\w)/g, m => m.toUpperCase()) : '';

  const images = car?.images ?? [];
  const imageUrls = images.map(img => img.url).filter((url): url is string => !!url);
  const FALLBACK = 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=600';
  const displayImages = imageUrls.length > 0 ? imageUrls : [FALLBACK];

  const title = car?.brand && car?.model ? `${car.brand} ${car.model}` : 'Vehicle';
  const locationName = car?.location?.name ?? pickupLocationName ?? '';
  const locationAddress = car?.location?.address ?? '';

  const pickupAt = search?.pickupAt ? new Date(search.pickupAt) : null;
  const returnAt = search?.returnAt ? new Date(search.returnAt) : null;
  const totalDays = pricing?.rentalDays ?? (pickupAt && returnAt
    ? Math.max(1, Math.ceil((returnAt.getTime() - pickupAt.getTime()) / 86400000))
    : 1);
  const basePrice = pricing?.basePrice ?? (car?.dailyRate && totalDays ? car.dailyRate * totalDays : 0);

  const insurancePackages: RentalInsurancePackage[] = car?.insurancePackages ?? [];
  const selectedInsurance = insurancePackages.find(pkg => pkg.id === insuranceId);
  const insuranceDaily =
    selectedInsurance?.dailyPrice ?? selectedInsurance?.dailyRate;
  const insuranceFee = pricing?.insuranceFee ?? (
    insuranceDaily && totalDays
      ? insuranceDaily * totalDays
      : selectedInsurance?.price ?? selectedInsurance?.amount ?? 0
  );
  const taxAmount = pricing?.taxAmount ?? 0;
  const depositAmount = pricing?.depositAmount ?? 0;
  const totalPrice = pricing?.totalPrice ?? (basePrice + insuranceFee);

  const currency = pricing?.currency ?? car?.currency ?? 'NGN';
  const fmtAmount = (amount?: number) => fmtMoney(amount, currency, { round: true });
  const isConverted =
    !!currency && !!userCurrency && currency.toUpperCase() !== userCurrency.toUpperCase();

  const paymentGateways = [
    { id: 'stripe' as const, name: 'Stripe', logo: require('@/assets/images/stripe.png') },
    { id: 'flutterwave' as const, name: 'Flutterwave', logo: require('@/assets/images/Flutterwave_Logo.png') },
  ];

  const buildBookingPayload = () => {
    const carId = vehicleId || car?.id;
    const pickupAtValue = search?.pickupAt;
    const returnAtValue = search?.returnAt;
    const pickupLocationIdValue = routePickupLocationId || search?.pickupLocationId || car?.location?.id;
    const dropoffLocationIdValue = routeDropoffLocationId || routePickupLocationId || search?.dropoffLocationId || search?.pickupLocationId || car?.location?.id;
    if (!carId || !pickupAtValue || !returnAtValue || !pickupLocationIdValue || !dropoffLocationIdValue) return null;
    return { carId, pickupAt: pickupAtValue, returnAt: returnAtValue, pickupLocationId: pickupLocationIdValue, dropoffLocationId: dropoffLocationIdValue, insuranceId, paymentMethod };
  };

  const getProfileStatus = (me: any) => {
    const user = me?.user ?? me?.data?.user ?? me?.data ?? me;
    const raw = user?.profileStatus || user?.kycStatus || user?.verificationStatus || user?.documentsStatus || user?.kyc?.status || '';
    return raw ? raw.toString().toUpperCase() : '';
  };

  const ensureProfileEligible = async () => {
    if (DEV_BYPASS_KYC_VERIFICATION) return true;
    try {
      const me = await fetchMe();
      const status = getProfileStatus(me);
      if (!status) { showError('Profile status unavailable.'); setShowKycModal(true); return false; }
      if (['APPROVED', 'VERIFIED', 'COMPLETED'].includes(status)) return true;
      if (['PENDING', 'PENDING_VERIFICATION', 'IN_REVIEW'].includes(status)) { showError('KYC pending verification'); return false; }
      if (['REJECTED', 'DECLINED', 'FAILED'].includes(status)) { showError('KYC rejected. Please re-upload documents.'); setShowKycModal(true); return false; }
      showError('Profile not completed'); setShowKycModal(true); return false;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401) return false;
      showError('Unable to verify profile status'); return false;
    }
  };

  const handlePayOnCollection = async () => {
    if (processingPayment) return;
    const canProceed = await ensureProfileEligible();
    if (!canProceed) return;
    const bookingPayload = createdBookingId ? null : buildBookingPayload();
    if (!createdBookingId && !bookingPayload) { showError('Missing booking details.'); return; }
    try {
      setProcessingPayment(true);
      let bookingId = createdBookingId;
      if (!bookingId) {
        const resp = await createBooking(bookingPayload!);
        bookingId = resp?.booking?.id;
        if (!bookingId) throw new Error('BOOKING_ID_MISSING');
        setCreatedBookingId(bookingId);
      }
      await confirmCollectionBooking(bookingId);
      showSuccess('Booking confirmed! Pay on collection.');
      navigation.navigate('BookingStatus', { status: 'success', bookingId, paymentMethod: 'COLLECTION' });
    } catch (error: any) {
      const message = error?.response?.data?.message;
      if (message === 'Complete your profile before booking') { showError('Complete your profile before booking.'); setShowKycModal(true); }
      else if (message === 'Booking already processed') { showSuccess('Booking already confirmed!'); navigation.navigate('BookingStatus', { status: 'success', bookingId: createdBookingId, paymentMethod: 'COLLECTION' }); }
      else if (message === 'CAR_ALREADY_BOOKED') showError('This car is already booked for the selected dates.');
      else showError(message || 'Unable to confirm booking.');
    } finally { setProcessingPayment(false); }
  };

  const handleBookVehicle = async () => {
    if (processingPayment) return;
    if (gateway !== 'stripe') { showError('Flutterwave will be added later. Please use Stripe.'); return; }
    const canProceed = await ensureProfileEligible();
    if (!canProceed) return;
    const bookingPayload = createdBookingId ? null : buildBookingPayload();
    if (!createdBookingId && !bookingPayload) { showError('Missing booking details.'); return; }
    try {
      setProcessingPayment(true);
      let bookingId = createdBookingId;
      if (!bookingId) {
        const resp = await createBooking(bookingPayload!);
        bookingId = resp?.booking?.id;
        if (!bookingId) throw new Error('BOOKING_ID_MISSING');
        setCreatedBookingId(bookingId);
      }
      const config = await getPaymentConfig();
      const session = await createPaymentSheetSession({ bookingId });
      const provider = (session.provider || config.provider || '').toUpperCase();
      if (provider !== 'STRIPE') { showError('Only Stripe payment is currently available.'); return; }
      const publishableKey = session.publishableKey || config.publishableKey;
      if (!publishableKey) { showError('Stripe publishable key is missing.'); return; }
      if (__DEV__) {
        const clientSecret = session.paymentIntentClientSecret || '';
        const pkMode = publishableKey.startsWith('pk_live_') ? 'live' : publishableKey.startsWith('pk_test_') ? 'test' : 'unknown';
        const csMode = clientSecret.includes('_secret_') && clientSecret.startsWith('pi_') ? (clientSecret.length > 0 ? 'pi' : 'empty') : 'invalid';
        console.log('[Stripe] publishableKey =', publishableKey.slice(0, 14) + '…', '(' + pkMode + ')');
        console.log('[Stripe] clientSecret prefix =', clientSecret.slice(0, 10) + '…', csMode);
      }
      await initStripe({ publishableKey, merchantIdentifier: STRIPE_MERCHANT_ID, urlScheme: STRIPE_URL_SCHEME });
      const { error: initError } = await initPaymentSheet({ merchantDisplayName: config.merchantDisplayName || 'SureRide', paymentIntentClientSecret: session.paymentIntentClientSecret, allowsDelayedPaymentMethods: true, returnURL: `${STRIPE_URL_SCHEME}://stripe-redirect` });
      if (initError) { showError(initError.message || 'Unable to initialize payment sheet'); return; }
      const { error: presentError } = await presentPaymentSheet();
      if (presentError) { const code = String(presentError.code || '').toLowerCase(); showError(code.includes('canceled') ? 'Payment cancelled' : presentError.message || 'Payment failed'); return; }
      showSuccess('Payment successful');
      navigation.navigate('BookingStatus', { status: 'success', bookingId });
    } catch (error: any) {
      const message = error?.response?.data?.message;
      if (message === 'Complete your profile before booking') { showError('Complete your profile before booking.'); setShowKycModal(true); }
      else showError(message || 'Unable to process payment right now');
    } finally { setProcessingPayment(false); }
  };

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        {/* ── IMAGE HERO ── */}
        <View style={s.hero}>
          <ScrollView
            horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            style={StyleSheet.absoluteFill}
            onMomentumScrollEnd={e => setActiveImageIndex(Math.round(e.nativeEvent.contentOffset.x / SW))}
          >
            {displayImages.map((uri, idx) => (
              <Image key={`${uri}-${idx}`} source={{ uri }} style={{ width: SW, height: HERO_H }} resizeMode="cover" />
            ))}
          </ScrollView>
          {/* Gradients are decoration only — let swipe gestures pass through */}
          <LinearGradient pointerEvents="none" colors={['rgba(0,0,0,0.55)', 'transparent']} style={[s.gradTop, { height: insets.top + 60 }]} />
          <LinearGradient pointerEvents="none" colors={['transparent', 'rgba(0,0,0,0.8)']} style={s.gradBottom} />

          {/* Back */}
          <TouchableOpacity style={[s.backBtn, { top: insets.top + 10 }]} onPress={() => navigation.goBack()}>
            <Icon name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View
            pointerEvents="box-none"
            style={[s.headerTitle, { top: insets.top + 14 }]}
          >
            <Typo style={s.headerTitleText}>Checkout</Typo>
          </View>

          {displayImages.length > 1 && (
            <View style={s.imgCounter}>
              <Typo style={s.imgCounterText}>{activeImageIndex + 1}/{displayImages.length}</Typo>
            </View>
          )}

          {/* Car name overlay — non-interactive so the underlying carousel still
              receives the horizontal swipe gesture across the bottom of the hero */}
          <View pointerEvents="none" style={s.heroInfo}>
            <Typo style={s.heroTitle}>{title}</Typo>
            <View style={s.heroMeta}>
              {car?.transmission && <View style={s.heroBadge}><Typo style={s.heroBadgeText}>{fmt(car.transmission)}</Typo></View>}
              {typeof car?.seats === 'number' && <View style={s.heroBadge}><Typo style={s.heroBadgeText}>{car.seats} Seats</Typo></View>}
              {typeof car?.hasAC === 'boolean' && <View style={s.heroBadge}><Typo style={s.heroBadgeText}>{car.hasAC ? 'A/C' : 'No A/C'}</Typo></View>}
            </View>
          </View>
        </View>

        {/* ── BODY ── */}
        <View style={s.body}>
          {/* Rental Period */}
          <SectionCard title="Rental Period" icon="calendar-outline">
            <TimelineLocation
              label="Pick-up"
              icon="location" color={GREEN}
              date={pickupAt ? `${formatDate(pickupAt)} at ${formatTime(pickupAt)}` : ''}
              place={pickupLocationName || locationName}
              address={locationAddress || 'Pickup location'}
            />
            <TimelineLocation
              label="Drop-off"
              icon="location" color="#F59E0B"
              date={returnAt ? `${formatDate(returnAt)} at ${formatTime(returnAt)}` : ''}
              place={dropoffLocationName || locationName}
              address={locationAddress || 'Drop-off location'}
              isLast
            />
          </SectionCard>

          {/* Insurance */}
          <SectionCard title="Insurance" icon="shield-checkmark-outline">
            <View style={s.insuranceRow}>
              <View
                style={[
                  s.insuranceIcon,
                  {
                    backgroundColor: mode === 'dark' ? colors.background : '#F3F4F6',
                  },
                ]}
              >
                <Icon
                  name="shield-checkmark-outline"
                  size={20}
                  color={selectedInsurance ? GREEN : colors.textSecondary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Typo style={[s.insuranceName, { color: colors.textPrimary }]}>
                  {selectedInsurance?.name || 'No Insurance'}
                </Typo>
                <Typo style={[s.insuranceDesc, { color: colors.textSecondary }]}>
                  {selectedInsurance?.description || 'No insurance package selected'}
                </Typo>
              </View>
              <Typo
                style={[
                  s.insuranceFee,
                  { color: colors.textSecondary },
                  selectedInsurance && s.insuranceFeeActive,
                ]}
              >
                {fmtAmount(insuranceFee || 0)}
              </Typo>
            </View>
          </SectionCard>

          {/* Important Notes */}
          <SectionCard title="Important Notes" icon="information-circle-outline">
            {[
              'Valid driver\'s license required (min. 2 years)',
              'Verification documents must be approved',
              'Fuel policy: Full to Full',
              'Free cancellation up to 24hrs before pickup',
            ].map((note, i) => (
              <View key={i} style={s.noteRow}>
                <View style={s.noteDot} />
                <Typo style={[s.noteText, { color: colors.textSecondary }]}>{note}</Typo>
              </View>
            ))}
          </SectionCard>

          {/* Payment Summary */}
          <SectionCard title="Payment Summary" icon="receipt-outline">
            <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
              <PriceBreakdown
                pricing={pricing}
                loading={pricingLoading}
                fallbackDailyRate={car?.dailyRate}
                fallbackDays={totalDays}
                fallbackCurrency={car?.currency ?? 'NGN'}
                insuranceLabel={selectedInsurance?.name}
              />
            </View>
          </SectionCard>

          {/* Payment method */}
          {paymentMethod === 'COLLECTION' ? (
            <SectionCard title="Payment Method" icon="wallet-outline">
              <View
                style={[
                  s.collectionBox,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Icon name="wallet-outline" size={22} color={colors.textSecondary} />
                <View style={{ flex: 1, gap: 3 }}>
                  <Typo style={[s.collectionTitle, { color: colors.textPrimary }]}>
                    Pay on Collection
                  </Typo>
                  <Typo style={[s.collectionHint, { color: colors.textSecondary }]}>
                    Pay in cash when you arrive to pick up the car. A collection code will be
                    sent to you upon confirmation.
                  </Typo>
                </View>
              </View>
            </SectionCard>
          ) : (
            <SectionCard title="Payment Gateway" icon="card-outline">
              {paymentGateways.map(gw => (
                <TouchableOpacity
                  key={gw.id}
                  style={[
                    s.gatewayRow,
                    { borderColor: colors.border },
                    gateway === gw.id && {
                      borderColor: GREEN,
                      backgroundColor: mode === 'dark' ? '#0F3027' : '#F0FDF4',
                    },
                  ]}
                  onPress={() => setGateway(gw.id)}
                >
                  <View style={s.gatewayLeft}>
                    <View
                      style={[
                        s.gatewayLogoWrap,
                        { backgroundColor: colors.background, borderColor: colors.border },
                      ]}
                    >
                      <Image source={gw.logo} style={s.gatewayLogo} />
                    </View>
                    <Typo style={[s.gatewayName, { color: colors.textPrimary }]}>{gw.name}</Typo>
                  </View>
                  <View
                    style={[
                      s.radio,
                      { borderColor: colors.border },
                      gateway === gw.id && s.radioActive,
                    ]}
                  >
                    {gateway === gw.id && <View style={s.radioDot} />}
                  </View>
                </TouchableOpacity>
              ))}
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
        <View style={s.bottomLeft}>
          <Typo style={[s.totalLabel, { color: colors.textSecondary }]}>Total</Typo>
          {pricingLoading ? (
            <Typo style={[s.totalValue, { fontSize: 15, color: colors.textSecondary }]}>Calculating…</Typo>
          ) : (
            <Typo style={s.totalValue}>{fmtAmount(totalPrice)}</Typo>
          )}
          {depositAmount > 0 && !pricingLoading && (
            <Typo style={[s.depositHint, { color: colors.textSecondary }]}>+ {fmtAmount(depositAmount)} deposit</Typo>
          )}
          {isConverted && !pricingLoading && (
            <Typo style={[s.depositHint, { color: colors.textSecondary }]}>
              Charged in {currency.toUpperCase()} at checkout
            </Typo>
          )}
        </View>
        <AppButton
          title={
            processingPayment ? 'Processing...' :
            paymentMethod === 'COLLECTION' ? 'Confirm Booking' : 'Pay Now'
          }
          loading={processingPayment}
          onPress={paymentMethod === 'COLLECTION' ? handlePayOnCollection : handleBookVehicle}
          style={s.payBtn}
        />
      </View>

      {/* ── KYC MODAL ── */}
      <Modal visible={showKycModal} transparent animationType="fade" hardwareAccelerated presentationStyle="overFullScreen" onRequestClose={() => setShowKycModal(false)}>
        <View style={s.kycBackdrop}>
          <View style={[s.kycCard, { backgroundColor: colors.surface }]}>
            <View style={[s.kycIconWrap, { backgroundColor: mode === 'dark' ? '#0F3027' : '#F0FDF4' }]}>
              <Icon name="person-outline" size={28} color={GREEN} />
            </View>
            <Typo style={[s.kycTitle, { color: colors.textPrimary }]}>Complete Your KYC</Typo>
            <Typo style={[s.kycHint, { color: colors.textSecondary }]}>
              You need to verify your identity before making a booking. It only takes a few minutes.
            </Typo>
            <AppButton
              title="Upload Documents"
              onPress={() => { setShowKycModal(false); navigation.navigate('KYCFlow'); }}
            />
            <AppButton
              title="Skip for now"
              variant="outline"
              onPress={() => setShowKycModal(false)}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default PaymentScreen;

/* ── Helpers ── */
function SectionCard({ title, icon, children }: { title: string; icon?: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[p.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[p.sectionHeader, { borderBottomColor: colors.border }]}>
        {icon && <Icon name={icon as any} size={16} color={GREEN} />}
        <Typo style={[p.sectionTitle, { color: colors.textPrimary }]}>{title}</Typo>
      </View>
      {children}
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={p.summaryRow}>
      <Typo style={[p.summaryLabel, { color: colors.textSecondary }]}>{label}</Typo>
      <Typo style={[p.summaryValue, { color: colors.textPrimary }]}>{value}</Typo>
    </View>
  );
}

const p = StyleSheet.create({
  sectionCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700' },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  summaryLabel: { fontSize: 13, flex: 1 },
  summaryValue: { fontSize: 13, fontWeight: '600' },
});

const s = StyleSheet.create({
  root: { flex: 1 },

  hero: { height: HERO_H, backgroundColor: '#111', overflow: 'hidden' },
  gradTop: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 },
  gradBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 110, zIndex: 1 },
  backBtn: {
    position: 'absolute', left: 16, zIndex: 2,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { position: 'absolute', left: 0, right: 0, zIndex: 2, alignItems: 'center' },
  headerTitleText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  imgCounter: {
    position: 'absolute', right: 16, bottom: 14, zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  imgCounterText: { fontSize: 12, color: '#fff', fontWeight: '600' },
  heroInfo: { position: 'absolute', bottom: 14, left: 16, right: 60, zIndex: 2, gap: 6 },
  heroTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  heroMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  heroBadgeText: { fontSize: 11, color: '#fff', fontWeight: '600' },

  /* body */
  body: { paddingTop: 16 },

  /* insurance row */
  insuranceRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  insuranceIcon: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
  },
  insuranceName: { fontSize: 14, fontWeight: '600' },
  insuranceDesc: { fontSize: 12, marginTop: 2 },
  insuranceFee: { fontSize: 14, fontWeight: '700' },
  insuranceFeeActive: { color: GREEN },

  /* notes */
  noteRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    paddingHorizontal: 16, paddingVertical: 7,
  },
  noteDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: GREEN, marginTop: 6,
  },
  noteText: { flex: 1, fontSize: 13, lineHeight: 18 },

  /* summary */
  summaryDivider: { height: 1, marginHorizontal: 16, marginVertical: 4 },
  summaryTotal: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  summaryTotalLabel: { fontSize: 15, fontWeight: '700' },
  summaryTotalValue: { fontSize: 17, fontWeight: '800', color: GREEN },

  /* collection */
  collectionBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    margin: 12, padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  collectionTitle: { fontSize: 14, fontWeight: '700' },
  collectionHint: { fontSize: 12, lineHeight: 18 },

  /* gateways */
  gatewayRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 12, marginBottom: 8, marginTop: 4,
    borderWidth: 1.5,
    borderRadius: 12, padding: 12,
  },
  gatewayLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  gatewayLogoWrap: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  gatewayLogo: { width: 28, height: 28, resizeMode: 'contain' },
  gatewayName: { fontSize: 14, fontWeight: '600' },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: GREEN },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: GREEN },

  /* bottom bar */
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopWidth: 1,
    paddingHorizontal: 20, paddingTop: 14,
    flexDirection: 'row', alignItems: 'center', gap: 16,
  },
  bottomLeft: { flex: 1 },
  totalLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  totalValue: { fontSize: 22, fontWeight: '800', color: GREEN },
  depositHint: { fontSize: 11, marginTop: 1 },
  payBtn: { flex: 1.2 },

  /* kyc modal */
  kycBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', padding: 24,
  },
  kycCard: {
    borderRadius: 20,
    padding: 24, alignItems: 'center', gap: 12,
  },
  kycIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  kycTitle: { fontSize: 18, fontWeight: '800' },
  kycHint: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
