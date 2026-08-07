import React, { useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@react-native-vector-icons/ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';

import { Typo } from '@/components/AppText/Typo';
import { useTheme } from '@/theme/ThemeProvider';
import { CarCard } from '@/components/Rental/CarCard/CarCard';
import { formatDate, formatTime } from '@/helpers/dateTime';
import type { RentalCar } from '@/types/rental';
import { CategoryChips } from '@/components/Rental/CategoryChips/CategoryChips';
import { getCarWithFeatures, searchRentalCars } from '@/services/rental.service';
import { DateRangePicker, DateRangeResult } from '@/components/DateRangePicker/DateRangePicker';
import {
  FilterModal,
  FilterState,
  DEFAULT_FILTERS,
} from '@/components/FilterModal/FilterModal';
import { showError } from '@/helpers/toast';

const GREEN = '#0A6A4B';

const ChooseVehicleScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors } = useTheme();

  const initialCars: RentalCar[] = route?.params?.cars ?? [];
  const initialSearch = route?.params?.search;
  const pickupLocationId = route?.params?.pickupLocationId;
  const dropoffLocationId = route?.params?.dropoffLocationId;
  const pickupLocationName = route?.params?.pickupLocationName;
  const dropoffLocationName = route?.params?.dropoffLocationName;
  const pickupLocation = route?.params?.pickupLocation;
  const dropoffLocation = route?.params?.dropoffLocation;

  const showDropoff =
    dropoffLocationId && dropoffLocationId !== pickupLocationId;

  // ── Date / time state (derived from search params) ──────────────────────
  const [search, setSearch] = useState(initialSearch);
  const [cars, setCars] = useState<RentalCar[]>(initialCars);

  const pickupAt = search?.pickupAt ? new Date(search.pickupAt) : null;
  const returnAt = search?.returnAt ? new Date(search.returnAt) : null;

  const pickupStr = pickupAt
    ? `${formatDate(pickupAt)}, ${formatTime(pickupAt)}`
    : 'Select date';
  const returnStr = returnAt
    ? `${formatDate(returnAt)}, ${formatTime(returnAt)}`
    : 'Select date';

  // ── Modals ───────────────────────────────────────────────────────────────
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [reSearching, setReSearching] = useState(false);

  // ── Features enrichment ──────────────────────────────────────────────────
  const [displayCars, setDisplayCars] = useState<RentalCar[]>(initialCars);

  useEffect(() => {
    setDisplayCars(cars);
  }, [cars]);

  useEffect(() => {
    const loadFeatures = async () => {
      const missing = cars.filter(
        (car: RentalCar) => !car.features && !car.groupedFeatures,
      );
      if (missing.length === 0) return;
      try {
        const enriched = await Promise.all(
          missing.map(async (car: RentalCar) => {
            try {
              const detail = await getCarWithFeatures(car.id);
              return {
                ...car,
                ...detail,
                location: detail.location ?? car.location,
                provider: detail.provider ?? car.provider,
                images: car.images?.length ? car.images : detail.images ?? [],
              } as RentalCar;
            } catch {
              return car;
            }
          }),
        );
        const enrichedMap = new Map(enriched.map((car: RentalCar) => [car.id, car]));
        setDisplayCars(prev =>
          prev.map((car: RentalCar) => enrichedMap.get(car.id) ?? car),
        );
      } catch {
        // keep original cars
      }
    };
    loadFeatures();
  }, [cars]);

  // ── Category chips ────────────────────────────────────────────────────────
  const categories = Array.from(
    new Set(
      displayCars
        .map((car: RentalCar) => car.category)
        .filter((c): c is string => !!c),
    ),
  );

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    const pickupLocationId = search?.pickupLocationId;
    const dropoffLocationId = search?.dropoffLocationId ?? pickupLocationId;
    const pickupIso = search?.pickupAt;
    const returnIso = search?.returnAt;
    if (!pickupLocationId || !pickupIso || !returnIso) return;
    setRefreshing(true);
    try {
      const res = await searchRentalCars({
        pickupLocationId,
        dropoffLocationId,
        pickupAt: pickupIso,
        returnAt: returnIso,
        countryCode:
          pickupLocation?.country?.code ||
          dropoffLocation?.country?.code ||
          'NG',
      });
      setCars(res.cars);
      setSearch(res.search);
    } catch {}
    finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0]);
    }
  }, [categories, selectedCategory]);

  // ── Apply filters + category ──────────────────────────────────────────────
  let filtered: RentalCar[] = selectedCategory
    ? displayCars.filter((c: RentalCar) => c.category === selectedCategory)
    : displayCars;

  if (filters.transmission) {
    filtered = filtered.filter(
      (c: RentalCar) => c.transmission === filters.transmission,
    );
  }
  if (filters.ac !== null) {
    filtered = filtered.filter((c: RentalCar) => c.hasAC === filters.ac);
  }
  if (filters.seats !== null) {
    filtered = filtered.filter(
      (c: RentalCar) => (c.seats ?? 0) >= (filters.seats ?? 0),
    );
  }
  if (filters.sort === 'price_asc') {
    filtered = [...filtered].sort(
      (a: RentalCar, b: RentalCar) => (a.dailyRate ?? 0) - (b.dailyRate ?? 0),
    );
  } else if (filters.sort === 'price_desc') {
    filtered = [...filtered].sort(
      (a: RentalCar, b: RentalCar) => (b.dailyRate ?? 0) - (a.dailyRate ?? 0),
    );
  }

  const activeFilterCount = [
    filters.sort,
    filters.transmission,
    filters.ac,
    filters.seats,
  ].filter(v => v !== null).length;

  // ── Edit search (re-search with new dates) ────────────────────────────────
  const handleDateConfirm = async (result: DateRangeResult) => {
    setDatePickerVisible(false);

    const pickupIso = (() => {
      const d = new Date(result.pickupDate);
      d.setHours(result.pickupTime.hour, result.pickupTime.minute, 0, 0);
      return d.toISOString();
    })();

    const returnIso = (() => {
      const d = new Date(result.returnDate);
      d.setHours(result.returnTime.hour, result.returnTime.minute, 0, 0);
      return d.toISOString();
    })();

    if (new Date(returnIso) <= new Date(pickupIso)) {
      showError('Return time must be after pickup time.');
      return;
    }

    try {
      setReSearching(true);
      const res = await searchRentalCars({
        pickupLocationId,
        dropoffLocationId: dropoffLocationId || pickupLocationId,
        pickupAt: pickupIso,
        returnAt: returnIso,
        countryCode:
          pickupLocation?.country?.code ||
          dropoffLocation?.country?.code ||
          'NG',
      });
      setCars(res.cars);
      setSearch(res.search);
      setSelectedCategory(null);
    } catch (err: any) {
      showError(
        err?.response?.data?.message ||
          'Unable to search cars. Please try again.',
      );
    } finally {
      setReSearching(false);
    }
  };

  const openDatePicker = () => setDatePickerVisible(true);

  const initialPickupDate = pickupAt ?? new Date();
  const initialReturnDate = returnAt ?? new Date(Date.now() + 86400000);
  const initialPickupTime = { hour: initialPickupDate.getHours(), minute: Math.floor(initialPickupDate.getMinutes() / 15) * 15 };
  const initialReturnTime = { hour: initialReturnDate.getHours(), minute: Math.floor(initialReturnDate.getMinutes() / 15) * 15 };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={GREEN} />

      {/* ── GREEN HEADER ── */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Typo style={s.headerTitle}>Choose Vehicle</Typo>
        <View style={s.headerRight} />
      </View>

      {/* ── TRIP SUMMARY CARD ── */}
      <View style={[s.summaryCard, { backgroundColor: colors.surface }]}>
        <View style={s.summaryRow}>
          <View style={s.summaryDotCol}>
            <View style={[s.dot, s.dotGreen]} />
            <View style={[s.dotLine, { backgroundColor: colors.border }]} />
            <View style={[s.dot, s.dotRed]} />
          </View>
          <View style={s.summaryTextCol}>
            <View style={s.summaryLeg}>
              <Typo style={[s.summaryLabel, { color: colors.textSecondary }]}>Pickup</Typo>
              <Typo style={[s.summaryLocation, { color: colors.textPrimary }]} numberOfLines={1}>
                {pickupLocationName || pickupLocationId || 'Select location'}
              </Typo>
              <Typo style={[s.summaryTime, { color: colors.textSecondary }]}>{pickupStr}</Typo>
            </View>
            <View style={[s.legDivider, { backgroundColor: colors.border }]} />
            <View style={s.summaryLeg}>
              <Typo style={[s.summaryLabel, { color: colors.textSecondary }]}>Drop-off</Typo>
              <Typo style={[s.summaryLocation, { color: colors.textPrimary }]} numberOfLines={1}>
                {showDropoff
                  ? dropoffLocationName || dropoffLocationId
                  : pickupLocationName || pickupLocationId || 'Same as pickup'}
              </Typo>
              <Typo style={[s.summaryTime, { color: colors.textSecondary }]}>{returnStr}</Typo>
            </View>
          </View>
          <TouchableOpacity style={s.editBtn} onPress={openDatePicker}>
            <Icon name="create-outline" size={16} color={GREEN} />
          </TouchableOpacity>
        </View>

        {reSearching && (
          <View style={[s.reSearchRow, { borderTopColor: colors.border }]}>
            <ActivityIndicator size="small" color={GREEN} />
            <Typo style={s.reSearchText}>Updating results…</Typo>
          </View>
        )}
      </View>

      {/* ── BODY (scrollable) ── */}
      <View style={[s.body, { backgroundColor: colors.background }]}>
        {/* Results count + filter row */}
        <View style={s.toolbar}>
          <Typo style={[s.countLabel, { color: colors.textPrimary }]}>
            {filtered.length}{' '}
            <Typo style={[s.countSub, { color: colors.textSecondary }]}>vehicles available</Typo>
          </Typo>
          <TouchableOpacity
            style={[s.filterChip, activeFilterCount > 0 && s.filterChipActive]}
            onPress={() => setFilterVisible(true)}
          >
            <Icon
              name="options-outline"
              size={15}
              color={activeFilterCount > 0 ? '#fff' : GREEN}
            />
            <Typo
              style={[
                s.filterChipText,
                activeFilterCount > 0 && s.filterChipTextActive,
              ]}
            >
              {activeFilterCount > 0 ? `Filter (${activeFilterCount})` : 'Filter'}
            </Typo>
          </TouchableOpacity>
        </View>

        {/* Category chips */}
        <CategoryChips
          categories={categories.map((category: string) => {
            const firstCar = displayCars.find(
              (c: RentalCar) => c.category === category,
            );
            return {
              label: category,
              image: firstCar?.images?.find((img: any) => img.isPrimary)?.url,
            };
          })}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />

        {/* Vehicle list */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#0A6A4B']}
            />
          }
        >
          {filtered.length === 0 ? (
            <View style={s.emptyState}>
              <Icon name="car-outline" size={48} color={colors.textSecondary} />
              <Typo style={[s.emptyTitle, { color: colors.textPrimary }]}>No vehicles found</Typo>
              <Typo style={[s.emptyText, { color: colors.textSecondary }]}>
                {activeFilterCount > 0
                  ? 'Try adjusting your filters'
                  : 'Try adjusting your search dates or location'}
              </Typo>
              {activeFilterCount > 0 && (
                <TouchableOpacity
                  style={s.clearFiltersBtn}
                  onPress={() => setFilters(DEFAULT_FILTERS)}
                >
                  <Typo style={s.clearFiltersText}>Clear filters</Typo>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filtered.map((car: RentalCar) => (
              <CarCard
                key={car.id}
                car={car}
                onPress={() =>
                  navigation.navigate('VehicleDetails', {
                    vehicleId: car.id,
                    car,
                    search,
                    pickupLocationId,
                    dropoffLocationId,
                    pickupLocationName,
                    dropoffLocationName,
                  })
                }
              />
            ))
          )}
        </ScrollView>
      </View>

      {/* ── DATE RANGE PICKER MODAL ── */}
      <DateRangePicker
        visible={datePickerVisible}
        initialPickupDate={initialPickupDate}
        initialReturnDate={initialReturnDate}
        initialPickupTime={initialPickupTime}
        initialReturnTime={initialReturnTime}
        onConfirm={handleDateConfirm}
        onCancel={() => setDatePickerVisible(false)}
      />

      {/* ── FILTER MODAL ── */}
      <FilterModal
        visible={filterVisible}
        initial={filters}
        onApply={f => {
          setFilters(f);
          setFilterVisible(false);
        }}
        onClose={() => setFilterVisible(false)}
      />
    </SafeAreaView>
  );
};

export default ChooseVehicleScreen;

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: GREEN,
  },

  /* header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  headerRight: {
    width: 38,
  },

  /* summary card */
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 4,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
  },
  summaryDotCol: {
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 4,
    width: 16,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotGreen: { backgroundColor: GREEN },
  dotRed: { backgroundColor: '#E53935' },
  dotLine: {
    flex: 1,
    width: 2,
    marginVertical: 4,
  },
  summaryTextCol: {
    flex: 1,
    gap: 8,
  },
  summaryLeg: { gap: 2 },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryLocation: {
    fontSize: 14,
    fontWeight: '700',
  },
  summaryTime: { fontSize: 12 },
  legDivider: { height: 1 },
  editBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(10, 106, 75, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  reSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  reSearchText: { fontSize: 12, color: GREEN, fontWeight: '600' },

  /* body */
  body: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 12,
    overflow: 'hidden',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  countLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  countSub: {
    fontSize: 14,
    fontWeight: '400',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1.5,
    borderColor: GREEN,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  filterChipActive: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  filterChipText: {
    color: GREEN,
    fontSize: 13,
    fontWeight: '600',
  },
  filterChipTextActive: { color: '#fff' },

  /* list */
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },

  /* empty state */
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 240,
  },
  clearFiltersBtn: {
    marginTop: 4,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: GREEN,
  },
  clearFiltersText: { color: GREEN, fontSize: 13, fontWeight: '600' },
});
