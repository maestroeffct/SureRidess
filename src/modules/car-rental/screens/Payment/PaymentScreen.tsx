import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';

import { ScreenWrapper } from '@/components/Screenwrapper/Screenwrapper';
import { Typo } from '@/components/AppText/Typo';
import { AppButton } from '@/components/AppButton/CustomButton';
import { useNavigation, useRoute } from '@react-navigation/native';
import styles from './styles';
import { TimelineLocation } from '@/components/Timeline/TimelineLocation';
import { InfoText } from '@/components/InfoText/InfoText';
import { ProviderRow } from '@/components/Rental/ProviderRow/ProviderRow';
import { ProtectionRow } from '@/components/Rental/ProtectionRow/ProtectionRow';
import { PaymentSummaryRow } from '@/components/Rental/PaymentSummaryRow/PaymentSummaryRow';
import { formatDate, formatTime } from '@/helpers/dateTime';
import type { RentalCar, RentalInsurancePackage } from '@/types/rental';
import { getCarWithFeatures } from '@/services/rental.service';
import { createBooking, confirmCollectionBooking } from '@/services/booking.service';
import { createPaymentSheetSession, getPaymentConfig } from '@/services/payment.service';
import { initPaymentSheet, initStripe, presentPaymentSheet } from '@stripe/stripe-react-native';
import { showError, showSuccess } from '@/helpers/toast';
import { Tag } from '@/components/Rental/Tag/Tag';
import { fetchMe } from '@/services/user.service';
import { DEV_BYPASS_KYC_VERIFICATION } from '@/config/devKyc';
import { useTheme } from '@/theme/ThemeProvider';

const PaymentScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors } = useTheme();
  const routeCar: RentalCar | undefined = route?.params?.car;
  const vehicleId: string | undefined = route?.params?.vehicleId;
  const search = route?.params?.search;
  const pickupLocationName = route?.params?.pickupLocationName;
  const dropoffLocationName = route?.params?.dropoffLocationName;
  const insuranceId: string | undefined = route?.params?.insuranceId;
  const routePickupLocationId: string | undefined = route?.params?.pickupLocationId;
  const routeDropoffLocationId: string | undefined = route?.params?.dropoffLocationId;
  const paymentMethod: 'ONLINE' | 'COLLECTION' = route?.params?.paymentMethod ?? 'ONLINE';
  const [car, setCar] = useState<RentalCar | undefined>(routeCar);
  const [gateway, setGateway] = useState<'stripe' | 'flutterwave'>('stripe');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState<string | undefined>(
    route?.params?.bookingId,
  );
  const [showKycActionModal, setShowKycActionModal] = useState(false);

  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    if (routeCar) setCar(routeCar);
  }, [routeCar]);

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
      } catch (error) {
        console.warn('[Payment] Failed to load car details', error);
      }
    };

    loadDetails();
  }, [vehicleId, car?.insurancePackages?.length, car?.images?.length]);

  const formatLabel = (value?: string) => {
    if (!value) return '';
    return value
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/(^\w|\s\w)/g, m => m.toUpperCase());
  };

  const images = car?.images ?? [];
  const imageUrls = images
    .map(img => img.url)
    .filter((url): url is string => !!url);
  const fallbackImage =
    'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=600';
  const displayImages = imageUrls.length > 0 ? imageUrls : [fallbackImage];
  const title =
    car?.brand && car?.model ? `${car.brand} ${car.model}` : 'Vehicle';
  const locationName = car?.location?.name ?? pickupLocationName ?? '';
  const locationAddress = car?.location?.address ?? '';

  const categoryLabel = car?.category ? formatLabel(car.category) : '';
  const transmissionLabel = car?.transmission
    ? formatLabel(car.transmission)
    : '';
  const seatsLabel = typeof car?.seats === 'number' ? `${car.seats}` : '';
  const hasAcLabel =
    typeof car?.hasAC === 'boolean' ? (car.hasAC ? 'A/C' : 'No A/C') : '';
  const mileageLabel = car?.mileagePolicy
    ? `${formatLabel(car.mileagePolicy)} Mileage`
    : '';

  const pickupAt = search?.pickupAt ? new Date(search.pickupAt) : null;
  const returnAt = search?.returnAt ? new Date(search.returnAt) : null;
  const totalDays =
    pickupAt && returnAt
      ? Math.max(
          1,
          Math.ceil((returnAt.getTime() - pickupAt.getTime()) / 86400000),
        )
      : 1;
  const basePrice = car?.dailyRate && totalDays ? car.dailyRate * totalDays : 0;

  const insurancePackages: RentalInsurancePackage[] =
    car?.insurancePackages ?? [];
  const selectedInsurance = insurancePackages.find(
    pkg => pkg.id === insuranceId,
  );
  const insuranceFee =
    selectedInsurance?.dailyRate && totalDays
      ? selectedInsurance.dailyRate * totalDays
      : selectedInsurance?.price ?? selectedInsurance?.amount ?? 0;
  const totalPrice = basePrice + insuranceFee;

  const formatMoney = (amount?: number) =>
    typeof amount === 'number' ? `₦${amount.toLocaleString()}` : '—';

  const paymentGateways = [
    {
      id: 'stripe' as const,
      name: 'Stripe',
      logo: require('@/assets/images/stripe.png'),
    },
    {
      id: 'flutterwave' as const,
      name: 'Flutterwave',
      logo: require('@/assets/images/Flutterwave_Logo.png'),
    },
  ];

  const buildBookingPayload = () => {
    const carId = vehicleId || car?.id;
    const pickupAtValue = search?.pickupAt;
    const returnAtValue = search?.returnAt;
    const pickupLocationIdValue =
      routePickupLocationId || search?.pickupLocationId || car?.location?.id;
    const dropoffLocationIdValue =
      routeDropoffLocationId ||
      routePickupLocationId ||
      search?.dropoffLocationId ||
      search?.pickupLocationId ||
      car?.location?.id;

    if (
      !carId ||
      !pickupAtValue ||
      !returnAtValue ||
      !pickupLocationIdValue ||
      !dropoffLocationIdValue
    ) {
      return null;
    }

    return {
      carId,
      pickupAt: pickupAtValue,
      returnAt: returnAtValue,
      pickupLocationId: pickupLocationIdValue,
      dropoffLocationId: dropoffLocationIdValue,
      insuranceId,
      paymentMethod,
    };
  };

  const handlePayOnCollection = async () => {
    if (processingPayment) return;

    const canProceed = await ensureProfileEligibleForPayment();
    if (!canProceed) return;

    const bookingPayload = createdBookingId ? null : buildBookingPayload();
    if (!createdBookingId && !bookingPayload) {
      showError('Missing booking details. Please go back and try again.');
      return;
    }

    try {
      setProcessingPayment(true);

      let bookingId = createdBookingId;
      if (!bookingId) {
        const bookingResponse = await createBooking(bookingPayload!);
        bookingId = bookingResponse?.booking?.id;

        if (!bookingId) {
          throw new Error('BOOKING_ID_MISSING');
        }

        setCreatedBookingId(bookingId);
      }

      await confirmCollectionBooking(bookingId);

      showSuccess('Booking confirmed! Pay on collection.');
      navigation.navigate('BookingStatus', {
        status: 'success',
        bookingId,
        paymentMethod: 'COLLECTION',
      });
    } catch (error: any) {
      const message = error?.response?.data?.message;
      if (message === 'Complete your profile before booking') {
        showError('Complete your profile before booking.');
        setShowKycActionModal(true);
      } else if (message === 'Booking already processed') {
        // Booking was already confirmed — navigate to success
        showSuccess('Booking already confirmed!');
        navigation.navigate('BookingStatus', {
          status: 'success',
          bookingId: createdBookingId,
          paymentMethod: 'COLLECTION',
        });
      } else if (message === 'CAR_ALREADY_BOOKED') {
        showError('This car is already booked for the selected dates. Please choose different dates or another vehicle.');
      } else if (message) {
        showError(message);
      } else {
        showError('Unable to confirm booking. Please try again.');
      }

      if (__DEV__) {
        console.log('[Payment] Collection booking failed', error);
      }
    } finally {
      setProcessingPayment(false);
    }
  };


  const getProfileStatus = (me: any) => {
    const user = me?.user ?? me?.data?.user ?? me?.data ?? me;

    const raw =
      user?.profileStatus ||
      user?.kycStatus ||
      user?.verificationStatus ||
      user?.documentsStatus ||
      user?.kyc?.status ||
      user?.kyc?.profileStatus ||
      user?.kyc?.documentsStatus ||
      '';

    return raw ? raw.toString().toUpperCase() : '';
  };

  const ensureProfileEligibleForPayment = async () => {
    if (DEV_BYPASS_KYC_VERIFICATION) {
      if (__DEV__) {
        console.log('[KYC][Guard] Bypassed for payment testing');
      }
      return true;
    }

    try {
      const me = await fetchMe();
      const status = getProfileStatus(me);

      if (!status) {
        showError('Profile status unavailable. Please complete KYC.');
        setShowKycActionModal(true);
        return false;
      }

      if (['APPROVED', 'VERIFIED', 'COMPLETED'].includes(status)) {
        return true;
      }

      if (['PENDING', 'PENDING_VERIFICATION', 'IN_REVIEW'].includes(status)) {
        showError('KYC pending verification');
        return false;
      }

      if (['REJECTED', 'DECLINED', 'FAILED'].includes(status)) {
        showError('KYC rejected. Please re-upload documents.');
        setShowKycActionModal(true);
        return false;
      }

      if (['INCOMPLETE', 'NOT_STARTED', 'MISSING'].includes(status)) {
        showError('Profile not completed. Upload KYC documents.');
        setShowKycActionModal(true);
        return false;
      }

      showError('Profile not completed');
      setShowKycActionModal(true);
      return false;
    } catch (error: any) {
      const status = error?.response?.status;
      const code = String(error?.response?.data?.code || '').toUpperCase();
      console.warn('[Payment] Failed to check profile', error);

      if (status === 401) {
        return false;
      }

      if (
        status === 403 &&
        (code === 'ACCOUNT_SUSPENDED' || code === 'ACCOUNT_UNVERIFIED')
      ) {
        return false;
      }

      showError('Unable to verify profile status');
      return false;
    }
  };


  const handleBookVehicle = async () => {
    if (processingPayment) return;

    if (gateway !== 'stripe') {
      showError('Flutterwave will be added later. Please use Stripe for now.');
      return;
    }

    const canProceed = await ensureProfileEligibleForPayment();
    if (!canProceed) return;

    const bookingPayload = createdBookingId ? null : buildBookingPayload();
    if (!createdBookingId && !bookingPayload) {
      showError('Missing booking details. Please go back and try again.');
      return;
    }

    try {
      setProcessingPayment(true);

      let bookingId = createdBookingId;
      if (!bookingId) {
        const bookingResponse = await createBooking(bookingPayload!);
        bookingId = bookingResponse?.booking?.id;

        if (!bookingId) {
          throw new Error('BOOKING_ID_MISSING');
        }

        setCreatedBookingId(bookingId);
      }

      const config = await getPaymentConfig();
      const session = await createPaymentSheetSession({ bookingId });

      const provider = (session.provider || config.provider || '').toUpperCase();
      if (provider !== 'STRIPE') {
        showError('Only Stripe payment is currently available.');
        return;
      }

      const publishableKey = session.publishableKey || config.publishableKey;
      if (!publishableKey) {
        showError('Stripe publishable key is missing.');
        return;
      }

      await initStripe({
        publishableKey,
        merchantIdentifier: 'merchant.com.sureride',
        urlScheme: 'sureride',
      });

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: config.merchantDisplayName || 'SureRide',
        paymentIntentClientSecret: session.paymentIntentClientSecret,
        allowsDelayedPaymentMethods: true,
        returnURL: 'sureride://stripe-redirect',
      });

      if (initError) {
        showError(initError.message || 'Unable to initialize payment sheet');
        return;
      }

      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        const code = String(presentError.code || '').toLowerCase();
        if (code.includes('canceled')) {
          showError('Payment cancelled');
        } else {
          showError(presentError.message || 'Payment failed');
        }
        return;
      }

      showSuccess('Payment successful');
      navigation.navigate('BookingStatus', {
        status: 'success',
        bookingId,
      });
    } catch (error: any) {
      const message = error?.response?.data?.message;

      if (message === 'Complete your profile before booking') {
        showError('Complete your profile before booking.');
        setShowKycActionModal(true);
      } else if (message === 'BOOKING_NOT_PAYABLE') {
        showError('This booking is not payable.');
      } else if (message === 'BOOKING_ALREADY_PAID') {
        showError('This booking has already been paid.');
      } else if (message === 'bookingId is required') {
        showError('Payment setup failed: missing booking ID.');
      } else if (message) {
        showError(message);
      } else {
        showError('Unable to process payment right now');
      }

      if (__DEV__) {
        console.log('[Payment] Checkout failed', error);
      }
    } finally {
      setProcessingPayment(false);
    }
  };

  const collectionInfoStyle = {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 12,
    marginTop: 12,
    padding: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  };

  return (
    <ScreenWrapper padded={false}>
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <Typo variant="subheading">Payment</Typo>

        <TouchableOpacity>
          <Icon name="ellipsis-horizontal" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* VEHICLE HERO */}
        <View>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.imageCarousel}
            onMomentumScrollEnd={event => {
              const index = Math.round(
                event.nativeEvent.contentOffset.x / screenWidth,
              );
              setActiveImageIndex(index);
            }}
          >
            {displayImages.map((uri, index) => (
              <Image
                key={`${uri}-${index}`}
                source={{ uri }}
                style={[styles.heroImage, { width: screenWidth }]}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          <View style={styles.imageCount}>
            <Typo variant="caption">
              {displayImages.length > 0
                ? `${activeImageIndex + 1}/${displayImages.length}`
                : '1/1'}
            </Typo>
          </View>
        </View>

        {/* BASIC INFO */}
        <View style={[styles.section, { borderColor: colors.border }]}>
          <Typo variant="subheading">{title}</Typo>

          <View style={styles.locationRow}>
            <Icon name="location-outline" size={14} />
            <Typo variant="caption">{locationName || 'Location'}</Typo>
          </View>

          <View style={styles.features}>
            {!!categoryLabel && (
              <Tag label={categoryLabel} icon="car-outline" />
            )}
            {!!transmissionLabel && (
              <Tag label={transmissionLabel} icon="settings-outline" />
            )}
            {!!seatsLabel && <Tag label={seatsLabel} icon="people-outline" />}
            {!!hasAcLabel && <Tag label={hasAcLabel} icon="snow-outline" />}
            {!!mileageLabel && (
              <Tag label={mileageLabel} icon="speedometer-outline" />
            )}
          </View>
        </View>
        {/* PROVIDER */}
        <ProviderRow
          name={car?.provider?.name || 'Provider'}
          description={
            car?.provider?.isVerified
              ? 'Verified provider'
              : 'Professional rental service'
          }
          verified={car?.provider?.isVerified}
        />

        {/* IMPORTANT NOTES */}
        <View style={[styles.section, { borderColor: colors.border }]}>
          <Typo variant="subheading">Important Notes</Typo>

          <View style={styles.bullet}>
            <Typo variant="caption">
              • Valid driver's license required (min. 2 years)
            </Typo>
            <Typo variant="caption">
              • Verification documents must be approved
            </Typo>
            <Typo variant="caption">• Fuel policy: Full to Full</Typo>
            <Typo variant="caption">
              • Free cancellation up to 24hrs before pickup
            </Typo>
          </View>
        </View>

        <InfoText label="Useful information for your booking" />

        {/* RENTAL PERIOD */}
        <View style={[styles.section, { borderColor: colors.border }]}>
          <Typo variant="subheading">Rental Period</Typo>

          <TimelineLocation
            icon="location"
            date={
              pickupAt
                ? `${formatDate(pickupAt)} at ${formatTime(pickupAt)}`
                : ''
            }
            place={pickupLocationName || locationName}
            address={locationAddress || 'Pickup location'}
            color="#0B6E4F"
          />

          <TimelineLocation
            icon="location"
            date={
              returnAt
                ? `${formatDate(returnAt)} at ${formatTime(returnAt)}`
                : ''
            }
            place={dropoffLocationName || locationName}
            address={locationAddress || 'Drop-off location'}
            color="#6e400bff"
          />
        </View>

        {/* PROTECTION */}
        <ProtectionRow
          title={selectedInsurance?.name || 'No Insurance'}
          subtitle={
            selectedInsurance?.description ||
            'Insurance package for this rental'
          }
          price={formatMoney(insuranceFee)}
        />

        {/* PAYMENT SUMMARY */}
        <View style={[styles.section, { borderColor: colors.border }]}>
          <Typo variant="subheading">Payment Summary</Typo>

          <PaymentSummaryRow
            label={`Rental (${totalDays} day${totalDays > 1 ? 's' : ''} x ₦${
              car?.dailyRate ?? 0
            })`}
            amount={formatMoney(basePrice)}
          />
          <PaymentSummaryRow
            label="Insurance"
            amount={formatMoney(insuranceFee)}
          />

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <PaymentSummaryRow
            label="Total"
            amount={formatMoney(totalPrice)}
            highlight
          />
        </View>

        {/* PAYMENT METHOD */}
        {paymentMethod === 'COLLECTION' ? (
          <View style={[styles.section, { borderColor: colors.border }]}>
            <Typo variant="subheading">Payment Method</Typo>
            <View style={collectionInfoStyle}>
              <Icon name="wallet-outline" size={22} color="#0B6E4F" />
              <View style={{ flex: 1, gap: 2 }}>
                <Typo style={{ fontWeight: '600' }}>Pay on Collection</Typo>
                <Typo variant="caption" style={{ color: '#6B7280' }}>
                  Pay in cash when you arrive to pick up the car. A collection
                  code will be sent to you upon confirmation.
                </Typo>
              </View>
            </View>
          </View>
        ) : (
          <View style={[styles.section, { borderColor: colors.border }]}>
            <Typo variant="subheading">Payment Gateway</Typo>

            {paymentGateways.map(gw => (
              <TouchableOpacity
                key={gw.id}
                style={[
                  styles.gatewayRow,
                  { borderColor: colors.border, backgroundColor: colors.surface },
                  gateway === gw.id && styles.gatewayRowActive,
                ]}
                onPress={() => setGateway(gw.id)}
              >
                <View style={styles.gatewayLeft}>
                  <Image source={gw.logo} style={styles.gatewayLogo} />
                  <Typo>{gw.name}</Typo>
                </View>

                {gateway === gw.id && (
                  <Icon name="checkmark-circle" size={20} color="#0B6E4F" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* CTA */}
      <View style={[styles.bottomBar, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <AppButton
          title={
            processingPayment
              ? 'Processing...'
              : paymentMethod === 'COLLECTION'
              ? 'Confirm — Pay on Collection'
              : 'Book Vehicle'
          }
          loading={processingPayment}
          onPress={paymentMethod === 'COLLECTION' ? handlePayOnCollection : handleBookVehicle}
        />
      </View>


      <Modal
        visible={showKycActionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowKycActionModal(false)}
      >
        <View style={styles.kycModalBackdrop}>
          <View style={[styles.kycModalCard, { backgroundColor: colors.background }]}>
            <Typo variant="subheading">Complete Your KYC</Typo>
            <Typo variant="caption">
              You can browse now, but payment requires verified documents.
            </Typo>

            <AppButton
              title="Upload Documents"
              onPress={() => {
                setShowKycActionModal(false);
                navigation.navigate('KYCFlow');
              }}
            />

            <AppButton
              title="Skip for now"
              variant="outline"
              onPress={() => setShowKycActionModal(false)}
            />
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
};

export default PaymentScreen;
