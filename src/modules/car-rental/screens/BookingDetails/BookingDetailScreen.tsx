/**
 * Booking Details — fresh design (2026-08).
 *
 * Structure:
 *   1. Full-bleed photo hero with back + overflow-menu, status badge,
 *      and a bottom overlay carrying car name + booking short-id
 *   2. Contextual "next action" card that changes per booking state
 *      (pay, waiting, code, in-trip, return-code, review, cancelled)
 *      — the ONLY loud element on the page
 *   3. Two-tap pickup / return chain widget (component)
 *   4. Trip stops (pickup / drop-off) as a clean two-row list
 *   5. Provider card with call / directions actions
 *   6. Vehicle specs grid (2 columns)
 *   7. Handover inspection cards (existing sign-in-app flow)
 *   8. Price breakdown
 *   9. Payment method + policies + support
 *  10. Bottom danger zone (cancel booking)
 *  11. Sticky footer only when there's a pending payment
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import dayjs from 'dayjs';

import { AppAlert } from '@/components/AppAlert/AppAlert';
import { Typo } from '@/components/AppText/Typo';
import { PickupReturnChain } from '@/components/Rental/PickupReturnChain/PickupReturnChain';
import { WriteReviewModal } from '@/components/Rental/WriteReviewModal/WriteReviewModal';

import {
  cancelBooking,
  fetchBookingDetails,
  type BookingDetails,
} from '@/services/booking.service';
import { showError, showSuccess } from '@/helpers/toast';
import { useFormatMoney } from '@/providers/CurrencyProvider';
import { useTheme } from '@/theme/ThemeProvider';

const BRAND = '#0A6A4B';
const BRAND_DARK = '#064030';
const AMBER = '#F59E0B';
const RED = '#DC2626';
const BLUE = '#2563EB';

const HERO_H = 300;

type RouteParams = {
  bookingId: string;
  status?: 'in_progress' | 'completed';
};

/* ── STATE MACHINE ─────────────────────────────────────────────────
   A single derived state key drives (a) the hero status pill,
   (b) the "next action" card contents, and (c) the sticky footer
   presence + label. Keep the enum tight — every state you add must
   have a case in `resolveState`. */

type BookingState =
  | 'PAY_PENDING'
  | 'PAY_PROCESSING'
  | 'CONFIRMED_WAITING_PROVIDER'
  | 'CONFIRMED_COLLECTION'
  | 'PICKUP_READY'
  | 'IN_TRIP'
  | 'RETURN_REQUESTED'
  | 'COMPLETED'
  | 'CANCELLED';

function resolveState(b: BookingDetails): BookingState {
  const s = (b.status ?? '').toUpperCase();
  const ps = (b.payment?.status ?? '').toUpperCase();
  const chain = b.chain;
  const isCollection = b.paymentMethod === 'COLLECTION';

  if (s === 'CANCELLED') return 'CANCELLED';
  if (s === 'COMPLETED') return 'COMPLETED';
  if (chain?.providerConfirmedReturnAt) return 'COMPLETED';
  if (chain?.customerMarkedReturnAt) return 'RETURN_REQUESTED';
  if (s === 'IN_TRIP' || chain?.customerConfirmedPickupAt) return 'IN_TRIP';
  if (chain?.providerMarkedReadyAt) return 'PICKUP_READY';
  if (s === 'CONFIRMED') {
    return isCollection ? 'CONFIRMED_COLLECTION' : 'CONFIRMED_WAITING_PROVIDER';
  }
  if (ps === 'PROCESSING' || ps === 'REQUIRES_ACTION') return 'PAY_PROCESSING';
  return 'PAY_PENDING';
}

function statusPill(state: BookingState): { label: string; bg: string; fg: string } {
  switch (state) {
    case 'PAY_PENDING':
      return { label: 'PAYMENT PENDING', bg: 'rgba(245,158,11,0.18)', fg: '#FCD34D' };
    case 'PAY_PROCESSING':
      return { label: 'PROCESSING', bg: 'rgba(37,99,235,0.18)', fg: '#93C5FD' };
    case 'CONFIRMED_WAITING_PROVIDER':
    case 'CONFIRMED_COLLECTION':
      return { label: 'CONFIRMED', bg: 'rgba(10,106,75,0.22)', fg: '#6EE7B7' };
    case 'PICKUP_READY':
      return { label: 'READY FOR PICKUP', bg: 'rgba(10,106,75,0.24)', fg: '#6EE7B7' };
    case 'IN_TRIP':
      return { label: 'IN TRIP', bg: 'rgba(37,99,235,0.2)', fg: '#93C5FD' };
    case 'RETURN_REQUESTED':
      return { label: 'RETURN IN PROGRESS', bg: 'rgba(245,158,11,0.18)', fg: '#FCD34D' };
    case 'COMPLETED':
      return { label: 'COMPLETED', bg: 'rgba(34,197,94,0.2)', fg: '#86EFAC' };
    case 'CANCELLED':
      return { label: 'CANCELLED', bg: 'rgba(239,68,68,0.18)', fg: '#FCA5A5' };
  }
}

