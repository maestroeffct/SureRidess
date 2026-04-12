import React, { useEffect } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';

import { ScreenWrapper } from '@/components/Screenwrapper/Screenwrapper';
import { Typo } from '@/components/AppText/Typo';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '@/theme/ThemeProvider';
import styles from './styles';
import { CarCard } from '@/components/Rental/CarCard/CarCard';
import { AppButton } from '@/components/AppButton/CustomButton';
import { formatDate, formatTime } from '@/helpers/dateTime';
import type { RentalCar } from '@/types/rental';
import { CategoryChips } from '@/components/Rental/CategoryChips/CategoryChips';
import { getCarWithFeatures } from '@/services/rental.service';

const ChooseVehicleScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors } = useTheme();
  const cars: RentalCar[] = route?.params?.cars ?? [];
  const search = route?.params?.search;
  const pickupLocationId = route?.params?.pickupLocationId;
  const dropoffLocationId = route?.params?.dropoffLocationId;
  const pickupLocationName = route?.params?.pickupLocationName;
  const dropoffLocationName = route?.params?.dropoffLocationName;
  const showDropoff =
    dropoffLocationId && dropoffLocationId !== pickupLocationId;

  const pickupAt = search?.pickupAt ? new Date(search.pickupAt) : null;
  const returnAt = search?.returnAt ? new Date(search.returnAt) : null;

  const summaryTime =
    pickupAt && returnAt
      ? `${formatDate(pickupAt)}, ${formatTime(pickupAt)} - ${formatDate(
          returnAt,
        )}, ${formatTime(returnAt)}`
      : 'Select dates';

  const [displayCars, setDisplayCars] = React.useState<RentalCar[]>(cars);

  useEffect(() => {
    setDisplayCars(cars);
  }, [cars]);

  useEffect(() => {
    const loadFeatures = async () => {
      const missing = cars.filter(car => !car.features && !car.groupedFeatures);

      if (missing.length === 0) return;

      try {
        const enriched = await Promise.all(
          missing.map(async car => {
            try {
              const detail = await getCarWithFeatures(car.id);
              return {
                ...car,
                ...detail,
                location: detail.location ?? car.location,
                provider: detail.provider ?? car.provider,
                images: car.images?.length ? car.images : detail.images ?? [],
              } as RentalCar;
            } catch (error) {
              console.warn('[CarFeatures] Failed to load', car.id, error);
              return car;
            }
          }),
        );

        const enrichedMap = new Map(enriched.map(car => [car.id, car]));
        setDisplayCars(prev => prev.map(car => enrichedMap.get(car.id) ?? car));
      } catch (error) {
        console.warn('[CarFeatures] Failed to load car features', error);
      }
    };

    loadFeatures();
  }, [cars]);

  const categories = Array.from(
    new Set(
      displayCars
        .map(car => car.category)
        .filter((c): c is string => c !== undefined && c !== null && c !== ''),
    ),
  );

  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(
    null,
  );

  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0]);
    }
  }, [categories, selectedCategory]);

  const filteredCars = selectedCategory
    ? displayCars.filter(car => car.category === selectedCategory)
    : displayCars;

  return (
    <ScreenWrapper padded={false}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={24} />
        </TouchableOpacity>

        <Typo variant="subheading">Choose Your Vehicle</Typo>

        <TouchableOpacity>
          <Icon name="ellipsis-horizontal" size={22} />
        </TouchableOpacity>
      </View>

      {/* SEARCH SUMMARY */}
      <View style={styles.summaryCard}>
        <View>
          <Typo variant="subheading" style={styles.location}>
            {pickupLocationId
              ? `${pickupLocationName || pickupLocationId}`
              : 'Pickup location'}
          </Typo>
          {showDropoff && (
            <Typo variant="caption" style={styles.date}>
              Drop-off: {dropoffLocationName || dropoffLocationId}
            </Typo>
          )}
          <Typo variant="caption" style={styles.date}>
            {summaryTime}
          </Typo>
        </View>

        <TouchableOpacity>
          <Icon name="create-outline" size={18} />
        </TouchableOpacity>
      </View>

      {/* SORT / FILTER */}
      <View style={styles.actionRow}>
        <AppButton
          onPress={() => {}}
          style={styles.sortBtn}
          leftIcon={
            <Icon name="swap-vertical-outline" size={18} color="#fff" />
          }
          title="Sort"
        />

        <AppButton
          onPress={() => {}}
          style={styles.filterBtn}
          variant="outline"
          leftIcon={
            <Icon name="options-outline" size={18} color={colors.primary} />
          }
          title="Filter"
        />
      </View>

      {/* RESULTS COUNT */}
      <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
        <Typo variant="subheading">{filteredCars.length} cars found</Typo>
      </View>

      {/* CATEGORY CHIPS */}
      <CategoryChips
        categories={categories.map(category => {
          const firstCar = displayCars.find(c => c.category === category);

          return {
            label: category,
            image: firstCar?.images?.find(img => img.isPrimary)?.url,
          };
        })}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />

      {/* VEHICLE LIST */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {filteredCars.length === 0 ? (
          <Typo style={styles.date}>No cars found for this search.</Typo>
        ) : (
          filteredCars.map(car => (
            <CarCard
              key={car.id}
              car={car}
              onPress={() => (
                navigation.navigate('VehicleDetails', {
                  vehicleId: car.id,
                  car,
                  search,
                  pickupLocationId,
                  dropoffLocationId,
                  pickupLocationName,
                  dropoffLocationName,
                })
              )}
            />
          ))
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

export default ChooseVehicleScreen;
