import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';

import { ScreenWrapper } from '@/components/Screenwrapper/Screenwrapper';
import { Typo } from '@/components/AppText/Typo';
import { AppButton } from '@/components/AppButton/CustomButton';
import { useNavigation, useRoute } from '@react-navigation/native';
import styles from './styles';
import { fetchBookingDetails } from '@/services/booking.service';
import type { BookingDetails } from '@/services/booking.service';
import dayjs from 'dayjs';

const BookingStatusScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const bookingId: string | undefined = route?.params?.bookingId;
  const paymentMethod: string = route?.params?.paymentMethod ?? 'ONLINE';

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(!!bookingId);

  useEffect(() => {
    if (!bookingId) return;

    const load = async () => {
      try {
        const data = await fetchBookingDetails(bookingId);
        setBooking(data);
      } catch (e) {
        console.warn('[BookingStatus] Failed to load booking', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [bookingId]);

  const isCollection =
    paymentMethod === 'COLLECTION' ||
    booking?.paymentMethod === 'COLLECTION';

  const carName =
    booking?.car
      ? `${booking.car.brand} ${booking.car.model}`
      : undefined;

  const totalPrice = booking?.payment?.totalPrice;
  const rawCurrency = booking?.payment?.currency ?? 'NGN';
  const CURRENCY_SYMBOLS: Record<string, string> = { ngn: '₦', NGN: '₦', usd: '$', USD: '$', gbp: '£', GBP: '£', eur: '€', EUR: '€' };
  const currency = CURRENCY_SYMBOLS[rawCurrency] ?? rawCurrency.toUpperCase();
  const collectionCode = booking?.collectionCode;

  const pickupAt = booking?.rentalPeriod?.pickupAt
    ? dayjs(booking.rentalPeriod.pickupAt).format('D MMM YYYY')
    : undefined;
  const returnAt = booking?.rentalPeriod?.returnAt
    ? dayjs(booking.rentalPeriod.returnAt).format('D MMM YYYY')
    : undefined;

  const pickupName =
    booking?.rentalPeriod?.pickupLocation?.name ?? 'Pickup location';

  return (
    <ScreenWrapper padded={false}>
      {/* HEADER */}
      <View style={styles.header}>
        <View />
        <Typo variant="subheading">Booking Status</Typo>
        <TouchableOpacity>
          <Icon name="ellipsis-horizontal" size={22} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#0A6A4B" style={{ marginTop: 60 }} />
        ) : (
          <>
            {/* SUCCESS ICON */}
            <View style={styles.successWrap}>
              <View style={styles.successBadge}>
                <Icon name="checkmark" size={36} color="#fff" />
              </View>
            </View>

            {/* TITLE */}
            <Typo style={styles.title}>
              {isCollection
                ? 'Booking confirmed!'
                : 'Your car rental is confirmed!'}
            </Typo>

            <Typo variant="caption" style={styles.subtitle}>
              {isCollection
                ? 'Present your collection code when you arrive to pick up the car'
                : 'Your rental booking has been successfully completed. Check your rental in bookings menu'}
            </Typo>

            {/* COLLECTION CODE HIGHLIGHT */}
            {isCollection && collectionCode && (
              <View style={collectionCodeStyles.box}>
                <Typo variant="caption" style={collectionCodeStyles.label}>
                  Collection Code
                </Typo>
                <Typo style={collectionCodeStyles.code}>{collectionCode}</Typo>
                <Typo variant="caption" style={collectionCodeStyles.hint}>
                  Show this code when picking up the vehicle
                </Typo>
              </View>
            )}

            <View style={styles.divider} />

            {/* BOOKING DETAILS */}
            {bookingId && (
              <BookingDetailRow label="Booking ID" value={bookingId.slice(0, 8).toUpperCase()} />
            )}
            {carName && (
              <BookingDetailRow label="Vehicle" value={carName} />
            )}
            {typeof totalPrice === 'number' && (
              <BookingDetailRow
                label="Amount"
                value={`${currency}${totalPrice.toLocaleString()}`}
              />
            )}
            <BookingDetailRow
              label="Payment"
              value={isCollection ? 'Pay on Collection' : 'Paid Online'}
            />
            {pickupName && (
              <BookingDetailRow label="Pickup" value={pickupName} />
            )}
            {pickupAt && returnAt && (
              <BookingDetailRow
                label="Duration"
                value={`${pickupAt} → ${returnAt}`}
              />
            )}
          </>
        )}
      </ScrollView>

      {/* CTA */}
      <View style={styles.bottomBar}>
        <AppButton
          title="View My Bookings"
          onPress={() =>
            navigation.navigate('CarRentalTabs', { screen: 'Bookings' })
          }
        />
      </View>
    </ScreenWrapper>
  );
};

export default BookingStatusScreen;

/* ---------------- LOCAL COMPONENTS ---------------- */

function BookingDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Typo variant="caption" style={styles.label}>
        {label}
      </Typo>
      <Typo style={styles.value}>{value}</Typo>
    </View>
  );
}

import { StyleSheet } from 'react-native';

const collectionCodeStyles = StyleSheet.create({
  box: {
    marginTop: 24,
    width: '100%',
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#0A6A4B',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  label: {
    color: '#0A6A4B',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  code: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0A6A4B',
    letterSpacing: 6,
  },
  hint: {
    marginTop: 8,
    color: '#6B7280',
    textAlign: 'center',
  },
});