const BookingDetailScreen = () => {
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const navigation = useNavigation<any>();
  const { colors, mode } = useTheme();
  const insets = useSafeAreaInsets();
  const fmtMoney = useFormatMoney();
  const { bookingId } = route.params || { bookingId: '' };

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelAlertOpen, setCancelAlertOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const load = useCallback(async () => {
    if (!bookingId) return;
    try {
      const data = await fetchBookingDetails(bookingId);
      setBooking(data);
    } catch (e) {
      console.warn('[BookingDetails] load failed', e);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const state: BookingState | null = useMemo(
    () => (booking ? resolveState(booking) : null),
    [booking],
  );

  const car = booking?.car;
  const provider = booking?.provider;
  const period = booking?.rentalPeriod;
  const payment = booking?.payment;

  const carName = car?.brand && car?.model ? `${car.brand} ${car.model}` : 'Vehicle';
  const primaryImage =
    car?.images?.find(i => i.isPrimary)?.url ?? car?.images?.[0]?.url;
  const imageSource = primaryImage
    ? { uri: primaryImage }
    : {
        uri: 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=600',
      };

  const pickupAt = period?.pickupAt ? new Date(period.pickupAt) : null;
  const returnAt = period?.returnAt ? new Date(period.returnAt) : null;
  const pickupLocationName = period?.pickupLocation?.name ?? 'Pickup location';
  const pickupAddress = period?.pickupLocation?.address ?? '';

  const currency = payment?.currency ?? 'NGN';
  const money = (n?: number) => fmtMoney(n, currency, { round: true });

  const days =
    pickupAt && returnAt
      ? Math.max(1, Math.ceil((returnAt.getTime() - pickupAt.getTime()) / 86400000))
      : 1;

  const goToPayment = () => {
    if (!booking) return;
    navigation.navigate('PaymentScreen' as any, {
      bookingId: booking.id,
      paymentMethod: 'ONLINE',
    });
  };

  const doCancel = () => setCancelAlertOpen(true);
  const confirmCancel = async () => {
    setCancelAlertOpen(false);
    try {
      setCancelling(true);
      await cancelBooking(bookingId);
      showSuccess('Booking cancelled');
      navigation.goBack();
    } catch (e: any) {
      showError(e?.response?.data?.message ?? 'Failed to cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  const openDial = () => {
    if (provider?.phone) Linking.openURL(`tel:${provider.phone}`);
  };

  /* ── LOADING ─────────────────────────────────────────────── */
  if (loading || !booking || !state) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[s.floatBack, { top: insets.top + 10 }]}
        >
          <Icon name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>
        <ActivityIndicator size="large" color={BRAND} style={{ marginTop: 120 }} />
      </View>
    );
  }

  const pill = statusPill(state);
  const showFooter = state === 'PAY_PENDING';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: showFooter ? 130 : 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND} />
        }
      >
        {/* ── HERO ────────────────────────────────────────────── */}
        <View style={s.hero}>
          <Image source={imageSource} style={s.heroImg} resizeMode="cover" />
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(0,0,0,0.5)', 'transparent', 'transparent', 'rgba(0,0,0,0.85)']}
            style={StyleSheet.absoluteFill}
          />

          {/* Top toolbar */}
          <View style={[s.heroToolbar, { top: insets.top + 8 }]}>
            <TouchableOpacity style={s.iconBtn} onPress={() => navigation.goBack()}>
              <Icon name="chevron-back" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={[s.pill, { backgroundColor: pill.bg }]}>
              <Typo style={[s.pillText, { color: pill.fg }]}>{pill.label}</Typo>
            </View>
            <TouchableOpacity style={s.iconBtn} onPress={() => setMenuOpen(true)}>
              <Icon name="ellipsis-horizontal" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Bottom overlay: car + booking id */}
          <View pointerEvents="none" style={s.heroBottom}>
            <Typo style={s.heroCarName}>{carName}</Typo>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={s.bookingIdChip}>
                <Icon name="pricetag" size={11} color="rgba(255,255,255,0.9)" />
                <Typo style={s.bookingIdText}>
                  #{booking.id.slice(0, 8).toUpperCase()}
                </Typo>
              </View>
              <Typo style={s.heroSub}>
                {days} day{days > 1 ? 's' : ''} · {money(payment?.totalPrice)}
              </Typo>
            </View>
          </View>
        </View>

        {/* ── NEXT ACTION CARD ────────────────────────────────── */}
        <View style={{ padding: 16 }}>
          <NextActionCard
            state={state}
            money={money}
            payment={payment}
            colors={colors}
            mode={mode}
            onPay={goToPayment}
            onReview={() => setReviewOpen(true)}
            hasReview={!!booking.hasReview}
          />
        </View>

        {/* ── PICKUP / RETURN CHAIN (for online bookings) ─────── */}
        {booking.paymentMethod !== 'COLLECTION' && (
          <PickupReturnChain booking={booking} onChanged={load} />
        )}

        {/* ── TRIP STOPS ──────────────────────────────────────── */}
        <SectionHead icon="git-branch-outline" label="Trip" />
        <View style={[s.card, cardBg(colors)]}>
          <StopRow
            colors={colors}
            color={BRAND}
            iconBg={mode === 'dark' ? '#0F3027' : '#E7F5F0'}
            label="Pick-up"
            date={pickupAt ? dayjs(pickupAt).format('ddd, D MMM YYYY') : '—'}
            time={pickupAt ? dayjs(pickupAt).format('HH:mm') : ''}
            place={pickupLocationName}
            address={pickupAddress}
          />
          <View style={[s.stopDivider, { backgroundColor: colors.border }]} />
          <StopRow
            colors={colors}
            color={AMBER}
            iconBg={mode === 'dark' ? '#3A2A08' : '#FEF3C7'}
            label="Drop-off"
            date={returnAt ? dayjs(returnAt).format('ddd, D MMM YYYY') : '—'}
            time={returnAt ? dayjs(returnAt).format('HH:mm') : ''}
            place={pickupLocationName}
            address={pickupAddress}
            isLast
          />
        </View>

        {/* ── COLLECTION CODE (COD only, until picked up) ─────── */}
        {booking.paymentMethod === 'COLLECTION' &&
          booking.collectionCode &&
          state !== 'COMPLETED' &&
          state !== 'CANCELLED' && (
            <>
              <SectionHead icon="key-outline" label="Collection code" />
              <View style={[s.card, cardBg(colors), { alignItems: 'center', gap: 6 }]}>
                <Typo style={[s.codeChip, { color: BRAND }]}>
                  {booking.collectionCode}
                </Typo>
                <Typo style={[s.mutedCenter, { color: colors.textSecondary }]}>
                  Show this to the provider when you pick up the car.
                </Typo>
              </View>
            </>
          )}

        {/* ── PROVIDER ────────────────────────────────────────── */}
        <SectionHead icon="business-outline" label="Provider" />
        <View style={[s.card, cardBg(colors)]}>
          <View style={s.providerRow}>
            <View style={[s.avatar, { backgroundColor: mode === 'dark' ? '#0F3027' : '#E7F5F0' }]}>
              <Icon name="business" size={18} color={BRAND} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Typo style={[s.providerName, { color: colors.textPrimary }]}>
                  {provider?.name ?? 'Provider'}
                </Typo>
                <Icon name="checkmark-circle" size={14} color={BRAND} />
              </View>
              <Typo style={[s.providerSub, { color: colors.textSecondary }]}>
                Verified provider
              </Typo>
            </View>
            {provider?.phone && (
              <TouchableOpacity onPress={openDial} style={[s.circleBtn, { borderColor: colors.border }]}>
                <Icon name="call" size={16} color={BRAND} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── VEHICLE SPECS GRID ──────────────────────────────── */}
        <SectionHead icon="car-outline" label="Vehicle" />
        <View style={[s.card, cardBg(colors)]}>
          <View style={s.specsGrid}>
            <Spec icon="cog-outline" label="Transmission" value={fmtLabel(car?.transmission)} colors={colors} />
            <Spec icon="people-outline" label="Seats" value={car?.seats ? String(car.seats) : '—'} colors={colors} />
            <Spec icon="snow-outline" label="AC" value={car?.hasAC == null ? '—' : car.hasAC ? 'Yes' : 'No'} colors={colors} />
            <Spec icon="speedometer-outline" label="Mileage" value={fmtLabel(car?.mileagePolicy) || '—'} colors={colors} />
          </View>
        </View>

        {/* ── HANDOVER INSPECTIONS ────────────────────────────── */}
        {!!booking.handovers?.length &&
          booking.handovers.map(h => (
            <HandoverBlock
              key={h.id}
              handover={h}
              colors={colors}
              onSign={() =>
                navigation.navigate('HandoverSign', {
                  bookingId: booking.id,
                  type: h.type,
                  carName,
                })
              }
            />
          ))}

        {/* ── PRICE BREAKDOWN ─────────────────────────────────── */}
        <SectionHead icon="receipt-outline" label="Price breakdown" />
        <View style={[s.card, cardBg(colors)]}>
          <PriceRow label={`Rental (${days} day${days > 1 ? 's' : ''})`} value={money(payment?.basePrice)} colors={colors} />
          {(payment?.protectionFeeTotal ?? payment?.insuranceFee ?? 0) > 0 && (
            <PriceRow
              label={payment?.protectionTier ? `Protection · ${payment.protectionTier}` : 'Protection'}
              value={money(payment?.protectionFeeTotal ?? payment?.insuranceFee)}
              colors={colors}
            />
          )}
          {booking.addons?.map(a => (
            <PriceRow
              key={a.id}
              label={a.quantity > 1 ? `${a.name} × ${a.quantity}` : a.name}
              value={money(a.lineTotal)}
              colors={colors}
            />
          ))}
          {(payment?.taxAmount ?? 0) > 0 && (
            <PriceRow label="Tax" value={money(payment?.taxAmount)} colors={colors} />
          )}
          <View style={[s.totalDivider, { backgroundColor: colors.border }]} />
          <View style={s.totalRow}>
            <Typo style={[s.totalLabel, { color: colors.textPrimary }]}>Total</Typo>
            <Typo style={[s.totalValue, { color: BRAND }]}>{money(payment?.totalPrice)}</Typo>
          </View>
          {(payment?.depositAmount ?? 0) > 0 && (
            <Typo style={[s.depositHint, { color: colors.textSecondary }]}>
              + {money(payment?.depositAmount)} security deposit (pre-authorized at pickup)
            </Typo>
          )}
        </View>

        {/* ── PAYMENT METHOD ──────────────────────────────────── */}
        <SectionHead icon="card-outline" label="Payment" />
        <View style={[s.card, cardBg(colors)]}>
          <View style={s.pmRow}>
            <View style={[s.pmIcon, { backgroundColor: mode === 'dark' ? '#0F3027' : '#E7F5F0' }]}>
              <Icon
                name={booking.paymentMethod === 'COLLECTION' ? 'wallet-outline' : 'card-outline'}
                size={18}
                color={BRAND}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Typo style={[s.pmLabel, { color: colors.textPrimary }]}>
                {booking.paymentMethod === 'COLLECTION'
                  ? 'Pay on Collection'
                  : payment?.provider || 'Card'}
              </Typo>
              <Typo style={[s.pmSub, { color: colors.textSecondary }]}>
                {payment?.paidAt
                  ? `Paid on ${dayjs(payment.paidAt).format('DD MMM YYYY, HH:mm')}`
                  : booking.paymentMethod === 'COLLECTION'
                    ? 'Due at pickup'
                    : payment?.status
                      ? fmtLabel(payment.status)
                      : ''}
              </Typo>
            </View>
            {payment?.status === 'SUCCEEDED' && (
              <View style={[s.pmPaidPill, { backgroundColor: mode === 'dark' ? '#0F3027' : '#DCFCE7' }]}>
                <Typo style={[s.pmPaidText, { color: BRAND }]}>PAID</Typo>
              </View>
            )}
          </View>
        </View>

        {/* ── POLICIES ────────────────────────────────────────── */}
        <SectionHead icon="shield-checkmark-outline" label="Policies" />
        <View style={[s.card, cardBg(colors)]}>
          <PolicyRow title="Cancellation" value="Free cancellation up to 24 hours before pickup" colors={colors} />
          <PolicyRow title="Fuel policy" value="Full to Full" colors={colors} />
          <PolicyRow title="Mileage" value="Unlimited mileage included" colors={colors} last />
        </View>

        {/* ── REVIEW (completed only) ─────────────────────────── */}
        {state === 'COMPLETED' && booking.car?.id && (
          <>
            <SectionHead icon="star-outline" label="Your review" />
            {booking.hasReview ? (
              <View style={[s.card, cardBg(colors), s.simpleRow]}>
                <Icon name="checkmark-circle" size={20} color={BRAND} />
                <View style={{ flex: 1 }}>
                  <Typo style={[s.rowTitle, { color: colors.textPrimary }]}>Review submitted</Typo>
                  <Typo style={[s.rowSub, { color: colors.textSecondary }]}>
                    Thanks for sharing your experience.
                  </Typo>
                </View>
              </View>
            ) : (
              <Pressable
                onPress={() => setReviewOpen(true)}
                style={({ pressed }) => [
                  s.card,
                  cardBg(colors),
                  s.simpleRow,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Icon name="star" size={20} color="#D97706" />
                <View style={{ flex: 1 }}>
                  <Typo style={[s.rowTitle, { color: colors.textPrimary }]}>Rate your trip</Typo>
                  <Typo style={[s.rowSub, { color: colors.textSecondary }]}>
                    Help other renters — takes less than a minute.
                  </Typo>
                </View>
                <Icon name="chevron-forward" size={18} color={colors.textSecondary} />
              </Pressable>
            )}
          </>
        )}

        {/* ── SUPPORT ─────────────────────────────────────────── */}
        {state !== 'CANCELLED' && (
          <>
            <SectionHead icon="help-circle-outline" label="Need help?" />
            <View style={[s.card, cardBg(colors), { padding: 6 }]}>
              {provider?.phone && (
                <SupportItem
                  icon="call-outline"
                  label={`Call ${provider.name}`}
                  onPress={openDial}
                  colors={colors}
                />
              )}
              <SupportItem
                icon="chatbubbles-outline"
                label="Message support"
                onPress={() => navigation.navigate('SupportChat' as any, { bookingId: booking.id })}
                colors={colors}
              />
              <SupportItem
                icon="navigate-outline"
                label="Get directions"
                onPress={() => {
                  const q = encodeURIComponent(pickupAddress || pickupLocationName);
                  Linking.openURL(`https://maps.google.com/?q=${q}`);
                }}
                colors={colors}
                last
              />
            </View>
          </>
        )}

        {/* ── DANGER ZONE ────────────────────────────────────────
            Cancel is only visible on states where a customer can walk
            away themselves:
              • PAY_PENDING / PAY_PROCESSING — no money captured yet,
                cancellation is a free release.
              • CONFIRMED_COLLECTION — pay-on-collection, still no money
                moved, provider hasn't handed over.
            Once payment is captured (CONFIRMED_WAITING_PROVIDER online
            path) or later, cancellation triggers a refund flow that
            has to go through support — the tap is replaced with a
            "Request cancellation & refund" outline button that opens
            the support thread instead of hitting cancelBooking(). */}
        {(state === 'PAY_PENDING' ||
          state === 'PAY_PROCESSING' ||
          state === 'CONFIRMED_COLLECTION') && (
          <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={s.cancelBtn}
              onPress={doCancel}
              disabled={cancelling}
            >
              <Icon name="close-circle-outline" size={18} color={RED} />
              <Typo style={s.cancelText}>
                {cancelling ? 'Cancelling…' : 'Cancel booking'}
              </Typo>
            </TouchableOpacity>
          </View>
        )}

        {state === 'CONFIRMED_WAITING_PROVIDER' && (
          <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={s.refundBtn}
              onPress={() =>
                navigation.navigate('SupportChat' as any, {
                  bookingId: booking.id,
                  topic: 'REFUND_REQUEST',
                })
              }
            >
              <Icon name="return-up-back-outline" size={18} color={colors.textPrimary} />
              <Typo style={[s.refundText, { color: colors.textPrimary }]}>
                Request cancellation & refund
              </Typo>
            </TouchableOpacity>
            <Typo style={[s.refundHint, { color: colors.textSecondary }]}>
              Payment is captured. Any refund is calculated against the
              cancellation policy — our team confirms in chat before
              releasing the car.
            </Typo>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ── STICKY FOOTER (only when pay pending) ─────────────── */}
      {showFooter && (
        <View
          style={[
            s.footer,
            {
              paddingBottom: insets.bottom + 12,
              backgroundColor: colors.background,
              borderTopColor: colors.border,
            },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Typo style={[s.footerHint, { color: colors.textSecondary }]}>
              Reservation expires if unpaid
            </Typo>
            <Typo style={[s.footerTotal, { color: BRAND }]}>{money(payment?.totalPrice)}</Typo>
          </View>
          <TouchableOpacity style={s.footerBtn} onPress={goToPayment} activeOpacity={0.85}>
            <Typo style={s.footerBtnText}>Complete payment</Typo>
            <Icon name="arrow-forward" size={15} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* ── MODALS ────────────────────────────────────────────── */}
      <AppAlert
        visible={cancelAlertOpen}
        title="Cancel booking?"
        message="This releases the car back to the provider. If you already paid, a refund is processed based on the cancellation policy."
        buttons={[
          { text: 'Keep booking', style: 'cancel', onPress: () => setCancelAlertOpen(false) },
          { text: 'Yes, cancel', style: 'destructive', onPress: confirmCancel },
        ]}
        onDismiss={() => setCancelAlertOpen(false)}
      />

      {booking.car?.id && (
        <WriteReviewModal
          visible={reviewOpen}
          carId={booking.car.id}
          bookingId={booking.id}
          carTitle={carName}
          providerName={provider?.name}
          onClose={() => setReviewOpen(false)}
          onSubmitted={async () => {
            try {
              const fresh = await fetchBookingDetails(bookingId);
              setBooking(fresh);
            } catch {
              // non-fatal
            }
          }}
        />
      )}

      {/* Overflow menu */}
      <Modal transparent visible={menuOpen} animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={menu.backdrop} onPress={() => setMenuOpen(false)}>
          <View style={[menu.sheet, { top: insets.top + 48, backgroundColor: colors.surface, borderColor: colors.border }]}>
            <MenuItem
              icon="share-outline"
              label="Share booking"
              onPress={() => {
                setMenuOpen(false);
              }}
              colors={colors}
            />
            <MenuItem
              icon="document-text-outline"
              label={state === 'COMPLETED' ? 'Download receipt' : 'View invoice'}
              onPress={() => {
                setMenuOpen(false);
              }}
              colors={colors}
            />
            {(state === 'PAY_PENDING' ||
              state === 'PAY_PROCESSING' ||
              state === 'CONFIRMED_COLLECTION') && (
              <MenuItem
                icon="close-circle-outline"
                label="Cancel booking"
                onPress={() => {
                  setMenuOpen(false);
                  doCancel();
                }}
                colors={colors}
                danger
                last
              />
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

export default BookingDetailScreen;

/* ── Local subcomponents ─────────────────────────────────────── */

function NextActionCard({
  state,
  money,
  payment,
  colors,
  mode,
  onPay,
  onReview,
  hasReview,
}: {
  state: BookingState;
  money: (n?: number) => string;
  payment: BookingDetails['payment'] | undefined;
  colors: any;
  mode: 'light' | 'dark';
  onPay: () => void;
  onReview: () => void;
  hasReview: boolean;
}) {
  switch (state) {
    case 'PAY_PENDING':
      return (
        <ActionShell tint={AMBER} colors={colors}>
          <View style={[a.iconWrap, { backgroundColor: 'rgba(245,158,11,0.15)' }]}>
            <Icon name="alert-circle" size={22} color={AMBER} />
          </View>
          <View style={{ flex: 1 }}>
            <Typo style={[a.title, { color: colors.textPrimary }]}>Complete your payment</Typo>
            <Typo style={[a.body, { color: colors.textSecondary }]}>
              Your reservation is being held. Pay {money(payment?.totalPrice)} to lock this car
              in — otherwise it releases back to the pool.
            </Typo>
          </View>
          <TouchableOpacity onPress={onPay} style={[a.cta, { backgroundColor: AMBER }]}>
            <Typo style={a.ctaText}>Pay now</Typo>
          </TouchableOpacity>
        </ActionShell>
      );

    case 'PAY_PROCESSING':
      return (
        <ActionShell tint={BLUE} colors={colors}>
          <View style={[a.iconWrap, { backgroundColor: 'rgba(37,99,235,0.15)' }]}>
            <ActivityIndicator color={BLUE} />
          </View>
          <View style={{ flex: 1 }}>
            <Typo style={[a.title, { color: colors.textPrimary }]}>Payment processing</Typo>
            <Typo style={[a.body, { color: colors.textSecondary }]}>
              We're waiting on the gateway to confirm. This usually takes a few
              seconds — pull down to refresh.
            </Typo>
          </View>
        </ActionShell>
      );

    case 'CONFIRMED_COLLECTION':
      return (
        <ActionShell tint={BRAND} colors={colors}>
          <View style={[a.iconWrap, { backgroundColor: mode === 'dark' ? '#0F3027' : '#E7F5F0' }]}>
            <Icon name="wallet-outline" size={22} color={BRAND} />
          </View>
          <View style={{ flex: 1 }}>
            <Typo style={[a.title, { color: colors.textPrimary }]}>You're all set</Typo>
            <Typo style={[a.body, { color: colors.textSecondary }]}>
              Bring the collection code below to the provider at pickup time.
              Payment happens on the spot.
            </Typo>
          </View>
        </ActionShell>
      );

    case 'CONFIRMED_WAITING_PROVIDER':
    case 'PICKUP_READY':
    case 'IN_TRIP':
    case 'RETURN_REQUESTED':
      // The PickupReturnChain component below owns the visuals here.
      return null;

    case 'COMPLETED':
      if (hasReview) {
        return (
          <ActionShell tint={BRAND} colors={colors}>
            <View style={[a.iconWrap, { backgroundColor: mode === 'dark' ? '#0F3027' : '#E7F5F0' }]}>
              <Icon name="checkmark-circle" size={22} color={BRAND} />
            </View>
            <View style={{ flex: 1 }}>
              <Typo style={[a.title, { color: colors.textPrimary }]}>Trip completed</Typo>
              <Typo style={[a.body, { color: colors.textSecondary }]}>
                Deposit released. Thanks for renting with us.
              </Typo>
            </View>
          </ActionShell>
        );
      }
      return (
        <ActionShell tint="#D97706" colors={colors}>
          <View style={[a.iconWrap, { backgroundColor: 'rgba(245,158,11,0.15)' }]}>
            <Icon name="star" size={22} color="#D97706" />
          </View>
          <View style={{ flex: 1 }}>
            <Typo style={[a.title, { color: colors.textPrimary }]}>How was your trip?</Typo>
            <Typo style={[a.body, { color: colors.textSecondary }]}>
              Your review helps the next renter choose the right car.
            </Typo>
          </View>
          <TouchableOpacity onPress={onReview} style={[a.cta, { backgroundColor: '#D97706' }]}>
            <Typo style={a.ctaText}>Rate</Typo>
          </TouchableOpacity>
        </ActionShell>
      );

    case 'CANCELLED':
      return (
        <ActionShell tint={RED} colors={colors}>
          <View style={[a.iconWrap, { backgroundColor: 'rgba(239,68,68,0.14)' }]}>
            <Icon name="close-circle" size={22} color={RED} />
          </View>
          <View style={{ flex: 1 }}>
            <Typo style={[a.title, { color: colors.textPrimary }]}>Booking cancelled</Typo>
            <Typo style={[a.body, { color: colors.textSecondary }]}>
              This booking is no longer active. Any refund is processed based on
              the cancellation policy — check your inbox.
            </Typo>
          </View>
        </ActionShell>
      );
  }
}

function ActionShell({
  tint,
  colors,
  children,
}: {
  tint: string;
  colors: any;
  children: React.ReactNode;
}) {
  return (
    <View
      style={[
        a.shell,
        { backgroundColor: colors.surface, borderColor: `${tint}55` },
      ]}
    >
      {children}
    </View>
  );
}

function SectionHead({ icon, label }: { icon: string; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={s.sectionHead}>
      <Icon name={icon as any} size={15} color={BRAND} />
      <Typo style={[s.sectionLabel, { color: colors.textPrimary }]}>{label}</Typo>
    </View>
  );
}

function StopRow({
  colors,
  color,
  iconBg,
  label,
  date,
  time,
  place,
  address,
  isLast,
}: {
  colors: any;
  color: string;
  iconBg: string;
  label: string;
  date: string;
  time: string;
  place: string;
  address: string;
  isLast?: boolean;
}) {
  return (
    <View style={s.stopRow}>
      <View style={s.stopRail}>
        <View style={[s.stopDot, { backgroundColor: iconBg, borderColor: color }]}>
          <Icon name="location" size={14} color={color} />
        </View>
        {!isLast && <View style={[s.stopLine, { backgroundColor: colors.border }]} />}
      </View>
      <View style={{ flex: 1, paddingBottom: isLast ? 0 : 8 }}>
        <Typo style={[s.stopLabel, { color }]}>{label.toUpperCase()}</Typo>
        <Typo style={[s.stopDate, { color: colors.textPrimary }]}>
          {date} <Typo style={{ color: colors.textSecondary, fontWeight: '600' }}>· {time}</Typo>
        </Typo>
        <Typo style={[s.stopPlace, { color: colors.textPrimary }]}>{place}</Typo>
        {!!address && (
          <Typo style={[s.stopAddr, { color: colors.textSecondary }]} numberOfLines={2}>
            {address}
          </Typo>
        )}
      </View>
    </View>
  );
}

function Spec({
  icon,
  label,
  value,
  colors,
}: {
  icon: string;
  label: string;
  value: string;
  colors: any;
}) {
  return (
    <View style={s.specCell}>
      <Icon name={icon as any} size={16} color={colors.textSecondary} />
      <View style={{ flex: 1 }}>
        <Typo style={[s.specLabel, { color: colors.textSecondary }]}>{label}</Typo>
        <Typo style={[s.specValue, { color: colors.textPrimary }]}>{value || '—'}</Typo>
      </View>
    </View>
  );
}

function HandoverBlock({
  handover,
  colors,
  onSign,
}: {
  handover: NonNullable<BookingDetails['handovers']>[number];
  colors: any;
  onSign: () => void;
}) {
  const isSigned = !!handover.customerSignatureUrl;
  const typeLabel = handover.type === 'PICKUP' ? 'Pick-up' : 'Return';
  return (
    <>
      <SectionHead
        icon={handover.type === 'PICKUP' ? 'log-in-outline' : 'log-out-outline'}
        label={`${typeLabel} inspection`}
      />
      <View style={[s.card, cardBg(colors)]}>
        {isSigned ? (
          <View style={s.simpleRow}>
            <Icon name="checkmark-circle" size={20} color={BRAND} />
            <View style={{ flex: 1 }}>
              <Typo style={[s.rowTitle, { color: colors.textPrimary }]}>
                Signed on {handover.customerSignedAt ? dayjs(handover.customerSignedAt).format('DD MMM, HH:mm') : ''}
              </Typo>
              <Typo style={[s.rowSub, { color: colors.textSecondary }]}>
                Your signature is on file for this inspection.
              </Typo>
            </View>
          </View>
        ) : (
          <TouchableOpacity onPress={onSign} activeOpacity={0.85} style={s.handoverCta}>
            <Icon name="create-outline" size={18} color="#fff" />
            <Typo style={s.handoverCtaText}>Confirm & sign {typeLabel.toLowerCase()} inspection</Typo>
          </TouchableOpacity>
        )}
      </View>
    </>
  );
}

function PriceRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: any;
}) {
  return (
    <View style={s.priceRow}>
      <Typo style={[s.priceLabel, { color: colors.textSecondary }]}>{label}</Typo>
      <Typo style={[s.priceValue, { color: colors.textPrimary }]}>{value}</Typo>
    </View>
  );
}

function PolicyRow({
  title,
  value,
  colors,
  last,
}: {
  title: string;
  value: string;
  colors: any;
  last?: boolean;
}) {
  return (
    <View
      style={[
        s.policyRow,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
      ]}
    >
      <Typo style={[s.policyTitle, { color: colors.textPrimary }]}>{title}</Typo>
      <Typo style={[s.policyValue, { color: colors.textSecondary }]}>{value}</Typo>
    </View>
  );
}

function SupportItem({
  icon,
  label,
  onPress,
  colors,
  last,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  colors: any;
  last?: boolean;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        s.supportRow,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
      ]}
    >
      <Icon name={icon as any} size={18} color={BRAND} />
      <Typo style={[s.supportText, { color: colors.textPrimary }]}>{label}</Typo>
      <Icon name="chevron-forward" size={16} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
  colors,
  danger,
  last,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  colors: any;
  danger?: boolean;
  last?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        menu.item,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
      ]}
    >
      <Icon name={icon as any} size={17} color={danger ? RED : colors.textPrimary} />
      <Typo style={[menu.itemText, { color: danger ? RED : colors.textPrimary }]}>{label}</Typo>
    </TouchableOpacity>
  );
}

function fmtLabel(value?: string | null) {
  if (!value) return '';
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/(^\w|\s\w)/g, m => m.toUpperCase());
}

function cardBg(colors: any) {
  return { backgroundColor: colors.surface, borderColor: colors.border };
}

/* ── STYLES ──────────────────────────────────────────────────── */

const s = StyleSheet.create({
  /* hero */
  hero: { height: HERO_H, backgroundColor: '#111', overflow: 'hidden' },
  heroImg: { width: '100%', height: HERO_H },
  heroToolbar: {
    position: 'absolute', left: 0, right: 0, paddingHorizontal: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10,
  },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  pill: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
  },
  pillText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  heroBottom: { position: 'absolute', bottom: 16, left: 16, right: 16, gap: 6 },
  heroCarName: { color: '#fff', fontSize: 24, fontWeight: '800' },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' },
  bookingIdChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.18)',
  },
  bookingIdText: {
    color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.4,
  },
  floatBack: {
    position: 'absolute', left: 14, zIndex: 5,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },

  /* section head */
  sectionHead: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8,
  },
  sectionLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },

  /* generic card */
  card: {
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },

  /* stops */
  stopRow: { flexDirection: 'row', gap: 12 },
  stopRail: { alignItems: 'center', width: 32 },
  stopDot: {
    width: 30, height: 30, borderRadius: 15,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  stopLine: { flex: 1, width: 2, marginTop: 4, minHeight: 20, borderRadius: 1 },
  stopDivider: { height: 0 },
  stopLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.7, marginBottom: 3 },
  stopDate: { fontSize: 14, fontWeight: '800' },
  stopPlace: { fontSize: 13, fontWeight: '600', marginTop: 3 },
  stopAddr: { fontSize: 12, marginTop: 1, lineHeight: 16 },

  /* code chip */
  codeChip: { fontSize: 30, fontWeight: '900', letterSpacing: 6 },
  mutedCenter: { fontSize: 12, textAlign: 'center', lineHeight: 17 },

  /* provider */
  providerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
  },
  providerName: { fontSize: 15, fontWeight: '800' },
  providerSub: { fontSize: 12, marginTop: 2 },
  circleBtn: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  /* specs */
  specsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  specCell: {
    width: '50%',
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8,
  },
  specLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
  specValue: { fontSize: 14, fontWeight: '700', marginTop: 1 },

  /* handover */
  handoverCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: BLUE,
    paddingVertical: 14, borderRadius: 12,
  },
  handoverCtaText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  /* price */
  priceRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 7,
  },
  priceLabel: { fontSize: 13 },
  priceValue: { fontSize: 13, fontWeight: '700' },
  totalDivider: { height: StyleSheet.hairlineWidth, marginVertical: 8 },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  totalLabel: { fontSize: 15, fontWeight: '800' },
  totalValue: { fontSize: 18, fontWeight: '900' },
  depositHint: { fontSize: 11, marginTop: 6 },

  /* payment method */
  pmRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pmIcon: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  pmLabel: { fontSize: 14, fontWeight: '700' },
  pmSub: { fontSize: 12, marginTop: 2 },
  pmPaidPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  pmPaidText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.6 },

  /* policies */
  policyRow: { paddingVertical: 10 },
  policyTitle: { fontSize: 13, fontWeight: '700' },
  policyValue: { fontSize: 12, marginTop: 2, lineHeight: 16 },

  /* simple row (review, handover signed) */
  simpleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowTitle: { fontSize: 14, fontWeight: '700' },
  rowSub: { fontSize: 12, marginTop: 2, lineHeight: 16 },

  /* support */
  supportRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 10,
  },
  supportText: { flex: 1, fontSize: 14, fontWeight: '600' },

  /* cancel */
  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.35)',
    backgroundColor: 'rgba(239,68,68,0.08)',
  },
  cancelText: { color: RED, fontSize: 14, fontWeight: '800' },
  refundBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
    backgroundColor: 'transparent',
  },
  refundText: { fontSize: 14, fontWeight: '700' },
  refundHint: { fontSize: 11, marginTop: 8, lineHeight: 15, textAlign: 'center' },

  /* footer */
  footer: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    borderTopWidth: 1,
    paddingHorizontal: 18, paddingTop: 12,
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  footerHint: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  footerTotal: { fontSize: 20, fontWeight: '900', marginTop: 2 },
  footerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: BRAND,
    paddingHorizontal: 18, paddingVertical: 14,
    borderRadius: 12,
  },
  footerBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});

const a = StyleSheet.create({
  shell: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 15, fontWeight: '800' },
  body: { fontSize: 12, marginTop: 2, lineHeight: 17 },
  cta: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 10,
  },
  ctaText: { color: '#fff', fontSize: 13, fontWeight: '800' },
});

const menu = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: {
    position: 'absolute', right: 12,
    minWidth: 220,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  itemText: { fontSize: 14, fontWeight: '700' },
});
