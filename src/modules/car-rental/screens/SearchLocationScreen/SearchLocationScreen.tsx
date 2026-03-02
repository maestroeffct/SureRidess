import React, { useEffect, useState } from 'react';
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

const SearchLocationScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors } = useTheme();
  // const [useCurrent, setUseCurrent] = useState(true);
  const [sameDropOff, setSameDropOff] = useState(true);
  const [pickupLocationId, setPickupLocationId] = useState('');
  const [dropoffLocationId, setDropoffLocationId] = useState('');
  const [pickupQuery, setPickupQuery] = useState('');
  const [dropoffQuery, setDropoffQuery] = useState('');
  const [activeField, setActiveField] =
    useState<'pickup' | 'dropoff'>('pickup');
  const [locationResults, setLocationResults] = useState<RentalLocation[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [showResults, setShowResults] = useState(false);
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
      setActiveField('pickup');
    }
  }, [sameDropOff, pickupLocationId, pickupQuery]);

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
    const loadCountryIds = async () => {
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
      } catch (error) {
        console.warn('Failed to load location country IDs', error);
      }
    };

    loadCountryIds();
  }, []);

  useEffect(() => {
    const query = activeField === 'pickup' ? pickupQuery : dropoffQuery;
    const trimmed = query.trim();

    if (!trimmed || trimmed.length < 3) {
      setLocationResults([]);
      setLoadingLocations(false);
      setShowResults(false);
      return;
    }

    const countryId = selectedCountry?.code
      ? countryIdByCode[selectedCountry.code]
      : undefined;
    if (!countryId) {
      setLocationResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoadingLocations(true);
        const results = await searchRentalLocations({
          q: trimmed,
          countryId,
        });
        setLocationResults(results);
      } catch (error) {
        console.warn('Failed to search locations', error);
        setLocationResults([]);
      } finally {
        setLoadingLocations(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [
    activeField,
    pickupQuery,
    dropoffQuery,
    selectedCountry?.code,
    countryIdByCode,
  ]);

  const buildIsoDateTime = (date: Date, time: Date) => {
    const combined = new Date(date);
    combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
    return combined.toISOString();
  };

  const handleSelectLocation = (location: RentalLocation) => {
    if (activeField === 'pickup') {
      setPickupLocationId(location.id);
      setPickupQuery(location.name);
      if (sameDropOff) {
        setDropoffLocationId(location.id);
        setDropoffQuery(location.name);
      }
    } else {
      setDropoffLocationId(location.id);
      setDropoffQuery(location.name);
    }

    setLocationResults([]);
    setShowResults(false);
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

      navigation.navigate('ChooseVehicle', {
        search: result.search,
        cars: result.cars,
        pickupLocationId: pickupId,
        dropoffLocationId: dropoffId,
        pickupLocationName: pickupQuery.trim(),
        dropoffLocationName: sameDropOff
          ? pickupQuery.trim()
          : dropoffQuery.trim(),
      });
    } catch (error: any) {
      showError(
        error?.response?.data?.message ||
          'Unable to search cars. Please try again.',
      );
    } finally {
      setSearching(false);
    }
  };

  return (
    <ScreenWrapper>
      {/* HEADER */}
      <View style={styles.header}>
        <Typo variant="heading">Search Location</Typo>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="close" size={26} />
        </TouchableOpacity>
      </View>
      {/* PICKUP */}
      <Typo style={styles.sectionTitle}>Pick-up Location</Typo>

      <View style={styles.input}>
        <AppInput
          placeholder="Search for destinations"
          value={pickupQuery}
          onChangeText={text => {
            setPickupQuery(text);
            setPickupLocationId('');
            setActiveField('pickup');
            setShowResults(text.trim().length >= 3);
          }}
          onFocus={() => setActiveField('pickup')}
          onBlur={() => setShowResults(false)}
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
      {/* DROP OFF */}
      {!sameDropOff && (
        <>
          <Typo style={styles.sectionTitle}>Drop-off Location</Typo>
          <View style={styles.input}>
            <AppInput
              placeholder="Search for destinations"
              value={dropoffQuery}
              onChangeText={text => {
                setDropoffQuery(text);
                setDropoffLocationId('');
                setActiveField('dropoff');
                setShowResults(text.trim().length >= 3);
              }}
              onFocus={() => setActiveField('dropoff')}
              onBlur={() => setShowResults(false)}
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

      {showResults && (
        <View style={styles.resultsWrapper}>
          {loadingLocations ? (
            <Typo variant="caption" style={styles.helperText}>
              Searching...
            </Typo>
          ) : locationResults.length === 0 ? (
            <Typo variant="caption" style={styles.helperText}>
              No locations found.
            </Typo>
          ) : (
            locationResults.map(location => (
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
      {/* PICKUP / RETURN LABELS */}
      <View style={styles.dateHeaderRow}>
        <Typo variant="subheading" style={styles.dateHeader}>
          Pickup
        </Typo>
        <Typo variant="subheading" style={styles.dateHeader}>
          Return
        </Typo>
      </View>
      {/* DATE + TIME CARDS */}
      <View style={styles.dateWrapper}>
        {/* PICKUP CARD */}
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

        {/* RETURN CARD */}
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
      {/* SECTION DIVIDER */}
      <View style={styles.sectionDivider} />
      {/* COUNTRY OF RESIDENCE */}
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
      {/* ACTION */}
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
        }}
      />
    </ScreenWrapper>
  );
};

export default SearchLocationScreen;
