import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@react-native-vector-icons/ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import dayjs from 'dayjs';

import { Typo } from '@/components/AppText/Typo';
import { AppButton } from '@/components/AppButton/CustomButton';
import { fetchBookingDetails } from '@/services/booking.service';
import type { BookingDetails } from '@/services/booking.service';
import { useFormatMoney } from '@/providers/CurrencyProvider';
import { useTheme } from '@/theme/ThemeProvider';

const GREEN = '#0A6A4B';
const GREEN_LIGHT = '#F0FDF4';

const BookingStatusScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const bookingId: string | undefined = route?.params?.bookingId;
  const paymentMethod: string = route?.params?.paymentMethod ?? 'ONLINE';
  const fmtMoney = useFormatMoney();
  const { mode, colors } = useTheme();

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

  const isCollection = paymentMethod === 'COLLECTION' || booking?.paymentMethod === 'COLLECTION';
  const carName = booking?.car ? `${booking.car.brand} ${booking.car.model}` : undefined;
  const totalPrice = booking?.payment?.totalPrice;
  const rawCurrency = booking?.payment?.currency ?? 'NGN';
  const collectionCode = booking?.collectionCode;

  const pickupAt = booking?.rentalPeriod?.pickupAt
    ? dayjs(booking.rentalPeriod.pickupAt).format('D MMM YYYY, HH:mm')
    : undefined;
  const returnAt = booking?.rentalPeriod?.returnAt
    ? dayjs(booking.rentalPeriod.returnAt).format('D MMM YYYY, HH:mm')
    : undefined;

  const pickupName = booking?.rentalPeriod?.pickupLocation?.name ?? 'Pickup location';

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={GREEN} />

      {/* ── GREEN HERO ── */}
      <View style={s.hero}>
        {/* Success badge */}
        <View style={s.successRing}>
          <View style={s.successInner}>
            <Icon name="checkmark" size={38} color="#fff" />
          </View>
        </View>

        <Typo style={s.heroTitle}>
          {isCollection ? 'Booking Confirmed!' : 'Payment Successful!'}
        </Typo>

        {carName && <Typo style={s.heroCarName}>{carName}</Typo>}

        {typeof totalPrice === 'number' && (
          <View style={s.heroPriceRow}>
            <Typo style={s.heroPriceSub}>Total amount</Typo>
            <Typo style={s.heroPrice}>
              {fmtMoney(totalPrice, rawCurrency, { round: true })}
            </Typo>
          </View>
        )}
      </View>

      {/* ── BODY ── */}
      <View style={[s.card, { backgroundColor: colors.background }]}>
        {loading ? (
          <View style={s.loadingWrap}>
            <ActivityIndicator size="large" color={GREEN} />
            <Typo style={[s.loadingText, { color: colors.textSecondary }]}>Loading booking details…</Typo>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.cardContent}
          >
            {/* Collection code */}
            {isCollection && collectionCode && (
              <View style={[s.codeCard, { backgroundColor: colors.surface }]}>
                <Typo style={s.codeLabel}>Collection Code</Typo>
                <Typo style={s.codeValue}>{collectionCode}</Typo>
                <View style={s.codeHintRow}>
                  <Icon name="information-circle-outline" size={14} color={GREEN} />
                  <Typo style={[s.codeHint, { color: colors.textSecondary }]}>
                    Show this code when picking up the vehicle
                  </Typo>
                </View>
              </View>
            )}

            {/* Subtitle */}
            <Typo style={[s.subtitle, { color: colors.textSecondary }]}>
              {isCollection
                ? 'Your booking is confirmed. Present the code above when you arrive to collect the car.'
                : 'Your rental booking is confirmed. Check your email for a receipt.'}
            </Typo>

            {/* Details card */}
            <View
              style={[
                s.detailsCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Typo style={[s.detailsTitle, { color: colors.textPrimary }]}>Booking Details</Typo>

              {bookingId && (
                <DetailRow
                  icon="receipt-outline"
                  label="Booking ID"
                  value={bookingId.slice(0, 8).toUpperCase()}
                />
              )}
              {carName && (
                <DetailRow icon="car-outline" label="Vehicle" value={carName} />
              )}
              <DetailRow
                icon={isCollection ? 'wallet-outline' : 'card-outline'}
                label="Payment"
                value={isCollection ? 'Pay on Collection' : 'Paid Online'}
                valueColor={GREEN}
              />
              {pickupName && (
                <DetailRow icon="location-outline" label="Pickup" value={pickupName} />
              )}
              {pickupAt && returnAt && (
                <>
                  <DetailRow icon="time-outline" label="Pick-up" value={pickupAt} />
                  <DetailRow icon="time-outline" label="Drop-off" value={returnAt} isLast />
                </>
              )}
            </View>

            {/* Rental period timeline */}
            {pickupAt && returnAt && (
              <View
                style={[
                  s.timelineCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Typo style={[s.detailsTitle, { color: colors.textPrimary }]}>Rental Period</Typo>
                <View style={s.timeline}>
                  <View style={s.timelineLeft}>
                    <View style={[s.timelineDot, s.timelineDotGreen]} />
                    <View style={[s.timelineLine, { backgroundColor: colors.border }]} />
                    <View style={[s.timelineDot, s.timelineDotOrange]} />
                  </View>
                  <View style={s.timelineRight}>
                    <View style={s.timelineLeg}>
                      <Typo style={[s.timelineLegLabel, { color: colors.textSecondary }]}>Pick-up</Typo>
                      <Typo style={[s.timelineLegDate, { color: colors.textPrimary }]}>{pickupAt}</Typo>
                      <Typo style={[s.timelineLegPlace, { color: colors.textSecondary }]}>{pickupName}</Typo>
                    </View>
                    <View style={s.timelineLeg}>
                      <Typo style={[s.timelineLegLabel, { color: colors.textSecondary }]}>Drop-off</Typo>
                      <Typo style={[s.timelineLegDate, { color: colors.textPrimary }]}>{returnAt}</Typo>
                      <Typo style={[s.timelineLegPlace, { color: colors.textSecondary }]}>{pickupName}</Typo>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* What next */}
            <View
              style={[
                s.nextCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Typo style={[s.detailsTitle, { color: colors.textPrimary }]}>What's next?</Typo>
              {[
                isCollection
                  ? { icon: 'wallet-outline', text: 'Bring your collection code and cash payment to pickup' }
                  : { icon: 'mail-outline', text: 'A confirmation receipt has been sent to your email' },
                { icon: 'id-card-outline', text: 'Bring your valid driver\'s license and ID' },
                { icon: 'checkmark-circle-outline', text: 'Arrive on time — the rental period starts at pickup time' },
              ].map((item, i) => (
                <View key={i} style={s.nextRow}>
                  <View style={[s.nextIconWrap, { backgroundColor: colors.background }]}>
                    <Icon name={item.icon as any} size={16} color={colors.textSecondary} />
                  </View>
                  <Typo style={[s.nextText, { color: colors.textPrimary }]}>{item.text}</Typo>
                </View>
              ))}
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>
        )}
      </View>

      {/* ── BOTTOM BAR ── */}
      <View
        style={[
          s.bottomBar,
          { backgroundColor: colors.background, borderTopColor: colors.border },
        ]}
      >
        <AppButton
          title="View My Bookings"
          onPress={() => navigation.navigate('CarRentalTabs', { screen: 'Bookings' })}
        />
        <TouchableOpacity
          style={s.homeBtn}
          onPress={() => navigation.navigate('CarRentalTabs', { screen: 'Home' })}
        >
          <Icon name="home-outline" size={18} color={GREEN} />
          <Typo style={s.homeBtnText}>Home</Typo>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default BookingStatusScreen;

/* ── Detail row ── */
function DetailRow({
  icon, label, value, valueColor, isLast,
}: {
  icon: string; label: string; value: string; valueColor?: string; isLast?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        dr.row,
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
      ]}
    >
      <Icon name={icon as any} size={15} color={colors.textSecondary} />
      <Typo style={[dr.label, { color: colors.textSecondary }]}>{label}</Typo>
      <Typo
        style={[
          dr.value,
          { color: valueColor ?? colors.textPrimary },
        ]}
        numberOfLines={1}
      >
        {value}
      </Typo>
    </View>
  );
}
const dr = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    gap: 10,
  },
  label: { flex: 1, fontSize: 13 },
  value: { fontSize: 13, fontWeight: '600', maxWidth: '55%', textAlign: 'right' },
});

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: GREEN },

  /* hero */
  hero: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 8,
  },
  successRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  successInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  heroCarName: { fontSize: 15, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  heroPriceRow: { alignItems: 'center', gap: 2 },
  heroPriceSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.5 },
  heroPrice: { fontSize: 30, fontWeight: '800', color: '#fff' },

  /* card */
  card: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  loadingWrap: { alignItems: 'center', paddingTop: 60, gap: 14 },
  loadingText: { fontSize: 14 },
  cardContent: { paddingTop: 24, paddingHorizontal: 16, paddingBottom: 100 },

  /* collection code */
  codeCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: GREEN,
    marginBottom: 16,
    gap: 6,
  },
  codeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: GREEN,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  codeValue: {
    fontSize: 36,
    fontWeight: '900',
    color: GREEN,
    letterSpacing: 8,
    fontVariant: ['tabular-nums'],
  },
  codeHintRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  codeHint: { fontSize: 12 },

  /* subtitle */
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 8,
  },

  /* details card */
  detailsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },

  /* timeline */
  timelineCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  timeline: { flexDirection: 'row', gap: 14 },
  timelineLeft: { alignItems: 'center', paddingTop: 4, width: 12 },
  timelineDot: { width: 12, height: 12, borderRadius: 6 },
  timelineDotGreen: { backgroundColor: GREEN },
  timelineDotOrange: { backgroundColor: '#F59E0B' },
  timelineLine: { flex: 1, width: 2, marginVertical: 4 },
  timelineRight: { flex: 1, gap: 16 },
  timelineLeg: { gap: 3 },
  timelineLegLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  timelineLegDate: { fontSize: 14, fontWeight: '700' },
  timelineLegPlace: { fontSize: 12 },

  /* what's next */
  nextCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 4,
  },
  nextRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 6 },
  nextIconWrap: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
  },
  nextText: { flex: 1, fontSize: 13, lineHeight: 18 },

  /* bottom bar */
  bottomBar: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 28,
    gap: 10,
  },
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  homeBtnText: { fontSize: 14, fontWeight: '600', color: GREEN },
});
