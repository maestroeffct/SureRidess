import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { ScreenWrapper } from '@/components/Screenwrapper/Screenwrapper';
import { AppSearchBar } from '@/components/AppSearchBar/AppSearchBar';
import { CarCard } from '@/components/Rental/CarCard/CarCard';
import { Typo } from '@/components/AppText/Typo';
import { useAuth } from '@/providers/AuthProvider';

import styles from './styles';
import { AppHeroHeader } from '@/components/AppHeroHeader/AppHeroHeader';
import { AppContentContainer } from '@/components/AppContentContainer/AppContentContainer';
import { listRentalCars } from '@/services/rental.service';
import type { RentalCar } from '@/types/rental';

const CarRentalHomeScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [cars, setCars] = useState<RentalCar[]>([]);
  const [loading, setLoading] = useState(true);

  const openSearchLocation = () =>
    navigation.navigate('CarRentalFlowNavigator', {
      screen: 'SearchLocation',
    });

  const firstName = user?.firstName?.trim() || 'User';
  const avatarText =
    `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() ||
    'SU';

  useEffect(() => {
    const load = async () => {
      try {
        const data = await listRentalCars();
        setCars(data);
      } catch (e) {
        console.warn('Failed to load cars', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const featuredCars = cars.slice(0, 4);
  const popularCars = cars.slice(4, 8);

  const navigateToCar = (car: RentalCar) =>
    navigation.navigate('CarRentalFlowNavigator', {
      screen: 'VehicleDetails',
      params: { vehicleId: car.id, car },
    });

  return (
    <ScreenWrapper padded={false}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HERO */}
        <AppHeroHeader
          subtitle={`Hello, ${firstName}`}
          title="What's your next destination?"
          description="Select pickup location and rental dates"
          avatarText={avatarText}
          onBellPress={() => {}}
          onAvatarPress={() => {}}
        />

        {/* SEARCH */}
        <View style={styles.searchWrapper}>
          <AppSearchBar
            placeholder="Choose Location"
            onPress={openSearchLocation}
            onFilterPress={openSearchLocation}
          />
        </View>

        {/* CONTENT */}
        <AppContentContainer>
          {loading ? (
            <ActivityIndicator
              size="large"
              color="#0A6A4B"
              style={{ marginVertical: 32 }}
            />
          ) : (
            <>
              {/* FEATURED FLEET */}
              <SectionHeader title="Featured Fleet" />
              {featuredCars.length > 0 ? (
                featuredCars.map(car => (
                  <CarCard
                    key={car.id}
                    car={car}
                    onPress={() => navigateToCar(car)}
                  />
                ))
              ) : (
                <Typo variant="caption" style={{ opacity: 0.5 }}>
                  No vehicles available
                </Typo>
              )}

              {/* POPULAR CARS */}
              {popularCars.length > 0 && (
                <>
                  <SectionHeader title="Popular Cars" />
                  {popularCars.map(car => (
                    <CarCard
                      key={car.id}
                      car={car}
                      onPress={() => navigateToCar(car)}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </AppContentContainer>
      </ScrollView>
    </ScreenWrapper>
  );
};

export default CarRentalHomeScreen;

/* ---------------- LOCAL COMPONENT ---------------- */

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Typo variant="subheading">{title}</Typo>
      <Typo variant="caption">View All</Typo>
    </View>
  );
}
