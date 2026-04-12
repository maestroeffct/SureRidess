import React from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import { Typo } from '@/components/AppText/Typo';
import styles from './styles';
import { BookingLocationRow } from '../BookingLocationRow/BookingLocationRow';
import dayjs from 'dayjs';

const CURRENCY_SYMBOLS: Record<string, string> = {
  ngn: '₦', NGN: '₦',
  usd: '$',  USD: '$',
  gbp: '£',  GBP: '£',
  eur: '€',  EUR: '€',
  ghs: '₵',  GHS: '₵',
};

function formatMoney(amount: number, currency = 'NGN') {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency.toUpperCase() + ' ';
  return `${symbol}${amount.toLocaleString()}`;
}

const FALLBACK_IMAGE =
  'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=600';

type Props = {
  onPress: () => void;
  bookingId: string;
  carName: string;
  imageUrl?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  pickupAt?: string;
  returnAt?: string;
  collectionCode?: string;
  status?: string;
  totalPrice?: number;
  /** ISO 4217 code e.g. "NGN", "ngn" — mapped to symbol automatically */
  currency?: string;
};

export const BookingCard = ({
  onPress,
  bookingId,
  carName,
  imageUrl,
  pickupLocation,
  dropoffLocation,
  pickupAt,
  returnAt,
  collectionCode,
  status,
  totalPrice,
  currency = 'NGN',
}: Props) => {
  const pickup = pickupAt ? dayjs(pickupAt) : null;
  const ret = returnAt ? dayjs(returnAt) : null;
  const days =
    pickup && ret ? Math.max(1, ret.diff(pickup, 'day')) : null;

  const statusColor: Record<string, string> = {
    PENDING: '#F59E0B',
    CONFIRMED: '#0A6A4B',
    COMPLETED: '#6B7280',
    CANCELLED: '#EF4444',
  };

  const displayStatus = status ?? 'PENDING';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.card}
    >
      {/* HEADER */}
      <View style={styles.codeRow}>
        {collectionCode ? (
          <>
            <Typo variant="caption">Pickup code:</Typo>
            <Typo style={styles.code}>{collectionCode}</Typo>
          </>
        ) : (
          <>
            <Typo variant="caption">Status:</Typo>
            <Typo
              style={[
                styles.code,
                { color: statusColor[displayStatus] ?? '#0A6A4B' },
              ]}
            >
              {displayStatus}
            </Typo>
          </>
        )}
      </View>

      {/* BODY */}
      <View style={styles.body}>
        <Image
          source={{ uri: imageUrl ?? FALLBACK_IMAGE }}
          style={styles.image}
        />

        <View style={styles.details}>
          <Typo style={styles.title}>{carName}</Typo>

          {pickupLocation && (
            <BookingLocationRow color="#10B981" location={pickupLocation} />
          )}
          {dropoffLocation && (
            <BookingLocationRow color="#EF4444" location={dropoffLocation} />
          )}
        </View>
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <View>
          {pickup && (
            <Typo variant="caption">
              {pickup.format('D MMM YYYY')} at {pickup.format('h:mma')}
            </Typo>
          )}
          {ret && (
            <Typo variant="caption">
              {ret.format('D MMM YYYY')} at {ret.format('h:mma')}
            </Typo>
          )}
        </View>

        <View style={styles.meta}>
          {days !== null && (
            <Typo variant="caption">
              {days} day{days !== 1 ? 's' : ''}
            </Typo>
          )}
          {typeof totalPrice === 'number' && (
            <Typo style={styles.bookingId}>
              {formatMoney(totalPrice, currency)}
            </Typo>
          )}
          <Typo style={[styles.bookingId, { fontSize: 11, color: '#9CA3AF' }]}>
            #{bookingId.slice(0, 8).toUpperCase()}
          </Typo>
        </View>
      </View>
    </TouchableOpacity>
  );
};
