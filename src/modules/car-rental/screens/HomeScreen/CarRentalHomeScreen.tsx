import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';

import { ScreenWrapper } from '@/components/Screenwrapper/Screenwrapper';
import { CarCard } from '@/components/Rental/CarCard/CarCard';
import { Typo } from '@/components/AppText/Typo';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { listRentalCars } from '@/services/rental.service';
import type { RentalCar } from '@/types/rental';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CATEGORIES = ['All', 'Economy', 'Luxury', 'SUV', 'Van', 'Electric'];

const CATEGORY_MAP: Record<string, string> = {
  Economy: 'ECONOMY',
  Luxury: 'LUXURY',
  SUV: 'SUV',
  Van: 'VAN',
  Electric: 'ELECTRIC',
};

const CarRentalHomeScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { colors } = useTheme();

  const [cars, setCars] = useState<RentalCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  const firstName = user?.firstName?.trim() || 'User';
  const avatarText =
    `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || 'SU';

  const currentMonth = new Date().toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  const openSearchLocation = () =>
    navigation.navigate('CarRentalFlowNavigator', { screen: 'SearchLocation' });

  const navigateToCar = (car: RentalCar) =>
    navigation.navigate('CarRentalFlowNavigator', {
      screen: 'VehicleDetails',
      params: { vehicleId: car.id, car },
    });

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

  const filteredCars =
    activeCategory === 'All'
      ? cars
      : cars.filter(
          car =>
            car.category?.toUpperCase() === CATEGORY_MAP[activeCategory],
        );

  const featuredCars = filteredCars.slice(0, 6);
  const allCars = filteredCars;

  return (
    <ScreenWrapper padded={false}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ──────────────── HERO ──────────────── */}
        <View
          style={{
            backgroundColor: '#0A6A4B',
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 28,
          }}
        >
          {/* Top row */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typo style={{ color: '#fff', fontSize: 15, fontWeight: '500' }}>
              Hello, {firstName}
            </Typo>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {/* Notification bell */}
              <TouchableOpacity
                style={{ position: 'relative' }}
                onPress={() => {}}
                activeOpacity={0.7}
              >
                <Ionicons name="notifications-outline" size={24} color="#fff" />
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: 8,
                    height: 8,
                    backgroundColor: '#EF4444',
                    borderRadius: 4,
                  }}
                />
              </TouchableOpacity>

              {/* Avatar circle */}
              <TouchableOpacity
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: 'rgba(255,255,255,0.25)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onPress={() => {}}
                activeOpacity={0.8}
              >
                <Typo style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>
                  {avatarText}
                </Typo>
              </TouchableOpacity>
            </View>
          </View>

          {/* Title */}
          <Typo
            style={{
              color: '#fff',
              fontSize: 26,
              fontWeight: '700',
              marginTop: 16,
              lineHeight: 32,
            }}
          >
            Find your perfect ride
          </Typo>

          {/* Subtitle */}
          <Typo
            style={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: 12,
              marginTop: 4,
            }}
          >
            Lagos, Nigeria · {currentMonth}
          </Typo>

          {/* Search Widget */}
          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 14,
              marginTop: 20,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 14,
              paddingVertical: 10,
              gap: 8,
            }}
          >
            {/* Location picker */}
            <TouchableOpacity
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
              onPress={openSearchLocation}
              activeOpacity={0.7}
            >
              <Ionicons name="location-outline" size={18} color="#0A6A4B" />
              <Typo style={{ color: '#9CA3AF', fontSize: 13 }}>
                Choose location
              </Typo>
            </TouchableOpacity>

            {/* Divider */}
            <View
              style={{
                width: 1,
                height: 28,
                backgroundColor: '#E5E7EB',
              }}
            />

            {/* Date picker */}
            <TouchableOpacity
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
              onPress={openSearchLocation}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={18} color="#0A6A4B" />
              <Typo style={{ color: '#9CA3AF', fontSize: 13 }}>Pick dates</Typo>
            </TouchableOpacity>

            {/* Search button */}
            <TouchableOpacity
              style={{
                backgroundColor: '#0A6A4B',
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 10,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
              onPress={openSearchLocation}
              activeOpacity={0.8}
            >
              <Ionicons name="search" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ──────────────── CATEGORY CHIPS ──────────────── */}
        <FlatList
          data={CATEGORIES}
          horizontal
          keyExtractor={item => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingVertical: 16,
            gap: 8,
          }}
          renderItem={({ item }) => {
            const active = activeCategory === item;
            return (
              <TouchableOpacity
                onPress={() => setActiveCategory(item)}
                activeOpacity={0.75}
                style={{
                  backgroundColor: active ? '#0A6A4B' : colors.surface,
                  borderRadius: 20,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderWidth: 1,
                  borderColor: active ? '#0A6A4B' : colors.border,
                }}
              >
                <Typo
                  style={{
                    fontSize: 13,
                    fontWeight: '500',
                    color: active ? '#fff' : colors.textSecondary,
                  }}
                >
                  {item}
                </Typo>
              </TouchableOpacity>
            );
          }}
        />

        {/* ──────────────── CONTENT ──────────────── */}
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#0A6A4B"
            style={{ marginVertical: 60 }}
          />
        ) : allCars.length === 0 ? (
          <View
            style={{
              alignItems: 'center',
              marginTop: 60,
              paddingHorizontal: 32,
              gap: 10,
            }}
          >
            <Ionicons name="car-outline" size={56} color={colors.border} />
            <Typo
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.textPrimary,
                marginTop: 8,
              }}
            >
              No vehicles available
            </Typo>
            <Typo style={{ color: colors.textSecondary, textAlign: 'center' }}>
              Try a different category or check back later
            </Typo>
          </View>
        ) : (
          <>
            {/* ── FEATURED SECTION ── */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 20,
                marginBottom: 12,
              }}
            >
              <Typo
                style={{
                  fontSize: 17,
                  fontWeight: '700',
                  color: colors.textPrimary,
                }}
              >
                Featured
              </Typo>
              <TouchableOpacity activeOpacity={0.7}>
                <Typo style={{ fontSize: 13, color: '#0A6A4B', fontWeight: '500' }}>
                  See all
                </Typo>
              </TouchableOpacity>
            </View>

            <FlatList
              data={featuredCars}
              horizontal
              keyExtractor={item => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
              snapToInterval={SCREEN_WIDTH * 0.72 + 12}
              decelerationRate="fast"
              renderItem={({ item: car }) => (
                <FeaturedCard
                  car={car}
                  onPress={() => navigateToCar(car)}
                  colors={colors}
                />
              )}
            />

            {/* ── ALL VEHICLES SECTION ── */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 20,
                marginTop: 24,
                marginBottom: 4,
              }}
            >
              <Typo
                style={{
                  fontSize: 17,
                  fontWeight: '700',
                  color: colors.textPrimary,
                }}
              >
                All Vehicles
              </Typo>
              <Typo style={{ fontSize: 13, color: colors.textSecondary }}>
                {allCars.length} available
              </Typo>
            </View>

            {allCars.map(car => (
              <CarCard key={car.id} car={car} onPress={() => navigateToCar(car)} />
            ))}

            <View style={{ height: 40 }} />
          </>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

export default CarRentalHomeScreen;

/* ────────────────────────────────────────────────────
   FEATURED CARD (compact horizontal card)
──────────────────────────────────────────────────── */

type ColorSet = {
  surface: string;
  background: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  primary: string;
};

function FeaturedCard({
  car,
  onPress,
  colors,
}: {
  car: RentalCar;
  onPress: () => void;
  colors: ColorSet;
}) {
  const cardWidth = SCREEN_WIDTH * 0.72;

  const title =
    car.brand && car.model ? `${car.brand} ${car.model}` : 'Vehicle';
  const location = car.location?.name ?? 'Nigeria';
  const dailyRate =
    typeof car.dailyRate === 'number'
      ? `₦${car.dailyRate.toLocaleString()}`
      : '₦—';

  const imageUrl =
    car.images?.find(img => img.isPrimary)?.url ?? car.images?.[0]?.url;
  const imageSource = imageUrl
    ? { uri: imageUrl }
    : require('@/assets/images/car.png');

  const formatLabel = (value?: string) => {
    if (!value) return '';
    return value
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/(^\w|\s\w)/g, m => m.toUpperCase());
  };

  const categoryLabel = car.category ? formatLabel(car.category) : '';
  const showVerified = car.provider?.isVerified === true;

  const transmission = car.transmission ? formatLabel(car.transmission) : null;
  const seats = typeof car.seats === 'number' ? car.seats : null;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={{
        width: cardWidth,
        backgroundColor: colors.surface,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      {/* Image */}
      <View style={{ position: 'relative' }}>
        <Image
          source={imageSource}
          style={{ width: '100%', height: 140 }}
          resizeMode="cover"
        />

        {/* Category pill — top left */}
        {categoryLabel ? (
          <View
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              backgroundColor: 'rgba(0,0,0,0.55)',
              borderRadius: 20,
              paddingHorizontal: 10,
              paddingVertical: 4,
            }}
          >
            <Typo style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>
              {categoryLabel}
            </Typo>
          </View>
        ) : null}

        {/* Verified badge — top right */}
        {showVerified && (
          <View
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              backgroundColor: '#16A34A',
              borderRadius: 20,
              paddingHorizontal: 10,
              paddingVertical: 4,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Ionicons name="checkmark-circle" size={12} color="#fff" />
            <Typo style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>
              Verified
            </Typo>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={{ padding: 12 }}>
        <Typo
          style={{
            fontSize: 14,
            fontWeight: '700',
            color: colors.textPrimary,
          }}
          numberOfLines={1}
        >
          {title}
        </Typo>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            marginTop: 4,
          }}
        >
          <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
          <Typo
            style={{
              fontSize: 12,
              color: colors.textSecondary,
            }}
            numberOfLines={1}
          >
            {location}
          </Typo>
        </View>

        {/* Footer */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 10,
          }}
        >
          {/* Specs */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {transmission && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: colors.background,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Ionicons name="settings-outline" size={11} color={colors.textSecondary} />
                <Typo style={{ fontSize: 11, color: colors.textSecondary }}>
                  {transmission}
                </Typo>
              </View>
            )}
            {seats !== null && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: colors.background,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Ionicons name="people-outline" size={11} color={colors.textSecondary} />
                <Typo style={{ fontSize: 11, color: colors.textSecondary }}>
                  {seats}
                </Typo>
              </View>
            )}
          </View>

          {/* Price */}
          <Typo
            style={{
              fontSize: 15,
              fontWeight: '700',
              color: '#0A6A4B',
            }}
          >
            {dailyRate}
            <Typo style={{ fontSize: 11, fontWeight: '400', color: colors.textSecondary }}>
              /day
            </Typo>
          </Typo>
        </View>
      </View>
    </TouchableOpacity>
  );
}
