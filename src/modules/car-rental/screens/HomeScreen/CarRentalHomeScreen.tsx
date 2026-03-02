import React from 'react';
import { ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { ScreenWrapper } from '@/components/Screenwrapper/Screenwrapper';
import { AppSearchBar } from '@/components/AppSearchBar/AppSearchBar';
import { CarCard } from '@/components/Rental/CarCard/CarCard';
import { Typo } from '@/components/AppText/Typo';

import styles from './styles';
import { AppHeroHeader } from '@/components/AppHeroHeader/AppHeroHeader';
import { AppContentContainer } from '@/components/AppContentContainer/AppContentContainer';

const CarRentalHomeScreen = () => {
  const navigation = useNavigation<any>();

  return (
    <ScreenWrapper padded={false}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HERO */}
        <AppHeroHeader
          subtitle="Hello, Joe"
          title="What’s your next destination?"
          description="Select pickup location and rental dates"
          onBellPress={() => {}}
          onAvatarPress={() => {}}
        />

        {/* SEARCH */}
        <View style={styles.searchWrapper}>
          <AppSearchBar
            placeholder="Choose Location"
            onPress={() =>
              navigation.navigate('CarRentalFlowNavigator', {
                screen: 'SearchLocation',
              })
            }
            onFilterPress={() => {}}
          />
        </View>

        {/* CONTENT */}
        <AppContentContainer>
          {/* VEHICLES NEAR ME */}
          <SectionHeader title="Vehicles Near Me" />

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <CarCard
              onPress={() =>
                navigation.navigate('CarRentalFlow', {
                  screen: 'VehicleDetails',
                  params: { vehicleId: '1' },
                })
              }
            />
            <CarCard
              onPress={() =>
                navigation.navigate('CarRentalFlow', {
                  screen: 'VehicleDetails',
                  params: { vehicleId: '2' },
                })
              }
            />
          </ScrollView>

          {/* POPULAR CARS */}
          <SectionHeader title="Popular Cars" />

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <CarCard
              onPress={() =>
                navigation.navigate('CarRentalFlow', {
                  screen: 'VehicleDetails',
                  params: { vehicleId: '3' },
                })
              }
            />
            <CarCard
              onPress={() =>
                navigation.navigate('CarRentalFlow', {
                  screen: 'VehicleDetails',
                  params: { vehicleId: '4' },
                })
              }
            />
          </ScrollView>
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
