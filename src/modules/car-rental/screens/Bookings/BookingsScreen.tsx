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

const TABS: { key: BookingBucket; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'active', label: 'Active' },
  { key: 'past', label: 'Past' },
];

const BookingsScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();

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
          Your trips
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
              placeholder="Search by car, booking ID, pickup code…"
              placeholderTextColor={colors.textSecondary}
              style={[s.searchInput, { color: colors.textPrimary }]}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>
        </View>
      )}

      {/* TABS */}
      <View style={[s.tabRow, { borderBottomColor: colors.border }]}>
        {TABS.map(t => {
          const active = tab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              style={s.tabItem}
              onPress={() => setTab(t.key)}
              activeOpacity={0.7}
            >
              <Typo
                style={[
                  s.tabLabel,
                  {
                    color: active ? colors.textPrimary : colors.textSecondary,
                  },
                  active && s.tabLabelActive,
                ]}
              >
                {t.label}
              </Typo>
              <View
                style={[
                  s.tabCountPill,
                  {
                    backgroundColor: active ? '#0A6A4B' : colors.background,
                    borderColor: active ? '#0A6A4B' : colors.border,
                  },
                ]}
              >
                <Typo
                  style={[
                    s.tabCount,
                    { color: active ? '#fff' : colors.textSecondary },
                  ]}
                >
                  {counts[t.key]}
                </Typo>
              </View>
              {active && (
                <View style={[s.tabUnderline, { backgroundColor: '#0A6A4B' }]} />
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
          />
        ) : (
          filtered.map(b => (
            <BookingCard
              key={b.id}
              bookingId={b.id}
              carName={b.car ? `${b.car.brand} ${b.car.model}` : 'Vehicle'}
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
}: {
  tab: BookingBucket;
  isSearching: boolean;
  onBrowse: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  const meta = isSearching
    ? {
        icon: 'search-outline' as const,
        title: 'No matches',
        body: 'Try a different car name, booking ID, or pickup code.',
        cta: null,
      }
    : tab === 'upcoming'
    ? {
        icon: 'calendar-outline' as const,
        title: 'No upcoming trips',
        body: 'Once you book a car, the next pickup will show up here.',
        cta: 'Browse cars',
      }
    : tab === 'active'
    ? {
        icon: 'car-sport-outline' as const,
        title: 'No active trips',
        body: 'A trip becomes active once your pickup window starts.',
        cta: 'Browse cars',
      }
    : {
        icon: 'time-outline' as const,
        title: 'Nothing here yet',
        body: 'Completed and cancelled trips will appear here.',
        cta: 'Browse cars',
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

  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    marginRight: 24,
  },
  tabLabel: { fontSize: 14, fontWeight: '500' },
  tabLabelActive: { fontWeight: '700' },
  tabCountPill: {
    minWidth: 22,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabCount: { fontSize: 11, fontWeight: '700' },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 2,
  },

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
