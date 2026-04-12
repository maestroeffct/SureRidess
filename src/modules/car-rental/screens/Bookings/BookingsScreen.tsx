import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';

import { ScreenWrapper } from '@/components/Screenwrapper/Screenwrapper';
import { BookingCard } from '@/components/Rental/BookingCard/BookingCard';
import { useNavigation } from '@react-navigation/native';
import { fetchUserBookings } from '@/services/booking.service';
import { Typo } from '@/components/AppText/Typo';
import { useTheme } from '@/theme/ThemeProvider';

type RawBooking = {
  id: string;
  status: string;
  collectionCode?: string | null;
  paymentMethod?: string | null;
  totalPrice?: number;
  currency?: string;
  pickupAt: string;
  returnAt: string;
  car?: {
    brand: string;
    model: string;
    images?: Array<{ url: string }>;
    location?: { name?: string; address?: string } | null;
  } | null;
};

const TABS = [
  { key: 'in_progress' as const, label: 'Active' },
  { key: 'completed' as const, label: 'History' },
];

const BookingsScreen = () => {
  const { colors } = useTheme();
  const [tab, setTab] = useState<'in_progress' | 'completed'>('in_progress');
  const [bookings, setBookings] = useState<RawBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');

  const navigation = useNavigation<any>();

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await fetchUserBookings();
      setBookings(data as RawBooking[]);
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookings.filter(b => {
      const inTab =
        tab === 'in_progress'
          ? b.status === 'PENDING' || b.status === 'CONFIRMED'
          : b.status === 'COMPLETED' || b.status === 'CANCELLED';

      if (!inTab) return false;
      if (!q) return true;

      const carName = b.car ? `${b.car.brand} ${b.car.model}`.toLowerCase() : '';
      const bookingId = b.id.toLowerCase();
      const code = (b.collectionCode ?? '').toLowerCase();
      return (
        carName.includes(q) ||
        bookingId.includes(q) ||
        code.includes(q)
      );
    });
  }, [bookings, tab, query]);

  const counts = useMemo(() => ({
    in_progress: bookings.filter(b => b.status === 'PENDING' || b.status === 'CONFIRMED').length,
    completed: bookings.filter(b => b.status === 'COMPLETED' || b.status === 'CANCELLED').length,
  }), [bookings]);

  return (
    <ScreenWrapper padded={false}>
      {/* ── HEADER ── */}
      <View style={[s.header, { backgroundColor: colors.background }]}>
        <Typo style={[s.headerTitle, { color: colors.textPrimary }]}>My Bookings</Typo>
        <Typo variant="caption" style={[s.headerSub, { color: colors.textSecondary }]}>
          {bookings.length} total reservation{bookings.length !== 1 ? 's' : ''}
        </Typo>
      </View>

      {/* ── SEARCH ── */}
      <View style={s.searchWrap}>
        <View style={[s.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Icon name="search-outline" size={18} color={colors.textSecondary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by car, booking ID…"
            placeholderTextColor={colors.textSecondary}
            style={[s.searchInput, { color: colors.textPrimary }]}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* ── TABS ── */}
      <View style={[s.tabRow, { borderBottomColor: colors.border }]}>
        {TABS.map(t => (
          <View key={t.key} style={s.tabItem}>
            <Typo
              style={[s.tabLabel, { color: colors.textSecondary }, tab === t.key && s.tabLabelActive, tab === t.key && { color: colors.textPrimary }]}
              onPress={() => setTab(t.key)}
            >
              {t.label}
              {'  '}
              <Typo
                style={[
                  s.tabCount,
                  tab === t.key && s.tabCountActive,
                ]}
              >
                {counts[t.key]}
              </Typo>
            </Typo>
            {tab === t.key && <View style={s.tabUnderline} />}
          </View>
        ))}
      </View>

      {/* ── LIST ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#0A6A4B" />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color="#0A6A4B" style={{ marginTop: 60 }} />
        ) : filtered.length === 0 ? (
          <View style={s.emptyWrap}>
            <Icon name="calendar-outline" size={48} color="#D1D5DB" />
            <Typo style={[s.emptyTitle, { color: colors.textPrimary }]}>
              {query ? 'No results' : tab === 'in_progress' ? 'No active bookings' : 'No past bookings'}
            </Typo>
            <Typo variant="caption" style={[s.emptySub, { color: colors.textSecondary }]}>
              {query
                ? 'Try a different search term'
                : tab === 'in_progress'
                ? 'Your upcoming and active rentals will appear here'
                : 'Your completed and cancelled rentals will appear here'}
            </Typo>
          </View>
        ) : (
          filtered.map(b => (
            <BookingCard
              key={b.id}
              bookingId={b.id}
              carName={b.car ? `${b.car.brand} ${b.car.model}` : 'Vehicle'}
              imageUrl={b.car?.images?.[0]?.url}
              pickupLocation={b.car?.location?.name ?? b.car?.location?.address}
              dropoffLocation={b.car?.location?.name ?? b.car?.location?.address}
              pickupAt={b.pickupAt}
              returnAt={b.returnAt}
              collectionCode={b.collectionCode ?? undefined}
              status={b.status}
              totalPrice={b.totalPrice}
              currency={b.currency ?? 'NGN'}
              onPress={() =>
                navigation.navigate('CarRentalFlowNavigator', {
                  screen: 'BookingDetails',
                  params: { bookingId: b.id },
                })
              }
            />
          ))
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

const s = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  headerSub: {
    marginTop: 2,
    color: '#6B7280',
  },

  searchWrap: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    paddingVertical: 0,
  },

  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 8,
  },
  tabItem: {
    marginRight: 28,
    paddingBottom: 0,
  },
  tabLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#9CA3AF',
    paddingBottom: 10,
  },
  tabLabelActive: {
    color: '#111827',
    fontWeight: '600',
  },
  tabCount: {
    fontSize: 12,
    fontWeight: '400',
    color: '#9CA3AF',
  },
  tabCountActive: {
    color: '#0A6A4B',
    fontWeight: '600',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#0A6A4B',
    borderRadius: 2,
  },

  list: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },

  emptyWrap: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
  },
  emptySub: {
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default BookingsScreen;
