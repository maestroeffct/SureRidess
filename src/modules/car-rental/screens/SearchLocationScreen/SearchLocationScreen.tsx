import React, { useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';

import { ScreenWrapper } from '@/components/Screenwrapper/Screenwrapper';
import { Typo } from '@/components/AppText/Typo';
import { AppInput } from '@/components/AppInput/Input';
import { AppButton } from '@/components/AppButton/CustomButton';
import styles from './styles';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '@/theme/ThemeProvider';
import { Country, fetchCountries } from '@/services/country.service';
import { CountryPickerModal } from '@/components/CountryPickerModal/CountryPickerModal';
import { getFlagEmoji } from '@/helpers/countryFlag';
import { DateTimeRange } from '@/types/search';
import { formatDate, formatTime } from '@/helpers/dateTime';
import { searchRentalCars } from '@/services/rental.service';
import { showError } from '@/helpers/toast';
import {
  listRentalLocations,
  searchRentalLocations,
} from '@/services/location.service';
import type { RentalLocation } from '@/types/rental';

type SearchField = 'pickup' | 'dropoff';
type SearchResultsByField = Record<SearchField, RentalLocation[]>;
type SearchFlagByField = Record<SearchField, boolean>;

const SearchLocationScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors } = useTheme();

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
  const [fallbackLocations, setFallbackLocations] = useState<RentalLocation[]>(
    [],
  );
  const [searchResultsByField, setSearchResultsByField] =
    useState<SearchResultsByField>({
      pickup: [],
      dropoff: [],
    });
  const [searchLoadingByField, setSearchLoadingByField] =
    useState<SearchFlagByField>({
      pickup: false,
      dropoff: false,
    });
  const [searchAttemptedByField, setSearchAttemptedByField] =
    useState<SearchFlagByField>({
      pickup: false,
      dropoff: false,
    });
  const [showResults, setShowResults] = useState(true);
  const latestSearchIdRef = useRef<Record<SearchField, number>>({
    pickup: 0,
    dropoff: 0,
  });
  const [countryIdByCode, setCountryIdByCode] = useState<
    Record<string, string>
  >({});

  const [countries, setCountries] = useState<Country[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [searching, setSearching] = useState(false);

  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country>({
    name: 'Nigeria',
    callingCode: '+234',
    code: 'NG',
  });

  const [dateTime, setDateTime] = useState<DateTimeRange>({
    pickupDate: new Date(),
    pickupTime: new Date(),
    returnDate: new Date(Date.now() + 86400000),
    returnTime: new Date(),
  });

  useEffect(() => {
    if (sameDropOff) {
      setDropoffLocationId(pickupLocationId);
      setDropoffQuery(pickupQuery);
      setDropoffSelectedLocation(pickupSelectedLocation);
      setActiveField('pickup');
    }
  }, [sameDropOff, pickupLocationId, pickupQuery, pickupSelectedLocation]);

  // Car locked from HomeScreen → VehicleDetails flow
  const lockedCarId: string | undefined = route?.params?.lockedCarId;
  const lockedCar = route?.params?.lockedCar;
  const lockedInsuranceId: string | undefined = route?.params?.insuranceId;
  const lockedPaymentMethod: string | undefined = route?.params?.paymentMethod;

  useEffect(() => {
    const params = route?.params;
    if (!params) return;

    setDateTime(prev => ({
      pickupDate: params.pickupDate
        ? new Date(params.pickupDate)
        : prev.pickupDate,
      returnDate: params.returnDate
        ? new Date(params.returnDate)
        : prev.returnDate,
      pickupTime: params.pickupTime
        ? new Date(params.pickupTime)
        : prev.pickupTime,
      returnTime: params.returnTime
        ? new Date(params.returnTime)
        : prev.returnTime,
    }));
  }, [route?.params]);

  useEffect(() => {
    const loadCountries = async () => {
      try {
        setLoadingCountries(true);
        const data = await fetchCountries();
        setCountries(data);
      } catch (e) {
        console.warn('Failed to load countries', e);
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

        locations.forEach(location => {
          const code = location.country?.code;
          const id = location.country?.id;
          if (code && id) {
            map[code] = id;
          }
        });

        setCountryIdByCode(map);
        setFallbackLocations(locations);
      } catch (error) {
        console.warn('Failed to load location country IDs', error);
      }
    };

    loadLocationContext();
  }, []);

  useEffect(() => {
    const field = activeField;
    const activeQuery = field === 'pickup' ? pickupQuery : dropoffQuery;
    const activeSelectedLocation =
      field === 'pickup' ? pickupSelectedLocation : dropoffSelectedLocation;
    const trimmed = activeQuery.trim();

    if (!showResults) {
      return;
    }

    if (
      activeSelectedLocation &&
      trimmed.length > 0 &&
      trimmed === activeSelectedLocation.name
    ) {
      setSearchLoadingByField(current => ({
        ...current,
        [field]: false,
      }));
      setSearchAttemptedByField(current => ({
        ...current,
        [field]: false,
      }));
      setSearchResultsByField(current => ({
        ...current,
        [field]: [],
      }));
      return;
    }

    if (!trimmed || trimmed.length < 3) {
      setSearchLoadingByField(current => ({
        ...current,
        [field]: false,
      }));
      setSearchAttemptedByField(current => ({
        ...current,
        [field]: false,
      }));
      setSearchResultsByField(current => ({
        ...current,
        [field]: [],
      }));
      return;
    }

    const countryId = selectedCountry?.code
      ? countryIdByCode[selectedCountry.code]
      : undefined;

    if (!countryId) {
      setSearchResultsByField(current => ({
        ...current,
        [field]: [],
      }));
      setSearchLoadingByField(current => ({
        ...current,
        [field]: false,
      }));
      setSearchAttemptedByField(current => ({
        ...current,
        [field]: false,
      }));
      return;
    }

    const requestId = latestSearchIdRef.current[field] + 1;
    latestSearchIdRef.current[field] = requestId;

    const timer = setTimeout(async () => {
      try {
        setSearchLoadingByField(current => ({
          ...current,
          [field]: true,
        }));

        const results = await searchRentalLocations({
          q: trimmed,
          countryId,
        });

        if (latestSearchIdRef.current[field] !== requestId) {
          return;
        }

        setSearchResultsByField(current => ({
          ...current,
          [field]: results,
        }));
        setSearchAttemptedByField(current => ({
          ...current,
          [field]: true,
        }));
      } catch (error) {
        if (latestSearchIdRef.current[field] !== requestId) {
          return;
        }

        console.warn('Failed to search locations', error);
        setSearchResultsByField(current => ({
          ...current,
          [field]: [],
        }));
        setSearchAttemptedByField(current => ({
          ...current,
          [field]: true,
        }));
      } finally {
        if (latestSearchIdRef.current[field] === requestId) {
          setSearchLoadingByField(current => ({
            ...current,
            [field]: false,
          }));
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

  const buildIsoDateTime = (date: Date, time: Date) => {
    const combined = new Date(date);
    combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
    return combined.toISOString();
  };

  const clearFieldSearchState = (field: SearchField) => {
    setSearchResultsByField(current => ({
      ...current,
      [field]: [],
    }));
    setSearchLoadingByField(current => ({
      ...current,
      [field]: false,
    }));
    setSearchAttemptedByField(current => ({
      ...current,
      [field]: false,
    }));
  };

  const handleSelectLocation = (location: RentalLocation) => {
    if (activeField === 'pickup') {
      setPickupLocationId(location.id);
      setPickupQuery(location.name);
      setPickupSelectedLocation(location);
      clearFieldSearchState('pickup');

      if (sameDropOff) {
        setDropoffLocationId(location.id);
        setDropoffQuery(location.name);
        setDropoffSelectedLocation(location);
        clearFieldSearchState('dropoff');
      }
    } else {
      setDropoffLocationId(location.id);
      setDropoffQuery(location.name);
      setDropoffSelectedLocation(location);
      clearFieldSearchState('dropoff');
    }

    setShowResults(false);
  };

  const handlePickupChange = (text: string) => {
    setPickupQuery(text);
    setPickupLocationId('');
    setPickupSelectedLocation(null);
    setActiveField('pickup');
    setShowResults(true);
    clearFieldSearchState('pickup');

    if (sameDropOff) {
      setDropoffQuery(text);
      setDropoffLocationId('');
      setDropoffSelectedLocation(null);
      clearFieldSearchState('dropoff');
    }
  };

  const handleDropoffChange = (text: string) => {
    setDropoffQuery(text);
    setDropoffLocationId('');
    setDropoffSelectedLocation(null);
    setActiveField('dropoff');
    setShowResults(true);
    clearFieldSearchState('dropoff');
  };

  const handleSearch = async () => {
    const pickupId = pickupLocationId.trim();
    const dropoffId = (
      sameDropOff ? pickupLocationId : dropoffLocationId
    ).trim();

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

    const pickupAt = buildIsoDateTime(dateTime.pickupDate, dateTime.pickupTime);
    const returnAt = buildIsoDateTime(dateTime.returnDate, dateTime.returnTime);

    if (new Date(returnAt) <= new Date(pickupAt)) {
      showError('Return time must be after pickup time.');
      return;
    }

    try {
      setSearching(true);
      const result = await searchRentalCars({
        pickupLocationId: pickupId,
        dropoffLocationId: dropoffId,
        pickupAt,
        returnAt,
        countryCode: selectedCountry.code,
      });

      const pickupName = pickupSelectedLocation?.name || pickupQuery.trim();
      const dropoffName = sameDropOff
        ? pickupName
        : dropoffSelectedLocation?.name || dropoffQuery.trim();

      if (lockedCarId && lockedCar) {
        // Came from VehicleDetails without dates — jump straight back with data
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

  const activeQuery = activeField === 'pickup' ? pickupQuery.trim() : dropoffQuery.trim();
  const activeSelectedLocation =
    activeField === 'pickup' ? pickupSelectedLocation : dropoffSelectedLocation;
  const activeResults = searchResultsByField[activeField];
  const isLoadingResults = searchLoadingByField[activeField];
  const hasAttemptedSearch = searchAttemptedByField[activeField];
  const visibleFallbackLocations = fallbackLocations.filter(location => {
    if (!selectedCountry?.code) {
      return true;
    }

    return location.country?.code === selectedCountry.code;
  });
  const visibleLocations =
    activeQuery.length >= 3 ? activeResults : visibleFallbackLocations;
  const showEmptyState =
    activeQuery.length >= 3 &&
    hasAttemptedSearch &&
    !isLoadingResults &&
    activeResults.length === 0 &&
    !activeSelectedLocation;

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <Typo variant="heading">Search Location</Typo>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="close" size={26} />
        </TouchableOpacity>
      </View>

      <Typo style={styles.sectionTitle}>Pick-up Location</Typo>

      <View style={styles.input}>
        <AppInput
          placeholder="Search for destinations"
          value={pickupQuery}
          onChangeText={handlePickupChange}
          onFocus={() => {
            setActiveField('pickup');
            setShowResults(!pickupSelectedLocation);
          }}
          leftIcon={
            <Icon
              name="location-outline"
              size={18}
              color={colors.textSecondary}
            />
          }
        />
        <Typo variant="caption" style={styles.helperText}>
          Enter the first 3 letters and wait for results.
        </Typo>
      </View>

      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => setSameDropOff(!sameDropOff)}
      >
        <View style={[styles.checkbox, sameDropOff && styles.checked]}>
          {sameDropOff && <Icon name="checkmark" color="#fff" size={14} />}
        </View>
        <Typo>Same location for drop off</Typo>
      </TouchableOpacity>

      {!sameDropOff && (
        <>
          <Typo style={styles.sectionTitle}>Drop-off Location</Typo>
          <View style={styles.input}>
            <AppInput
              placeholder="Search for destinations"
              value={dropoffQuery}
              onChangeText={handleDropoffChange}
              onFocus={() => {
                setActiveField('dropoff');
                setShowResults(!dropoffSelectedLocation);
              }}
              leftIcon={
                <Icon
                  name="location-outline"
                  size={18}
                  color={colors.textSecondary}
                />
              }
            />
          </View>
        </>
      )}

      {showResults && (isLoadingResults || visibleLocations.length > 0 || showEmptyState) && (
        <View style={styles.resultsWrapper}>
          {isLoadingResults ? (
            <Typo variant="caption" style={styles.helperText}>
              Searching...
            </Typo>
          ) : showEmptyState ? (
            <Typo variant="caption" style={styles.helperText}>
              No locations found.
            </Typo>
          ) : (
            visibleLocations.map(location => (
              <TouchableOpacity
                key={location.id}
                style={styles.locationItem}
                onPress={() => handleSelectLocation(location)}
              >
                <View style={styles.locationIcon}>
                  <Icon
                    name="location-outline"
                    size={16}
                    color={colors.textSecondary}
                  />
                </View>
                <View style={styles.locationText}>
                  <Typo style={styles.locationName}>{location.name}</Typo>
                  <Typo variant="caption" style={styles.locationAddress}>
                    {location.address}
                  </Typo>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      <View style={styles.dateHeaderRow}>
        <Typo variant="subheading" style={styles.dateHeader}>
          Pickup
        </Typo>
        <Typo variant="subheading" style={styles.dateHeader}>
          Return
        </Typo>
      </View>

      <View style={styles.dateWrapper}>
        <View style={styles.dateCard}>
          <TouchableOpacity
            style={styles.dateRow}
            onPress={() =>
              navigation.navigate('SelectDates', {
                pickupDate: dateTime.pickupDate.toISOString(),
                returnDate: dateTime.returnDate.toISOString(),
              })
            }
          >
            <Icon name="calendar-outline" size={18} />
            <Typo style={styles.dateText}>
              {formatDate(dateTime.pickupDate)}
            </Typo>
          </TouchableOpacity>

          <View style={styles.dateDivider} />

          <TouchableOpacity
            style={styles.dateRow}
            onPress={() =>
              navigation.navigate('SelectTimes', {
                pickupTime: dateTime.pickupTime.toISOString(),
                returnTime: dateTime.returnTime.toISOString(),
              })
            }
          >
            <Icon name="time-outline" size={18} />
            <Typo style={styles.timeText}>
              {formatTime(dateTime.pickupTime)}
            </Typo>
          </TouchableOpacity>
        </View>

        <View style={styles.dateCard}>
          <TouchableOpacity
            style={styles.dateRow}
            onPress={() =>
              navigation.navigate('SelectDates', {
                pickupDate: dateTime.pickupDate.toISOString(),
                returnDate: dateTime.returnDate.toISOString(),
              })
            }
          >
            <Icon name="calendar-outline" size={18} />
            <Typo style={styles.dateText}>
              {formatDate(dateTime.returnDate)}
            </Typo>
          </TouchableOpacity>

          <View style={styles.dateDivider} />

          <TouchableOpacity
            style={styles.dateRow}
            onPress={() =>
              navigation.navigate('SelectTimes', {
                pickupTime: dateTime.pickupTime.toISOString(),
                returnTime: dateTime.returnTime.toISOString(),
              })
            }
          >
            <Icon name="time-outline" size={18} />
            <Typo style={styles.timeText}>
              {formatTime(dateTime.returnTime)}
            </Typo>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.sectionDivider} />

      <Typo style={styles.sectionTitle}>Country of residence</Typo>
      <TouchableOpacity
        style={styles.countrySelect}
        onPress={() => setCountryModalVisible(true)}
      >
        <View style={styles.countryLeft}>
          <Typo style={styles.flagEmoji}>
            {getFlagEmoji(selectedCountry?.code)}
          </Typo>

          <Typo>{selectedCountry.name}</Typo>
        </View>

        <Icon name="chevron-down" size={20} />
      </TouchableOpacity>

      <View style={styles.sectionDivider} />

      <AppButton
        title="Search"
        onPress={handleSearch}
        style={styles.searchBtn}
        loading={searching}
        disabled={loadingCountries}
      />

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
          clearFieldSearchState('pickup');
          clearFieldSearchState('dropoff');
          setActiveField('pickup');
          setShowResults(true);
        }}
      />
    </ScreenWrapper>
  );
};

export default SearchLocationScreen;
