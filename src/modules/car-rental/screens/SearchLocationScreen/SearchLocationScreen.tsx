import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@react-native-vector-icons/ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';

import { Typo } from '@/components/AppText/Typo';
import { AppInput } from '@/components/AppInput/Input';
import { AppButton } from '@/components/AppButton/CustomButton';
import { Country, fetchCountries } from '@/services/country.service';
import { CountryPickerModal } from '@/components/CountryPickerModal/CountryPickerModal';
import { getFlagEmoji } from '@/helpers/countryFlag';
import { formatDate, formatTime } from '@/helpers/dateTime';
import { searchRentalCars } from '@/services/rental.service';
import { showError } from '@/helpers/toast';
import {
  listRentalLocations,
  searchRentalLocations,
} from '@/services/location.service';
import type { RentalLocation } from '@/types/rental';
import {
  DateRangePicker,
  DateRangeResult,
} from '@/components/DateRangePicker/DateRangePicker';
import { useTheme } from '@/theme/ThemeProvider';

const GREEN = '#0A6A4B';
const GREEN_LIGHT = '#E6F4EF';

type SearchField = 'pickup' | 'dropoff';
type SearchResultsByField = Record<SearchField, RentalLocation[]>;
type SearchFlagByField = Record<SearchField, boolean>;

const SearchLocationScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { mode, colors } = useTheme();

  // ── Location state ───────────────────────────────────────────────────────
  const [sameDropOff, setSameDropOff] = useState(true);
  const [pickupLocationId, setPickupLocationId] = useState('');
  const [dropoffLocationId, setDropoffLocationId] = useState('');
  const [pickupQuery, setPickupQuery] = useState('');
  const [dropoffQuery, setDropoffQuery] = useState('');
  const [pickupSelectedLocation, setPickupSelectedLocation] =
    useState<RentalLocation | null>(null);
  const [dropoffSelectedLocation, setDropoffSelectedLocation] =
    useState<RentalLocation | null>(null);
  const [activeField, setActiveField] = useState<SearchField>('pickup');
  const [fallbackLocations, setFallbackLocations] = useState<RentalLocation[]>([]);
  const [searchResultsByField, setSearchResultsByField] =
    useState<SearchResultsByField>({ pickup: [], dropoff: [] });
  const [searchLoadingByField, setSearchLoadingByField] =
    useState<SearchFlagByField>({ pickup: false, dropoff: false });
  const [searchAttemptedByField, setSearchAttemptedByField] =
    useState<SearchFlagByField>({ pickup: false, dropoff: false });
  const [showResults, setShowResults] = useState(true);
  const latestSearchIdRef = useRef<Record<SearchField, number>>({
    pickup: 0,
    dropoff: 0,
  });
  const [countryIdByCode, setCountryIdByCode] = useState<Record<string, string>>({});

  // ── Country state ────────────────────────────────────────────────────────
  const [countries, setCountries] = useState<Country[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country>({
    name: 'Nigeria',
    callingCode: '+234',
    code: 'NG',
  });

  // ── Date / time state ────────────────────────────────────────────────────
  const defaultPickup = new Date();
  defaultPickup.setHours(10, 0, 0, 0);
  const defaultReturn = new Date(Date.now() + 86400000);
  defaultReturn.setHours(10, 0, 0, 0);

  const [pickupDate, setPickupDate] = useState(defaultPickup);
  const [returnDate, setReturnDate] = useState(defaultReturn);
  const [pickupTimeVal, setPickupTimeVal] = useState({ hour: 10, minute: 0 });
  const [returnTimeVal, setReturnTimeVal] = useState({ hour: 10, minute: 0 });
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // ── Locked car (from VehicleDetails) ────────────────────────────────────
  const lockedCarId: string | undefined = route?.params?.lockedCarId;
  const lockedCar = route?.params?.lockedCar;
  const lockedInsuranceId: string | undefined = route?.params?.insuranceId;
  const lockedPaymentMethod: string | undefined = route?.params?.paymentMethod;

  const [searching, setSearching] = useState(false);

  // Restore params from previous navigation
  useEffect(() => {
    const params = route?.params;
    if (!params) return;
    if (params.pickupDate) setPickupDate(new Date(params.pickupDate));
    if (params.returnDate) setReturnDate(new Date(params.returnDate));
    if (params.pickupTime) {
      const t = new Date(params.pickupTime);
      setPickupTimeVal({ hour: t.getHours(), minute: t.getMinutes() });
    }
    if (params.returnTime) {
      const t = new Date(params.returnTime);
      setReturnTimeVal({ hour: t.getHours(), minute: t.getMinutes() });
    }
  }, [route?.params]);

  useEffect(() => {
    const loadCountries = async () => {
      try {
        setLoadingCountries(true);
        setCountries(await fetchCountries());
      } catch {
        // silent
      } finally {
        setLoadingCountries(false);
      }
    };
    loadCountries();
  }, []);

  useEffect(() => {
    const loadLocationContext = async () => {
      try {
        const locations = await listRentalLocations();
        const map: Record<string, string> = {};
        locations.forEach(loc => {
          if (loc.country?.code && loc.country?.id) {
            map[loc.country.code] = loc.country.id;
          }
        });
        setCountryIdByCode(map);
        setFallbackLocations(locations);
      } catch {
        // silent
      }
    };
    loadLocationContext();
  }, []);

  // Same-dropoff sync
  useEffect(() => {
    if (sameDropOff) {
      setDropoffLocationId(pickupLocationId);
      setDropoffQuery(pickupQuery);
      setDropoffSelectedLocation(pickupSelectedLocation);
      setActiveField('pickup');
    }
  }, [sameDropOff, pickupLocationId, pickupQuery, pickupSelectedLocation]);

  // Location search debounce
  useEffect(() => {
    const field = activeField;
    const activeQuery = field === 'pickup' ? pickupQuery : dropoffQuery;
    const activeSelectedLoc =
      field === 'pickup' ? pickupSelectedLocation : dropoffSelectedLocation;
    const trimmed = activeQuery.trim();

    if (!showResults) return;

    if (
      activeSelectedLoc &&
      trimmed.length > 0 &&
      trimmed === activeSelectedLoc.name
    ) {
      clearSearch(field);
      return;
    }

    if (!trimmed || trimmed.length < 3) {
      clearSearch(field);
      return;
    }

    const countryId = selectedCountry?.code
      ? countryIdByCode[selectedCountry.code]
      : undefined;

    if (!countryId) {
      clearSearch(field);
      return;
    }

    const reqId = (latestSearchIdRef.current[field] ?? 0) + 1;
    latestSearchIdRef.current[field] = reqId;

    const timer = setTimeout(async () => {
      try {
        setSearchLoadingByField(cur => ({ ...cur, [field]: true }));
        const results = await searchRentalLocations({ q: trimmed, countryId });
        if (latestSearchIdRef.current[field] !== reqId) return;
        setSearchResultsByField(cur => ({ ...cur, [field]: results }));
        setSearchAttemptedByField(cur => ({ ...cur, [field]: true }));
      } catch {
        if (latestSearchIdRef.current[field] !== reqId) return;
        setSearchResultsByField(cur => ({ ...cur, [field]: [] }));
        setSearchAttemptedByField(cur => ({ ...cur, [field]: true }));
      } finally {
        if (latestSearchIdRef.current[field] === reqId) {
          setSearchLoadingByField(cur => ({ ...cur, [field]: false }));
        }
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [
    activeField,
    pickupQuery,
    dropoffQuery,
    pickupSelectedLocation,
    dropoffSelectedLocation,
    selectedCountry?.code,
    countryIdByCode,
    showResults,
  ]);

  const clearSearch = (field: SearchField) => {
    setSearchResultsByField(cur => ({ ...cur, [field]: [] }));
    setSearchLoadingByField(cur => ({ ...cur, [field]: false }));
    setSearchAttemptedByField(cur => ({ ...cur, [field]: false }));
  };

  const handleSelectLocation = (location: RentalLocation) => {
    if (activeField === 'pickup') {
      setPickupLocationId(location.id);
      setPickupQuery(location.name);
      setPickupSelectedLocation(location);
      clearSearch('pickup');
      if (sameDropOff) {
        setDropoffLocationId(location.id);
        setDropoffQuery(location.name);
        setDropoffSelectedLocation(location);
        clearSearch('dropoff');
      }
    } else {
      setDropoffLocationId(location.id);
      setDropoffQuery(location.name);
      setDropoffSelectedLocation(location);
      clearSearch('dropoff');
    }
    setShowResults(false);
  };

  const handlePickupChange = (text: string) => {
    setPickupQuery(text);
    setPickupLocationId('');
    setPickupSelectedLocation(null);
    setActiveField('pickup');
    setShowResults(true);
    clearSearch('pickup');
    if (sameDropOff) {
      setDropoffQuery(text);
      setDropoffLocationId('');
      setDropoffSelectedLocation(null);
      clearSearch('dropoff');
    }
  };

  const handleDropoffChange = (text: string) => {
    setDropoffQuery(text);
    setDropoffLocationId('');
    setDropoffSelectedLocation(null);
    setActiveField('dropoff');
    setShowResults(true);
    clearSearch('dropoff');
  };

  const handleDateConfirm = (result: DateRangeResult) => {
    setPickupDate(result.pickupDate);
    setReturnDate(result.returnDate);
    setPickupTimeVal(result.pickupTime);
    setReturnTimeVal(result.returnTime);
    setDatePickerOpen(false);
  };

  const buildDateTime = (date: Date, time: { hour: number; minute: number }) => {
    const d = new Date(date);
    d.setHours(time.hour, time.minute, 0, 0);
    return d;
  };

  const handleSearch = async () => {
    const pickupId = pickupLocationId.trim();
    const dropoffId = (sameDropOff ? pickupLocationId : dropoffLocationId).trim();

    if (!pickupId) {
      showError('Please select a pickup location.');
      return;
    }
    if (!dropoffId) {
      showError('Please select a drop-off location.');
      return;
    }
    if (!selectedCountry?.code) {
      showError('Please select a country.');
      return;
    }

    const pickupDT = buildDateTime(pickupDate, pickupTimeVal);
    const returnDT = buildDateTime(returnDate, returnTimeVal);

    if (returnDT <= pickupDT) {
      showError('Return time must be after pickup time.');
      return;
    }

    const pickupAt = pickupDT.toISOString();
    const returnAt = returnDT.toISOString();

    try {
      setSearching(true);
      const result = await searchRentalCars({
        pickupLocationId: pickupId,
        dropoffLocationId: dropoffId,
        pickupAt,
        returnAt,
        countryCode: selectedCountry.code,
      });

      const pickupName =
        pickupSelectedLocation?.name || pickupQuery.trim();
      const dropoffName = sameDropOff
        ? pickupName
        : dropoffSelectedLocation?.name || dropoffQuery.trim();

      if (lockedCarId && lockedCar) {
        navigation.navigate('VehicleDetails', {
          vehicleId: lockedCarId,
          car: lockedCar,
          search: result.search,
          pickupLocationId: pickupId,
          dropoffLocationId: dropoffId,
          pickupLocationName: pickupName,
          dropoffLocationName: dropoffName,
          insuranceId: lockedInsuranceId,
          paymentMethod: lockedPaymentMethod,
        });
      } else {
        navigation.navigate('ChooseVehicle', {
          search: result.search,
          cars: result.cars,
          pickupLocationId: pickupId,
          dropoffLocationId: dropoffId,
          pickupLocationName: pickupName,
          dropoffLocationName: dropoffName,
          pickupLocation: pickupSelectedLocation,
          dropoffLocation: sameDropOff
            ? pickupSelectedLocation
            : dropoffSelectedLocation,
        });
      }
    } catch (error: any) {
      showError(
        error?.response?.data?.message ||
          'Unable to search cars. Please try again.',
      );
    } finally {
      setSearching(false);
    }
  };

  const activeQuery =
    activeField === 'pickup' ? pickupQuery.trim() : dropoffQuery.trim();
  const activeSelectedLoc =
    activeField === 'pickup' ? pickupSelectedLocation : dropoffSelectedLocation;
  const activeResults = searchResultsByField[activeField];
  const isLoadingResults = searchLoadingByField[activeField];
  const hasAttemptedSearch = searchAttemptedByField[activeField];

  const visibleFallback = fallbackLocations.filter(loc =>
    selectedCountry?.code ? loc.country?.code === selectedCountry.code : true,
  );
  const visibleLocations =
    activeQuery.length >= 3 ? activeResults : visibleFallback;
  const showEmptyState =
    activeQuery.length >= 3 &&
    hasAttemptedSearch &&
    !isLoadingResults &&
    activeResults.length === 0 &&
    !activeSelectedLoc;

  // Formatted date display
  const pickupDT = buildDateTime(pickupDate, pickupTimeVal);
  const returnDT = buildDateTime(returnDate, returnTimeVal);
  const rentalDays = Math.max(
    1,
    Math.round((returnDate.getTime() - pickupDate.getTime()) / 86400000),
  );

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={GREEN} />

      {/* ── GREEN HERO HEADER ── */}
      <View style={s.hero}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={s.heroText}>
          <Typo style={s.heroTitle}>Find a Car</Typo>
          <Typo style={s.heroSub}>Search by location & dates</Typo>
        </View>
        <View style={{ width: 38 }} />
      </View>

      {/* ── WHITE CARD BODY ── */}
      <View style={[s.card, { backgroundColor: colors.background }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={s.cardContent}
        >
          {/* Country selector */}
          <View style={s.countryRow}>
            <TouchableOpacity
              style={[
                s.countryBtn,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={() => setCountryModalVisible(true)}
            >
              <Typo style={s.flagText}>{getFlagEmoji(selectedCountry?.code)}</Typo>
              <Typo style={[s.countryName, { color: colors.textPrimary }]}>{selectedCountry.name}</Typo>
              <Icon name="chevron-down" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* ── PICKUP LOCATION ── */}
          <View style={s.fieldBlock}>
            <Typo style={[s.fieldLabel, { color: colors.textPrimary }]}>
              <Icon name="radio-button-on" size={11} color={GREEN} /> Pick-up Location
            </Typo>
            <AppInput
              placeholder="Search for a location"
              value={pickupQuery}
              onChangeText={handlePickupChange}
              onFocus={() => {
                setActiveField('pickup');
                setShowResults(!pickupSelectedLocation);
              }}
              leftIcon={
                <Icon name="location-outline" size={18} color={colors.textSecondary} />
              }
            />
            {pickupSelectedLocation && (
              <View
                style={[
                  s.selectedTag,
                  { backgroundColor: mode === 'dark' ? '#0F3027' : GREEN_LIGHT },
                ]}
              >
                <Icon name="checkmark-circle" size={14} color={GREEN} />
                <Typo style={s.selectedTagText} numberOfLines={1}>
                  {pickupSelectedLocation.name}
                </Typo>
              </View>
            )}
          </View>

          {/* Same drop-off toggle */}
          <TouchableOpacity
            style={s.checkboxRow}
            onPress={() => setSameDropOff(!sameDropOff)}
          >
            <View
              style={[
                s.checkbox,
                { borderColor: colors.border, backgroundColor: colors.surface },
                sameDropOff && s.checkboxChecked,
              ]}
            >
              {sameDropOff && (
                <Icon name="checkmark" color="#fff" size={13} />
              )}
            </View>
            <Typo style={[s.checkboxLabel, { color: colors.textPrimary }]}>Same location for drop-off</Typo>
          </TouchableOpacity>

          {/* ── DROPOFF LOCATION ── */}
          {!sameDropOff && (
            <View style={s.fieldBlock}>
              <Typo style={[s.fieldLabel, { color: colors.textPrimary }]}>
                <Icon name="radio-button-on" size={11} color="#E53935" /> Drop-off Location
              </Typo>
              <AppInput
                placeholder="Search for a location"
                value={dropoffQuery}
                onChangeText={handleDropoffChange}
                onFocus={() => {
                  setActiveField('dropoff');
                  setShowResults(!dropoffSelectedLocation);
                }}
                leftIcon={
                  <Icon name="location-outline" size={18} color={colors.textSecondary} />
                }
              />
              {dropoffSelectedLocation && (
                <View style={s.selectedTag}>
                  <Icon name="checkmark-circle" size={14} color={GREEN} />
                  <Typo style={s.selectedTagText} numberOfLines={1}>
                    {dropoffSelectedLocation.name}
                  </Typo>
                </View>
              )}
            </View>
          )}

          {/* ── LOCATION SEARCH RESULTS ── */}
          {showResults &&
            (isLoadingResults ||
              visibleLocations.length > 0 ||
              showEmptyState) && (
              <View
                style={[
                  s.resultsBox,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                {isLoadingResults ? (
                  <View style={s.resultsLoading}>
                    <ActivityIndicator size="small" color={GREEN} />
                    <Typo style={[s.resultsHint, { color: colors.textSecondary }]}>Searching locations…</Typo>
                  </View>
                ) : showEmptyState ? (
                  <View style={s.resultsLoading}>
                    <Icon name="search-outline" size={20} color={colors.textSecondary} />
                    <Typo style={[s.resultsHint, { color: colors.textSecondary }]}>No locations found</Typo>
                  </View>
                ) : (
                  visibleLocations.map(location => (
                    <TouchableOpacity
                      key={location.id}
                      style={s.locationItem}
                      onPress={() => handleSelectLocation(location)}
                    >
                      <View
                        style={[
                          s.locationDot,
                          { backgroundColor: colors.background },
                        ]}
                      >
                        <Icon name="location-outline" size={14} color={colors.textSecondary} />
                      </View>
                      <View style={s.locationInfo}>
                        <Typo style={[s.locationName, { color: colors.textPrimary }]}>{location.name}</Typo>
                        {location.address ? (
                          <Typo style={[s.locationAddr, { color: colors.textSecondary }]} numberOfLines={1}>
                            {location.address}
                          </Typo>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}

          {/* ── DATE / TIME CARD ── */}
          <TouchableOpacity
            style={[
              s.dateCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => setDatePickerOpen(true)}
            activeOpacity={0.8}
          >
            <View style={s.dateCardHeader}>
              <Icon name="calendar-outline" size={16} color={colors.textSecondary} />
              <Typo style={[s.dateCardTitle, { color: colors.textPrimary }]}>Rental Period</Typo>
              <View
                style={[
                  s.dateCardBadge,
                  { backgroundColor: colors.background, borderColor: colors.border },
                ]}
              >
                <Typo style={[s.dateCardBadgeText, { color: colors.textSecondary }]}>
                  {rentalDays} day{rentalDays !== 1 ? 's' : ''}
                </Typo>
              </View>
              <Icon
                name="create-outline"
                size={15}
                color={colors.textSecondary}
                style={{ marginLeft: 'auto' }}
              />
            </View>

            <View style={s.dateRow}>
              <View style={s.dateCol}>
                <Typo style={[s.dateColLabel, { color: colors.textSecondary }]}>PICK-UP</Typo>
                <Typo style={[s.dateColDate, { color: colors.textPrimary }]}>{formatDate(pickupDate)}</Typo>
                <Typo style={[s.dateColTime, { color: colors.textSecondary }]}>
                  {String(pickupTimeVal.hour).padStart(2, '0')}:
                  {String(pickupTimeVal.minute).padStart(2, '0')}
                </Typo>
              </View>
              <View style={s.dateArrow}>
                <Icon name="arrow-forward" size={18} color={colors.textSecondary} />
              </View>
              <View style={s.dateCol}>
                <Typo style={[s.dateColLabel, { color: colors.textSecondary }]}>DROP-OFF</Typo>
                <Typo style={[s.dateColDate, { color: colors.textPrimary }]}>{formatDate(returnDate)}</Typo>
                <Typo style={[s.dateColTime, { color: colors.textSecondary }]}>
                  {String(returnTimeVal.hour).padStart(2, '0')}:
                  {String(returnTimeVal.minute).padStart(2, '0')}
                </Typo>
              </View>
            </View>
          </TouchableOpacity>

          {/* spacer for button */}
          <View style={{ height: 80 }} />
        </ScrollView>

        {/* ── SEARCH BUTTON (pinned) ── */}
        <View
          style={[
            s.searchFooter,
            { backgroundColor: colors.background, borderTopColor: colors.border },
          ]}
        >
          <AppButton
            title="Search Available Cars"
            onPress={handleSearch}
            loading={searching}
            disabled={loadingCountries}
          />
        </View>
      </View>

      {/* ── DATE RANGE PICKER MODAL ── */}
      <DateRangePicker
        visible={datePickerOpen}
        initialPickupDate={pickupDate}
        initialReturnDate={returnDate}
        initialPickupTime={pickupTimeVal}
        initialReturnTime={returnTimeVal}
        onConfirm={handleDateConfirm}
        onCancel={() => setDatePickerOpen(false)}
      />

      {/* ── COUNTRY PICKER MODAL ── */}
      <CountryPickerModal
        visible={countryModalVisible}
        countries={countries}
        selected={selectedCountry}
        onClose={() => setCountryModalVisible(false)}
        onSelect={country => {
          setSelectedCountry(country);
          setCountryModalVisible(false);
          setPickupLocationId('');
          setDropoffLocationId('');
          setPickupQuery('');
          setDropoffQuery('');
          setPickupSelectedLocation(null);
          setDropoffSelectedLocation(null);
          clearSearch('pickup');
          clearSearch('dropoff');
          setActiveField('pickup');
          setShowResults(true);
        }}
      />
    </SafeAreaView>
  );
};

export default SearchLocationScreen;

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: GREEN },

  /* ── HERO ── */
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: { flex: 1, alignItems: 'center' },
  heroTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  heroSub: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 2 },

  /* ── CARD ── */
  card: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  cardContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },

  /* country row */
  countryRow: { marginBottom: 20 },
  countryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
  },
  flagText: { fontSize: 22 },
  countryName: { flex: 1, fontSize: 14, fontWeight: '600' },

  /* field block */
  fieldBlock: { marginBottom: 12 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.3,
  },

  /* selected tag */
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  selectedTagText: { fontSize: 12, color: GREEN, fontWeight: '600', flex: 1 },

  /* same dropoff checkbox */
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  checkboxLabel: { fontSize: 14 },

  /* location results */
  resultsBox: {
    marginBottom: 16,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  resultsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
  },
  resultsHint: { fontSize: 13 },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  locationDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationInfo: { flex: 1 },
  locationName: { fontSize: 14, fontWeight: '600' },
  locationAddr: { fontSize: 12, marginTop: 1 },

  /* date card */
  dateCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 4,
    gap: 14,
  },
  dateCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateCardTitle: { fontSize: 14, fontWeight: '700' },
  dateCardBadge: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  dateCardBadgeText: { fontSize: 11, fontWeight: '700' },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateCol: { flex: 1 },
  dateArrow: { paddingHorizontal: 8 },
  dateColLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  dateColDate: { fontSize: 14, fontWeight: '700' },
  dateColTime: { fontSize: 12, fontWeight: '600', marginTop: 2 },

  /* search footer */
  searchFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    borderTopWidth: 1,
  },
});
