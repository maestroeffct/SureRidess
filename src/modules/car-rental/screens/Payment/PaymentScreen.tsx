import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
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
import { Tag } from '@/components/Rental/Tag/Tag';

const PaymentScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const routeCar: RentalCar | undefined = route?.params?.car;
  const vehicleId: string | undefined = route?.params?.vehicleId;
  const search = route?.params?.search;
  const pickupLocationName = route?.params?.pickupLocationName;
  const dropoffLocationName = route?.params?.dropoffLocationName;
  const insuranceId: string | undefined = route?.params?.insuranceId;
  const [car, setCar] = useState<RentalCar | undefined>(routeCar);
  const [gateway, setGateway] = useState<'stripe' | 'flutterwave'>('stripe');
  const [activeImageIndex, setActiveImageIndex] = useState(0);

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

  return (
    <ScreenWrapper padded={false}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={24} />
        </TouchableOpacity>

        <Typo variant="subheading">Payment</Typo>

        <TouchableOpacity>
          <Icon name="ellipsis-horizontal" size={22} />
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
        <View style={styles.section}>
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
        <View style={styles.section}>
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
        <View style={styles.section}>
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
        <View style={styles.section}>
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

          <View style={styles.divider} />

          <PaymentSummaryRow
            label="Total"
            amount={formatMoney(totalPrice)}
            highlight
          />
        </View>

        {/* PAYMENT METHOD */}
        <View style={styles.section}>
          <Typo variant="subheading">Payment Gateway</Typo>

          {paymentGateways.map(gw => (
            <TouchableOpacity
              key={gw.id}
              style={[
                styles.gatewayRow,
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

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* CTA */}
      <View style={styles.bottomBar}>
        <AppButton
          title="Book Vehicle"
          onPress={() =>
            navigation.navigate('BookingStatus', { status: 'success' })
          }
        />
      </View>
    </ScreenWrapper>
  );
};

export default PaymentScreen;
