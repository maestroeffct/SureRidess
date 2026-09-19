import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { ScreenWrapper } from '@/components/Screenwrapper/Screenwrapper';
import { BookingCard } from '@/components/Rental/BookingCard/BookingCard';
import { Typo } from '@/components/AppText/Typo';
import { fetchUserBookings } from '@/services/booking.service';
import { useTheme } from '@/theme/ThemeProvider';
import {
  BookingBucket,
  getBookingStatusInfo,
} from '@/helpers/bookingStatus';

type RawBooking = {
  id: string;
  status: string;
  collectionCode?: string | null;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  totalPrice?: number;
  currency?: string;
  pickupAt: string;
  returnAt: string;
  hasReview?: boolean;
  reviewRating?: number | null;
  car?: {
    brand: string;
    model: string;
    images?: Array<{ url: string }>;
    location?: { name?: string; address?: string } | null;
  } | null;
};

/** True when the booking still needs an online payment before it's
 *  usable. COLLECTION bookings don't count — they pay in cash. */
function needsPayment(b: RawBooking): boolean {
  const ps = (b.paymentStatus ?? '').toUpperCase();
  const method = (b.paymentMethod ?? 'ONLINE').toUpperCase();
  return (
    b.status?.toUpperCase() === 'PENDING' &&
    method !== 'COLLECTION' &&
    (ps === 'UNPAID' || ps === 'REQUIRES_ACTION' || ps === 'FAILED')
  );
}

type EnrichedBooking = RawBooking & { bucket: BookingBucket };

const BookingsScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const { t } = useTranslation('carRental');

  const TABS: { key: BookingBucket; label: string }[] = [
    { key: 'upcoming', label: t('bookingsScreen.tabUpcoming') },
    { key: 'active', label: t('bookingsScreen.tabActive') },
    { key: 'past', label: t('bookingsScreen.tabPast') },
  ];

  const [tab, setTab] = useState<BookingBucket>('upcoming');
  const [bookings, setBookings] = useState<EnrichedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = (await fetchUserBookings()) as RawBooking[];
      // Pre-compute each booking's bucket once so filter/count loops are cheap.
      const enriched: EnrichedBooking[] = data.map(b => ({
        ...b,
        bucket: getBookingStatusInfo(b.status, b.pickupAt, b.returnAt).bucket,
      }));
      setBookings(enriched);
    } catch (e) {
      console.warn('[Bookings] Failed to load', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRefresh = () => {
    setRefreshing(true);
    load(true);
  };

  // Tab-specific sort: upcoming → earliest pickup first;
  // active → earliest return first (so "ending soonest" floats up);
  // past → most recent end first.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const inTab = bookings.filter(b => b.bucket === tab);

    const matchesQuery = (b: EnrichedBooking) => {
      if (!q) return true;
      const carName = b.car
        ? `${b.car.brand} ${b.car.model}`.toLowerCase()
        : '';
      const code = (b.collectionCode ?? '').toLowerCase();
      return (
        carName.includes(q) ||
        b.id.toLowerCase().includes(q) ||
        code.includes(q)
      );
    };

    const sorted = [...inTab].sort((a, b) => {
      const aPickup = new Date(a.pickupAt).getTime() || 0;
      const bPickup = new Date(b.pickupAt).getTime() || 0;
      const aReturn = new Date(a.returnAt).getTime() || 0;
      const bReturn = new Date(b.returnAt).getTime() || 0;
      if (tab === 'upcoming') return aPickup - bPickup;
      if (tab === 'active') return aReturn - bReturn;
      return bReturn - aReturn;
    });

    return sorted.filter(matchesQuery);
  }, [bookings, tab, query]);

  const counts = useMemo(
    () => ({
      upcoming: bookings.filter(b => b.bucket === 'upcoming').length,
      active: bookings.filter(b => b.bucket === 'active').length,
      past: bookings.filter(b => b.bucket === 'past').length,
    }),
    [bookings],
  );

  const browseCars = () =>
    navigation.navigate('CarRentalTabs', { screen: 'Explore' });

  return (
    <ScreenWrapper padded={false}>
      {/* HEADER */}
      <View style={s.header}>
        <Typo style={[s.headerTitle, { color: colors.textPrimary }]}>
          {t('bookingsScreen.title')}
        </Typo>
        <TouchableOpacity
          style={[
            s.headerSearchBtn,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={() => {
            setSearchOpen(open => !open);
            if (searchOpen) setQuery('');
          }}
          activeOpacity={0.8}
        >
          <Icon
            name={searchOpen ? 'close-outline' : 'search-outline'}
            size={20}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      {searchOpen && (
        <View style={s.searchWrap}>
          <View
            style={[
              s.searchBox,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Icon
              name="search-outline"
              size={18}
              color={colors.textSecondary}
            />
            <TextInput
              autoFocus
              value={query}
              onChangeText={setQuery}
              placeholder={t('bookingsScreen.searchPlaceholder')}
              placeholderTextColor={colors.textSecondary}
              style={[s.searchInput, { color: colors.textPrimary }]}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>
        </View>
      )}

      {/* ── SEGMENTED FILTER (icon + label + count) ────────────
          Rounded segmented control replaces the old underlined-tab
          bar. The active segment gets a solid brand fill; inactive
          segments show a soft muted count chip for at-a-glance
          workload. Icons anchor the labels so users can find the
          right filter without reading. */}
      <View style={[s.segWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {TABS.map(t => {
          const active = tab === t.key;
          const iconName =
            t.key === 'upcoming' ? 'calendar-outline'
              : t.key === 'active' ? 'ellipse'
                : 'checkmark-done-outline';
          const c = counts[t.key];
          return (
            <TouchableOpacity
              key={t.key}
              style={[
                s.segItem,
                active && { backgroundColor: '#0A6A4B' },
              ]}
              onPress={() => setTab(t.key)}
              activeOpacity={0.85}
            >
              <Icon
                name={iconName as any}
                size={t.key === 'active' ? 8 : 14}
                color={active ? '#fff' : colors.textSecondary}
                style={t.key === 'active' ? { marginRight: 2 } : undefined}
              />
              <Typo
                style={[
                  s.segLabel,
                  { color: active ? '#fff' : colors.textPrimary },
                ]}
              >
                {t.label}
              </Typo>
              {c > 0 && (
                <View
                  style={[
                    s.segCount,
                    {
                      backgroundColor: active
                        ? 'rgba(255,255,255,0.22)'
                        : colors.background,
                    },
                  ]}
                >
                  <Typo
                    style={[
                      s.segCountText,
                      { color: active ? '#fff' : colors.textSecondary },
                    ]}
                  >
                    {c}
                  </Typo>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* LIST */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#0A6A4B"
          />
        }
      >
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#0A6A4B"
            style={{ marginTop: 60 }}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            tab={tab}
            isSearching={!!query.trim()}
            onBrowse={browseCars}
            colors={colors}
            t={t}
          />
        ) : (
          filtered.map(b => (
            <BookingCard
              key={b.id}
              bookingId={b.id}
              carName={b.car ? `${b.car.brand} ${b.car.model}` : t('bookingsScreen.vehicleFallback')}
              imageUrl={b.car?.images?.[0]?.url}
              pickupLocation={
                b.car?.location?.name ?? b.car?.location?.address
              }
              dropoffLocation={
                b.car?.location?.name ?? b.car?.location?.address
              }
              pickupAt={b.pickupAt}
              returnAt={b.returnAt}
              collectionCode={b.collectionCode ?? undefined}
              status={b.status}
              totalPrice={b.totalPrice}
              currency={b.currency ?? 'NGN'}
              needsPayment={needsPayment(b)}
              hasReview={b.hasReview ?? false}
              reviewRating={b.reviewRating ?? null}
              onPress={() => {
                // Unpaid + online → jump straight to checkout so the
                // customer can complete payment without another tap.
                if (needsPayment(b)) {
                  navigation.navigate('CarRentalFlowNavigator', {
                    screen: 'PaymentScreen',
                    params: {
                      bookingId: b.id,
                      vehicleId: undefined,
                      paymentMethod: 'ONLINE',
                    },
                  });
                  return;
                }
                navigation.navigate('CarRentalFlowNavigator', {
                  screen: 'BookingDetails',
                  params: { bookingId: b.id },
                });
              }}
            />
          ))
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

export default BookingsScreen;

/* ────────────────────────────────────────────────── */
/*  Empty state                                       */
/* ────────────────────────────────────────────────── */

function EmptyState({
  tab,
  isSearching,
  onBrowse,
  colors,
  t,
}: {
  tab: BookingBucket;
  isSearching: boolean;
  onBrowse: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
  t: (key: string) => string;
}) {
  const meta = isSearching
    ? {
        icon: 'search-outline' as const,
        title: t('bookingsScreen.emptyNoMatchesTitle'),
        body: t('bookingsScreen.emptyNoMatchesBody'),
        cta: null,
      }
    : tab === 'upcoming'
    ? {
        icon: 'calendar-outline' as const,
        title: t('bookingsScreen.emptyUpcomingTitle'),
        body: t('bookingsScreen.emptyUpcomingBody'),
        cta: t('bookingsScreen.browseCars'),
      }
    : tab === 'active'
    ? {
        icon: 'car-sport-outline' as const,
        title: t('bookingsScreen.emptyActiveTitle'),
        body: t('bookingsScreen.emptyActiveBody'),
        cta: t('bookingsScreen.browseCars'),
      }
    : {
        icon: 'time-outline' as const,
        title: t('bookingsScreen.emptyPastTitle'),
        body: t('bookingsScreen.emptyPastBody'),
        cta: t('bookingsScreen.browseCars'),
      };

  return (
    <View style={s.emptyWrap}>
      <View
        style={[
          s.emptyIcon,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Icon name={meta.icon} size={28} color={colors.textSecondary} />
      </View>
      <Typo style={[s.emptyTitle, { color: colors.textPrimary }]}>
        {meta.title}
      </Typo>
      <Typo style={[s.emptyBody, { color: colors.textSecondary }]}>
        {meta.body}
      </Typo>
      {meta.cta ? (
        <TouchableOpacity
          style={s.emptyCta}
          onPress={onBrowse}
          activeOpacity={0.85}
        >
          <Typo style={s.emptyCtaText}>{meta.cta}</Typo>
          <Icon name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

/* ────────────────────────────────────────────────── */
/*  Styles                                            */
/* ────────────────────────────────────────────────── */

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 24, fontWeight: '700' },
  headerSearchBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchWrap: { paddingHorizontal: 20, marginBottom: 10 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 46,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },

  segWrap: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 14,
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  segItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 11,
  },
  segLabel: { fontSize: 13, fontWeight: '700' },
  segCount: {
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segCountText: { fontSize: 11, fontWeight: '800' },

  list: { paddingHorizontal: 20, paddingBottom: 40 },

  emptyWrap: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptyBody: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0A6A4B',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginTop: 14,
  },
  emptyCtaText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
