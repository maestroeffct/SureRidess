import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { AppAlert } from '@/components/AppAlert/AppAlert';
import Icon from '@react-native-vector-icons/ionicons';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import dayjs from 'dayjs';

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
import { PickupReturnChain } from '@/components/Rental/PickupReturnChain/PickupReturnChain';

type RouteParams = {
  bookingId: string;
  status?: 'in_progress' | 'completed';
};

const GREEN = '#0A6A4B';
const HERO_H = 260;
const SW = Dimensions.get('window').width;

const BookingDetailsScreen = () => {
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const fmtMoney = useFormatMoney();

  const { bookingId, status = 'in_progress' } = route.params || {};
  const isCompleted = status === 'completed';

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelAlert, setCancelAlert] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  const load = useCallback(async () => {
    if (!bookingId) return;
    try {
      const data = await fetchBookingDetails(bookingId);
      setBooking(data);
    } catch (e) {
      console.warn('[BookingDetails] Failed to load booking', e);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

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
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 16 }}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="chevron-back" size={26} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <ActivityIndicator size="large" color={GREEN} style={{ marginTop: 80 }} />
      </View>
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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: paymentPending ? 140 : 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[GREEN]}
          />
        }
      >
        {/* ── HERO ── */}
        <View style={hero.wrap}>
          <Image source={imageSource} style={hero.img} resizeMode="cover" />
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(0,0,0,0.55)', 'transparent']}
            style={[hero.gradTop, { height: insets.top + 60 }]}
          />
          <LinearGradient
            pointerEvents="none"
            colors={['transparent', 'rgba(0,0,0,0.85)']}
            style={hero.gradBottom}
          />

          <TouchableOpacity
            style={[hero.backBtn, { top: insets.top + 10 }]}
            onPress={() => navigation.goBack()}
          >
            <Icon name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View pointerEvents="box-none" style={[hero.title, { top: insets.top + 14 }]}>
            <Typo style={hero.titleText}>Booking Details</Typo>
          </View>

          <View style={hero.counterPill}>
            <Typo style={hero.counterText}>1/{car?.images?.length ?? 1}</Typo>
          </View>

          {/* Car name + tags overlay */}
          <View pointerEvents="none" style={hero.info}>
            <Typo style={hero.name}>{carName}</Typo>
            <View style={hero.locationRow}>
              <Icon name="location-outline" size={13} color="rgba(255,255,255,0.9)" />
              <Typo style={hero.locationText}>{pickupName}</Typo>
            </View>
            <View style={hero.tagsRow}>
              {!!car?.transmission && (
                <View style={hero.tag}>
                  <Typo style={hero.tagText}>{formatLabel(car.transmission)}</Typo>
                </View>
              )}
              {typeof car?.seats === 'number' && (
                <View style={hero.tag}>
                  <Typo style={hero.tagText}>{car.seats} Seats</Typo>
                </View>
              )}
              {typeof car?.hasAC === 'boolean' && (
                <View style={hero.tag}>
                  <Typo style={hero.tagText}>{car.hasAC ? 'A/C' : 'No A/C'}</Typo>
                </View>
              )}
              {!!car?.mileagePolicy && (
                <View style={hero.tag}>
                  <Typo style={hero.tagText}>{formatLabel(car.mileagePolicy)} mileage</Typo>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* PROVIDER */}
        <ProviderRow
          name={provider?.name || 'Provider'}
          description="Professional rental service"
          verified
        />

        {/* TWO-TAP PICKUP / RETURN CHAIN — timeline strip + contextual
             card (waiting → code → confirm → in-trip → returned → done) */}
        {!isCollection && booking && (
          <PickupReturnChain
            booking={booking}
            onChanged={load}
          />
        )}

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

        {/* HANDOVER SIGNATURES — one card per PICKUP / RETURN row the
             provider has already saved. Shows a big blue "Confirm & sign"
             button when the customer hasn't signed yet; otherwise a
             "Signed on <date>" pill so they know it's on the record. */}
        {!!booking?.handovers?.length &&
          (booking.status === 'CONFIRMED' ||
            booking.status === 'COMPLETED') &&
          booking.handovers.map(h => {
            const isSigned = !!h.customerSignatureUrl;
            const typeLabel = h.type === 'PICKUP' ? 'Pick-up' : 'Return';
            return (
              <View
                key={h.id}
                style={[styles.section, { borderColor: colors.border }]}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <Typo variant="subheading">{typeLabel} inspection</Typo>
                  {isSigned && (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 999,
                        backgroundColor: '#DCFCE7',
                      }}
                    >
                      <Icon
                        name="checkmark-circle"
                        size={14}
                        color="#166534"
                      />
                      <Typo
                        style={{
                          color: '#166534',
                          fontSize: 11,
                          fontWeight: '700',
                        }}
                      >
                        Signed{' '}
                        {h.customerSignedAt
                          ? dayjs(h.customerSignedAt).format('DD MMM, HH:mm')
                          : ''}
                      </Typo>
                    </View>
                  )}
                </View>

                {isSigned ? (
                  <Typo
                    style={{ fontSize: 12, color: colors.textSecondary }}
                  >
                    Thanks — your signature is on file for this inspection.
                  </Typo>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() =>
                      navigation.navigate('HandoverSign', {
                        bookingId: booking.id,
                        type: h.type,
                        carName,
                      })
                    }
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      backgroundColor: '#2563EB',
                      paddingVertical: 14,
                      borderRadius: 12,
                    }}
                  >
                    <Icon
                      name="create-outline"
                      size={18}
                      color="#fff"
                    />
                    <Typo
                      style={{
                        color: '#fff',
                        fontWeight: '700',
                        fontSize: 14,
                      }}
                    >
                      Confirm & sign {typeLabel.toLowerCase()} inspection
                    </Typo>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}

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

      {/* ── STICKY BOTTOM BAR — main action for the current state ── */}
      {paymentPending && (
        <View
          style={[
            bottomBar.wrap,
            {
              paddingBottom: insets.bottom + 12,
              backgroundColor: colors.background,
              borderTopColor: colors.border,
            },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Typo style={[bottomBar.hint, { color: colors.textSecondary }]}>
              Reservation expires if unpaid
            </Typo>
            <Typo style={bottomBar.total}>
              {typeof payment?.totalPrice === 'number'
                ? formatMoney(payment.totalPrice)
                : ''}
            </Typo>
          </View>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleCompletePayment}
            style={bottomBar.btn}
          >
            <Typo style={bottomBar.btnText}>Complete payment</Typo>
            <Icon name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

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
    </View>
  );
};

/* ── Hero styles matching Payment/Checkout screen ── */
const hero = StyleSheet.create({
  wrap: { height: HERO_H, backgroundColor: '#111', overflow: 'hidden' },
  img: { width: SW, height: HERO_H },
  gradTop: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 },
  gradBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 130, zIndex: 1,
  },
  backBtn: {
    position: 'absolute', left: 16, zIndex: 2,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { position: 'absolute', left: 0, right: 0, zIndex: 2, alignItems: 'center' },
  titleText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  counterPill: {
    position: 'absolute', right: 16, top: 60, zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4,
  },
  counterText: { fontSize: 12, color: '#fff', fontWeight: '600' },
  info: {
    position: 'absolute', bottom: 14, left: 16, right: 16, zIndex: 2, gap: 6,
  },
  name: { fontSize: 22, fontWeight: '800', color: '#fff' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 12, color: 'rgba(255,255,255,0.9)' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  tagText: { fontSize: 11, color: '#fff', fontWeight: '600' },
});

const bottomBar = StyleSheet.create({
  wrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopWidth: 1,
    paddingHorizontal: 20, paddingTop: 14,
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  hint: {
    fontSize: 10, fontWeight: '700', letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  total: { fontSize: 20, fontWeight: '800', color: GREEN, marginTop: 2 },
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: GREEN,
    paddingHorizontal: 18, paddingVertical: 14,
    borderRadius: 12,
  },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});

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
