import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { AppAlert } from '@/components/AppAlert/AppAlert';
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
import { useFormatMoney } from '@/providers/CurrencyProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { WriteReviewModal } from '@/components/Rental/WriteReviewModal/WriteReviewModal';

type RouteParams = {
  bookingId: string;
  status?: 'in_progress' | 'completed';
};

const BookingDetailsScreen = () => {
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const fmtMoney = useFormatMoney();

  const { bookingId, status = 'in_progress' } = route.params || {};
  const isCompleted = status === 'completed';

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelAlert, setCancelAlert] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

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

  const handleCancel = () => setCancelAlert(true);

  const confirmCancel = async () => {
    setCancelAlert(false);
    try {
      setCancelling(true);
      await cancelBooking(bookingId);
      showSuccess('Booking cancelled successfully');
      navigation.goBack();
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <ScreenWrapper padded={false}>
        <View style={[styles.header, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="chevron-back" size={24} color={colors.textPrimary} />
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

  // Unpaid booking that still needs an online charge — shows a big CTA
  // that jumps back into the payment sheet with this booking's id.
  const paymentPending =
    !!booking &&
    !isCollection &&
    (booking.status ?? '').toUpperCase() === 'PENDING' &&
    ['UNPAID', 'REQUIRES_ACTION', 'FAILED'].includes(
      (payment?.status ?? '').toUpperCase(),
    );

  const handleCompletePayment = () => {
    if (!bookingId) return;
    navigation.navigate('PaymentScreen' as any, {
      bookingId,
      paymentMethod: 'ONLINE',
    });
  };

  const totalDays =
    pickupAt && returnAt
      ? Math.max(1, Math.ceil((returnAt.getTime() - pickupAt.getTime()) / 86400000))
      : 1;

  const rawCurrency = payment?.currency ?? 'NGN';

  const formatMoney = (amount?: number) => fmtMoney(amount, rawCurrency, { round: true });

  return (
    <ScreenWrapper padded={false}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={[styles.header, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <Typo variant="subheading">Booking Details</Typo>

          <TouchableOpacity>
            <Icon name="ellipsis-horizontal" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* PAY-NOW BANNER — only when the booking is unpaid + online */}
        {paymentPending && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleCompletePayment}
            style={{
              margin: 16,
              padding: 14,
              borderRadius: 12,
              backgroundColor: '#FEF3C7',
              borderWidth: 1,
              borderColor: '#F59E0B',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Icon name="alert-circle" size={22} color="#B45309" />
            <View style={{ flex: 1 }}>
              <Typo style={{ fontSize: 14, fontWeight: '700', color: '#7C2D12' }}>
                Your booking isn't confirmed yet
              </Typo>
              <Typo style={{ fontSize: 12, color: '#92400E', marginTop: 2 }}>
                Complete payment to lock in this car. The reservation
                expires if left unpaid.
              </Typo>
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: '#B45309',
              }}
            >
              <Typo style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>
                {typeof payment?.totalPrice === 'number'
                  ? `Pay ${formatMoney(payment.totalPrice)}`
                  : 'Pay now'}
              </Typo>
              <Icon name="arrow-forward" size={13} color="#fff" />
            </View>
          </TouchableOpacity>
        )}

        {/* IMAGE */}
        <View>
          <Image
            source={imageSource}
            style={styles.image}
            resizeMode="cover"
          />

          <View style={[styles.imageCounter, { backgroundColor: colors.background }]}>
            <Typo variant="caption">1/{car?.images?.length ?? 1}</Typo>
          </View>
        </View>

        {/* VEHICLE INFO */}
        <View style={[styles.section, { borderColor: colors.border }]}>
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
        <View style={[styles.infoRow, { borderBottomWidth: 1, borderColor: colors.border }]}>
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
        <View style={[styles.section, { borderColor: colors.border }]}>
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
            subtitle={insurance.description || 'Protection plan'}
            price={formatMoney(payment?.protectionFeeTotal ?? payment?.insuranceFee)}
            tier={payment?.protectionTier ?? insurance.tier ?? undefined}
            deductibleLabel={
              payment?.protectionDeductibleAmount
                ? formatMoney(payment.protectionDeductibleAmount)
                : insurance.deductibleAmount
                  ? formatMoney(insurance.deductibleAmount)
                  : undefined
            }
          />
        ) : (
          <ProtectionRow
            title="No Protection"
            subtitle="Skipped — full excess is your responsibility"
            price="Free"
          />
        )}

        {/* PAYMENT SUMMARY */}
        <View style={[styles.section, { borderColor: colors.border }]}>
          <Typo variant="subheading">Payment Summary</Typo>

          <PaymentSummaryRow
            label={`Rental (${totalDays} day${totalDays > 1 ? 's' : ''})`}
            amount={formatMoney(payment?.basePrice)}
          />
          <PaymentSummaryRow
            label={payment?.protectionTier ? `Protection · ${payment.protectionTier}` : 'Protection'}
            amount={formatMoney(payment?.protectionFeeTotal ?? payment?.insuranceFee)}
          />
          {booking?.addons?.map(line => (
            <PaymentSummaryRow
              key={line.id}
              label={line.quantity > 1 ? `${line.name} × ${line.quantity}` : line.name}
              amount={formatMoney(line.lineTotal)}
            />
          ))}
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
          <View style={[styles.section, { borderColor: colors.border }]}>
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
          <View style={[styles.section, { borderColor: colors.border }]}>
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
        <View style={[styles.section, { borderColor: colors.border }]}>
          <Typo variant="subheading">Rental Policies</Typo>

          <PolicyItem
            title="Cancellation"
            value="Free cancellation up to 24 hours before pickup"
          />
          <PolicyItem title="Fuel Policy" value="Full to Full" />
          <PolicyItem title="Mileage" value="Unlimited mileage included" />
        </View>

        {/* LEAVE A REVIEW */}
        {booking?.status === 'COMPLETED' && booking?.car?.id ? (
          booking.hasReview ? (
            <View style={[styles.section, { borderColor: colors.border }]}>
              <View style={leaveReviewStyles.row}>
                <View style={[leaveReviewStyles.iconWrap, { backgroundColor: '#F0FDF4' }]}>
                  <Icon name="checkmark-circle" size={20} color="#16A34A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Typo style={[leaveReviewStyles.title, { color: colors.textPrimary }]}>
                    Review submitted
                  </Typo>
                  <Typo style={[leaveReviewStyles.hint, { color: colors.textSecondary }]}>
                    Thanks for sharing your experience.
                  </Typo>
                </View>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.section, { borderColor: colors.border }]}
              onPress={() => setReviewOpen(true)}
            >
              <View style={leaveReviewStyles.row}>
                <View style={[leaveReviewStyles.iconWrap, { backgroundColor: '#FFFBEB' }]}>
                  <Icon name="star" size={20} color="#D97706" />
                </View>
                <View style={{ flex: 1 }}>
                  <Typo style={[leaveReviewStyles.title, { color: colors.textPrimary }]}>
                    Rate your trip
                  </Typo>
                  <Typo style={[leaveReviewStyles.hint, { color: colors.textSecondary }]}>
                    Share how this car and provider went for you.
                  </Typo>
                </View>
                <Icon name="chevron-forward" size={18} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>
          )
        ) : null}

        {/* CANCEL BOOKING */}
        {!isCompleted && booking?.status !== 'CANCELLED' && booking?.status !== 'COMPLETED' && (
          <View style={[styles.section, { borderColor: colors.border }]}>
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
          <View style={[styles.section, { borderColor: colors.border }]}>
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

      <AppAlert
        visible={cancelAlert}
        title="Cancel Booking"
        message="Are you sure you want to cancel this booking?"
        buttons={[
          { text: 'No', style: 'cancel', onPress: () => setCancelAlert(false) },
          { text: 'Yes, Cancel', style: 'destructive', onPress: confirmCancel },
        ]}
        onDismiss={() => setCancelAlert(false)}
      />

      {booking?.car?.id ? (
        <WriteReviewModal
          visible={reviewOpen}
          carId={booking.car.id}
          bookingId={booking.id}
          carTitle={
            booking.car.brand && booking.car.model
              ? `${booking.car.brand} ${booking.car.model}`
              : undefined
          }
          onClose={() => setReviewOpen(false)}
          onSubmitted={async () => {
            // Refetch booking so hasReview flips to true and the prompt
            // collapses into the "Review submitted" confirmation row.
            try {
              const fresh = await fetchBookingDetails(bookingId);
              setBooking(fresh);
            } catch {
              // non-fatal
            }
          }}
        />
      ) : null}
    </ScreenWrapper>
  );
};

const leaveReviewStyles = {
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    paddingVertical: 4,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  title: { fontSize: 14, fontWeight: '700' as const },
  hint: { fontSize: 12, marginTop: 2, lineHeight: 16 },
};

export default BookingDetailsScreen;
