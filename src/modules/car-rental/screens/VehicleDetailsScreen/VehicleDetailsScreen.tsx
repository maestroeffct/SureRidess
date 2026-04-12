import React, { useEffect, useMemo, useState } from 'react';
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
import styles from './style';
import { Section } from '@/components/SectionHeader/SectionHeader';
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
import { getCarWithFeatures } from '@/services/rental.service';
import { Tag } from '@/components/Rental/Tag/Tag';

const VehicleDetailsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const routeCar: RentalCar | undefined = route?.params?.car;
  const vehicleId: string | undefined = route?.params?.vehicleId;
  const search = route?.params?.search;
  const pickupLocationId = route?.params?.pickupLocationId;
  const dropoffLocationId = route?.params?.dropoffLocationId;
  const pickupLocationName = route?.params?.pickupLocationName;
  const dropoffLocationName = route?.params?.dropoffLocationName;
  const [insurance, setInsurance] = useState('none');
  const [payment, setPayment] = useState<'collection' | 'online'>('collection');
  const [car, setCar] = useState<RentalCar | undefined>(routeCar);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    if (routeCar) {
      setCar(routeCar);
    }
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

  const formatLabel = (value?: string) => {
    if (!value) return '';
    return value
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/(^\w|\s\w)/g, m => m.toUpperCase());
  };

  const images = (car?.images ?? []) as Array<
    | { url?: string; imageUrl?: string; path?: string; isPrimary?: boolean }
    | string
  >;
  const imageUrls = images
    .map(img =>
      typeof img === 'string' ? img : img.url ?? img.imageUrl ?? img.path,
    )
    .filter((url): url is string => !!url);
  const fallbackImage =
    'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=600';
  const displayImages = imageUrls.length > 0 ? imageUrls : [fallbackImage];
  const title =
    car?.brand && car?.model ? `${car.brand} ${car.model}` : 'Vehicle Details';
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

  const normalizeFeatures = (
    items?: Array<RentalCarFeature | RentalCarFeatureLink>,
  ): RentalCarFeature[] => {
    if (!items) return [];
    return items
      .map(item => ('feature' in item ? item.feature : item))
      .filter(Boolean) as RentalCarFeature[];
  };

  const allFeatures: RentalCarFeature[] = useMemo(() => {
    if (car?.features?.length) return normalizeFeatures(car.features);
    if (car?.groupedFeatures) return Object.values(car.groupedFeatures).flat();
    return [];
  }, [car?.features, car?.groupedFeatures]);

  const safetyFeatures =
    car?.groupedFeatures?.SAFETY ??
    allFeatures.filter(f => f.category === 'SAFETY');

  const includeFeatures =
    car?.groupedFeatures?.COMFORT ??
    allFeatures.filter(f => f.category === 'COMFORT');

  const pickupAt = search?.pickupAt ? new Date(search.pickupAt) : null;
  const returnAt = search?.returnAt ? new Date(search.returnAt) : null;
  const totalDays =
    pickupAt && returnAt
      ? Math.max(
          1,
          Math.ceil((returnAt.getTime() - pickupAt.getTime()) / 86400000),
        )
      : 1;
  const totalPrice =
    car?.dailyRate && totalDays ? car.dailyRate * totalDays : undefined;

  const hasBookingData =
    !!search?.pickupAt &&
    !!search?.returnAt &&
    !!(pickupLocationId || car?.location?.id);

  const handleProceedToPayment = () => {
    if (!hasBookingData) {
      // No dates/location selected — send them to SearchLocation with this car locked
      navigation.navigate('CarRentalFlowNavigator', {
        screen: 'SearchLocation',
        params: {
          lockedCarId: vehicleId || car?.id,
          lockedCar: car,
          insuranceId: insurance === 'none' ? undefined : insurance,
          paymentMethod: payment === 'collection' ? 'COLLECTION' : 'ONLINE',
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
      paymentMethod: payment === 'collection' ? 'COLLECTION' : 'ONLINE',
    });
  };

  const insurancePackages: RentalInsurancePackage[] =
    car?.insurancePackages ?? [];

  const formatMoney = (amount?: number) => {
    if (typeof amount !== 'number') return 'Free';
    return `₦${amount.toLocaleString()}`;
  };

  const formatInsurancePrice = (pkg: RentalInsurancePackage) => {
    if (typeof pkg.dailyRate === 'number') {
      return `${formatMoney(pkg.dailyRate)} / Day`;
    }
    if (typeof pkg.price === 'number') return formatMoney(pkg.price);
    if (typeof pkg.amount === 'number') return formatMoney(pkg.amount);
    return 'Free';
  };

  return (
    <ScreenWrapper padded={false}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={24} />
        </TouchableOpacity>

        <Typo variant="subheading">Vehicle Details</Typo>

        <TouchableOpacity>
          <Icon name="ellipsis-horizontal" size={22} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        {/* IMAGE CAROUSEL */}
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
            {!!categoryLabel && <Tag label={categoryLabel} />}
            {!!transmissionLabel && <Tag label={transmissionLabel} />}
            {!!seatsLabel && <Tag label={seatsLabel} icon="people-outline" />}
            {!!hasAcLabel && <Tag label={hasAcLabel} />}
            {!!mileageLabel && <Tag label={mileageLabel} />}
          </View>
        </View>

        {/* PROVIDER */}
        <View style={styles.provider}>
          <View style={styles.providerLeft}>
            <View style={styles.providerLogo}>
              <Typo style={styles.providerText}>
                {car?.provider?.name?.slice(0, 4).toUpperCase() || 'PROV'}
              </Typo>
            </View>

            <View>
              <Typo>{car?.provider?.name || 'Provider'}</Typo>
              <Typo variant="caption">
                {car?.provider?.isVerified
                  ? 'Verified provider'
                  : 'Rental service'}
              </Typo>
            </View>
          </View>

          {car?.provider?.isVerified && (
            <Icon name="checkmark-circle" size={22} color="#0B6E4F" />
          )}
        </View>

        {/* INCLUDES */}
        <Section title="This Booking Includes">
          {includeFeatures?.length
            ? includeFeatures
                .slice(0, 3)
                .map(feature => (
                  <CheckItem key={feature.id} label={feature.name} />
                ))
            : allFeatures
                .slice(0, 3)
                .map(feature => (
                  <CheckItem key={feature.id} label={feature.name} />
                ))}
          {allFeatures.length === 0 && (
            <>
              <CheckItem label="Vehicle Protection" />
              <CheckItem label="Theft Protection" />
              <CheckItem label="Third-Part Protection" />
            </>
          )}
        </Section>

        <InfoText label="Useful information for your booking" />

        {/* SAFETY */}
        <Section title="Safety and Security">
          {safetyFeatures?.length
            ? safetyFeatures
                .slice(0, 3)
                .map(feature => (
                  <CheckItem key={feature.id} label={feature.name} />
                ))
            : allFeatures
                .slice(0, 3)
                .map(feature => (
                  <CheckItem key={feature.id} label={feature.name} />
                ))}
          {allFeatures.length === 0 && (
            <>
              <CheckItem label="ABS Braking System" />
              <CheckItem label="Airbags (Front & Side)" />
              <CheckItem label="GPS Tracking" />
            </>
          )}
        </Section>

        {/* INSURANCE */}
        <Section title="Insurance Packages">
          <InsuranceCard
            title="No Insurance"
            price="Free"
            selected={insurance === 'none'}
            onPress={() => setInsurance('none')}
            description="If you prefer not to include any insurance package for this rental"
          />

          {insurancePackages.length > 0 ? (
            insurancePackages.map(pkg => (
              <InsuranceCard
                key={pkg.id}
                title={pkg.name}
                price={formatInsurancePrice(pkg)}
                selected={insurance === pkg.id}
                onPress={() => setInsurance(pkg.id)}
                description={
                  pkg.description || 'Insurance package provided by the host'
                }
              />
            ))
          ) : (
            <InfoText label="No insurance packages available for this car." />
          )}
        </Section>

        {/* PICKUP / DROP-OFF */}
        <Section title="Pick-up and Drop-off">
          <TimelineLocation
            icon="location"
            color="#0B6E4F"
            date={
              pickupAt
                ? `${formatDate(pickupAt)} at ${formatTime(pickupAt)}`
                : ''
            }
            place={pickupLocationName || locationName}
            address={locationAddress || 'Pickup location'}
          />

          <TimelineLocation
            icon="location"
            color="#F59E0B"
            date={
              returnAt
                ? `${formatDate(returnAt)} at ${formatTime(returnAt)}`
                : ''
            }
            place={dropoffLocationName || locationName}
            address={locationAddress || 'Drop-off location'}
          />
        </Section>

        {/* PAYMENT METHOD */}
        <Section title="Payment Method">
          <PaymentOption
            icon="wallet-outline"
            label="Pay on Collection"
            subtitle="Pay in cash when you pick up the car"
            selected={payment === 'collection'}
            onPress={() => setPayment('collection')}
          />
          <PaymentOption
            icon="card-outline"
            label="Pay Online"
            subtitle="Secure payment via card or bank transfer"
            selected={payment === 'online'}
            onPress={() => setPayment('online')}
          />
        </Section>
      </ScrollView>

      {/* FIXED BOTTOM BAR */}
      <View style={styles.bottomBar}>
        <View style={styles.priceInfo}>
          <Typo variant="caption" style={styles.priceLabel}>
            Total Price
          </Typo>
          <Typo style={styles.priceAmount}>
            {totalPrice ? `₦${totalPrice.toLocaleString()}` : '—'}
          </Typo>
          {totalDays > 0 && car?.dailyRate && (
            <Typo variant="caption" style={styles.priceSub}>
              {totalDays} day{totalDays !== 1 ? 's' : ''} ·{' '}
              ₦{car.dailyRate.toLocaleString()}/day
            </Typo>
          )}
        </View>

        <AppButton
          title="Book Now"
          onPress={handleProceedToPayment}
          style={styles.bookBtn}
        />
      </View>
    </ScreenWrapper>
  );
};

export default VehicleDetailsScreen;

/* ---------------- LOCAL COMPONENT ---------------- */

function PaymentOption({
  icon,
  label,
  subtitle,
  selected,
  onPress,
}: {
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.paymentCard, selected && styles.paymentCardSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View
        style={[styles.paymentIcon, selected && styles.paymentIconSelected]}
      >
        <Icon
          name={icon}
          size={20}
          color={selected ? '#0B6E4F' : '#6B7280'}
        />
      </View>

      <View style={styles.paymentInfo}>
        <Typo style={selected ? styles.paymentLabelSelected : undefined}>
          {label}
        </Typo>
        <Typo variant="caption" style={styles.paymentSubtitle}>
          {subtitle}
        </Typo>
      </View>

      <View
        style={[styles.paymentCheck, selected && styles.paymentCheckSelected]}
      >
        {selected && <Icon name="checkmark" size={13} color="#fff" />}
      </View>
    </TouchableOpacity>
  );
}
