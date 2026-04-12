import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import dayjs from 'dayjs';

import { ScreenWrapper } from '@/components/Screenwrapper/Screenwrapper';
import { Typo } from '@/components/AppText/Typo';
import styles from './styles';
import { ProviderRow } from '@/components/Rental/ProviderRow/ProviderRow';
import { RentalPoint } from '@/components/Rental/RentalPoint/RentalPoint';
import { ProtectionRow } from '@/components/Rental/ProtectionRow/ProtectionRow';
import { PaymentSummaryRow } from '@/components/Rental/PaymentSummaryRow/PaymentSummaryRow';
import { CardPaymentRow } from '@/components/Rental/CardPaymentRow/CardPaymentRow';
import { HelpItem, PolicyItem } from '@/components/Rental/PolicyItem/Policy';
import { Tag } from '@/components/Rental/Tag/Tag';
import {
  fetchBookingDetails,
  cancelBooking,
  type BookingDetails,
} from '@/services/booking.service';
import { showError, showSuccess } from '@/helpers/toast';

type RouteParams = {
  bookingId: string;
  status?: 'in_progress' | 'completed';
};

const BookingDetailsScreen = () => {
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const navigation = useNavigation<any>();

  const { bookingId, status = 'in_progress' } = route.params || {};
  const isCompleted = status === 'completed';

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!bookingId) return;

    const load = async () => {
      try {
        const data = await fetchBookingDetails(bookingId);
        setBooking(data);
      } catch (e) {
        console.warn('[BookingDetails] Failed to load booking', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [bookingId]);

  const formatLabel = (value?: string) => {
    if (!value) return '';
    return value
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/(^\w|\s\w)/g, m => m.toUpperCase());
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelling(true);
              await cancelBooking(bookingId);
              showSuccess('Booking cancelled successfully');
              navigation.goBack();
            } catch (error: any) {
              showError(
                error?.response?.data?.message || 'Failed to cancel booking',
              );
            } finally {
              setCancelling(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <ScreenWrapper padded={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="chevron-back" size={24} />
          </TouchableOpacity>
          <Typo variant="subheading">Booking Details</Typo>
          <View style={{ width: 24 }} />
        </View>
        <ActivityIndicator
          size="large"
          color="#0A6A4B"
          style={{ marginTop: 80 }}
        />
      </ScreenWrapper>
    );
  }

  const car = booking?.car;
  const provider = booking?.provider;
  const rentalPeriod = booking?.rentalPeriod;
  const payment = booking?.payment;
  const insurance = booking?.insurance;

  const carName =
    car?.brand && car?.model ? `${car.brand} ${car.model}` : 'Vehicle';
  const primaryImage =
    car?.images?.find(img => img.isPrimary)?.url ?? car?.images?.[0]?.url;
  const imageSource = primaryImage
    ? { uri: primaryImage }
    : {
        uri: 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=600',
      };

  const pickupAt = rentalPeriod?.pickupAt ? new Date(rentalPeriod.pickupAt) : null;
  const returnAt = rentalPeriod?.returnAt ? new Date(rentalPeriod.returnAt) : null;
  const pickupName = rentalPeriod?.pickupLocation?.name ?? 'Pickup location';
  const pickupAddress = rentalPeriod?.pickupLocation?.address ?? '';

  const isCollection = booking?.paymentMethod === 'COLLECTION';
  const collectionCode = booking?.collectionCode;

  const totalDays =
    pickupAt && returnAt
      ? Math.max(1, Math.ceil((returnAt.getTime() - pickupAt.getTime()) / 86400000))
      : 1;

  const CURRENCY_SYMBOLS: Record<string, string> = { ngn: '₦', NGN: '₦', usd: '$', USD: '$', gbp: '£', GBP: '£', eur: '€', EUR: '€' };
  const rawCurrency = payment?.currency ?? 'NGN';
  const currency = CURRENCY_SYMBOLS[rawCurrency] ?? rawCurrency.toUpperCase();

  const formatMoney = (amount?: number) =>
    typeof amount === 'number' ? `${currency}${amount.toLocaleString()}` : '—';

  return (
    <ScreenWrapper padded={false}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="chevron-back" size={24} />
          </TouchableOpacity>

          <Typo variant="subheading">Booking Details</Typo>

          <TouchableOpacity>
            <Icon name="ellipsis-horizontal" size={20} />
          </TouchableOpacity>
        </View>

        {/* IMAGE */}
        <View>
          <Image
            source={imageSource}
            style={styles.image}
            resizeMode="cover"
          />

          <View style={styles.imageCounter}>
            <Typo variant="caption">1/{car?.images?.length ?? 1}</Typo>
          </View>
        </View>

        {/* VEHICLE INFO */}
        <View style={styles.section}>
          <Typo style={styles.vehicleName}>{carName}</Typo>

          <View style={styles.locationRow}>
            <Icon name="location-outline" size={16} />
            <Typo variant="caption">{pickupName}</Typo>
          </View>

          <View style={styles.tagsRow}>
            {!!car?.category && <Tag label={formatLabel(car.category)} />}
            {!!car?.transmission && <Tag label={formatLabel(car.transmission)} />}
            {typeof car?.seats === 'number' && <Tag label={String(car.seats)} icon="people-outline" />}
            {typeof car?.hasAC === 'boolean' && (
              <Tag label={car.hasAC ? 'A/C' : 'No A/C'} />
            )}
            {!!car?.mileagePolicy && (
              <Tag label={`${formatLabel(car.mileagePolicy)} Mileage`} />
            )}
          </View>
        </View>

        {/* PROVIDER */}
        <ProviderRow
          name={provider?.name || 'Provider'}
          description="Professional rental service"
          verified
        />

        {/* BOOKING ID */}
        <View style={styles.infoRow}>
          <Typo variant="caption">Booking</Typo>
          <Typo>{bookingId?.slice(0, 8).toUpperCase()}</Typo>
        </View>

        {/* COLLECTION CODE */}
        {!isCompleted && isCollection && collectionCode && (
          <View style={styles.pickupCode}>
            <Typo variant="caption">Collection Code:</Typo>
            <Typo style={styles.pickupValue}>{collectionCode}</Typo>
          </View>
        )}

        {/* RENTAL PERIOD */}
        <View style={styles.section}>
          <Typo variant="subheading">Rental Period</Typo>

          <RentalPoint
            label="Pick-Up"
            color="#22C55E"
            location={pickupName}
            date={pickupAt ? dayjs(pickupAt).format('dddd, D MMMM YYYY') : ''}
            time={pickupAt ? dayjs(pickupAt).format('HH:mm') : ''}
            note={pickupAddress || undefined}
          />

          <RentalPoint
            label="Drop-Off"
            color="#EF4444"
            location={pickupName}
            date={returnAt ? dayjs(returnAt).format('dddd, D MMMM YYYY') : ''}
            time={returnAt ? dayjs(returnAt).format('HH:mm') : ''}
          />
        </View>

        {/* PROTECTION */}
        {insurance ? (
          <ProtectionRow
            title={insurance.name}
            subtitle={insurance.description || 'Insurance package'}
            price={formatMoney(
              insurance.dailyPrice
                ? insurance.dailyPrice * totalDays
                : undefined,
            )}
          />
        ) : (
          <ProtectionRow
            title="No Insurance"
            subtitle="No insurance added to this booking"
            price="Free"
          />
        )}

        {/* PAYMENT SUMMARY */}
        <View style={styles.section}>
          <Typo variant="subheading">Payment Summary</Typo>

          <PaymentSummaryRow
            label={`Rental (${totalDays} day${totalDays > 1 ? 's' : ''})`}
            amount={formatMoney(payment?.basePrice)}
          />
          <PaymentSummaryRow
            label="Insurance"
            amount={formatMoney(payment?.insuranceFee)}
          />
          {(payment?.taxAmount ?? 0) > 0 && (
            <PaymentSummaryRow
              label="Tax"
              amount={formatMoney(payment?.taxAmount)}
            />
          )}

          <View style={styles.totalRow}>
            <Typo>Total</Typo>
            <Typo style={styles.total}>
              {formatMoney(payment?.totalPrice)}
            </Typo>
          </View>
        </View>

        {/* PAYMENT METHOD */}
        {isCollection ? (
          <View style={styles.section}>
            <CardPaymentRow
              brand="Collection"
              last4=""
              status={payment?.status === 'UNPAID' ? 'Pay on Collection' : 'Paid'}
              date={
                payment?.paidAt
                  ? `Paid on ${dayjs(payment.paidAt).format('DD/MM/YYYY HH:mm')}`
                  : 'Payment due at pickup'
              }
            />
          </View>
        ) : (
          <CardPaymentRow
            brand={payment?.provider || 'Card'}
            last4=""
            status={payment?.status === 'SUCCEEDED' ? 'Paid' : payment?.status ?? ''}
            date={
              payment?.paidAt
                ? `Paid on ${dayjs(payment.paidAt).format('DD/MM/YYYY HH:mm')}`
                : ''
            }
          />
        )}

        {/* DOWNLOAD RECEIPT */}
        {isCompleted && (
          <View style={styles.section}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.receiptBtn}
              onPress={() => {
                // TODO: download / open PDF receipt
              }}
            >
              <Icon name="download-outline" size={20} color="#0A6A4B" />
              <Typo style={styles.receiptText}>Download Receipt</Typo>
            </TouchableOpacity>
          </View>
        )}

        {/* POLICIES */}
        <View style={styles.section}>
          <Typo variant="subheading">Rental Policies</Typo>

          <PolicyItem
            title="Cancellation"
            value="Free cancellation up to 24 hours before pickup"
          />
          <PolicyItem title="Fuel Policy" value="Full to Full" />
          <PolicyItem title="Mileage" value="Unlimited mileage included" />
        </View>

        {/* CANCEL BOOKING */}
        {!isCompleted && booking?.status !== 'CANCELLED' && (
          <View style={styles.section}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.cancelBtn}
              onPress={handleCancel}
              disabled={cancelling}
            >
              <Icon name="close-circle-outline" size={20} color="#DC2626" />
              <Typo style={styles.cancelText}>
                {cancelling ? 'Cancelling...' : 'Cancel Booking'}
              </Typo>
            </TouchableOpacity>
          </View>
        )}

        {/* HELP */}
        {!isCompleted && (
          <View style={styles.section}>
            <Typo variant="subheading">Need Help?</Typo>

            {provider?.phone && (
              <HelpItem icon="call-outline" label={`Call ${provider.name}`} />
            )}
            <HelpItem icon="mail-outline" label="Email Support" />
            <HelpItem icon="navigate-outline" label="Get Directions" />
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenWrapper>
  );
};

export default BookingDetailsScreen;
