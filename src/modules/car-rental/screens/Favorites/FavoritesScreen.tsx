import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from '@react-native-vector-icons/ionicons';

import { ScreenWrapper } from '@/components/Screenwrapper/Screenwrapper';
import { Typo } from '@/components/AppText/Typo';
import { CarCard } from '@/components/Rental/CarCard/CarCard';
import { useFavorites } from '@/providers/FavoritesProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { getCarWithFeatures } from '@/services/rental.service';
import type { RentalCar } from '@/types/rental';

export function FavoritesScreen() {
  const { colors } = useTheme();
  const { favorites, ready } = useFavorites();
  const navigation = useNavigation<any>();

  const [cars, setCars] = useState<RentalCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!ready) return;
    if (favorites.length === 0) {
      setCars([]);
      setLoading(false);
      return;
    }

    try {
      const results = await Promise.allSettled(
        favorites.map(id => getCarWithFeatures(id)),
      );
      const fetched = results
        .map(r => (r.status === 'fulfilled' ? r.value : null))
        .filter((c): c is RentalCar => !!c);

      // Preserve favorites order (most-recently-saved first)
      const byId = new Map(fetched.map(c => [c.id, c]));
      const ordered = favorites
        .map(id => byId.get(id))
        .filter((c): c is RentalCar => !!c);
      setCars(ordered);
    } catch {
      // ignore — keep previous list
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [favorites, ready]);

  useEffect(() => {
    void load();
  }, [load]);

  // Re-fetch when the screen comes into focus (e.g. user unfavorited from
  // detail screen, came back here).
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load();
  }, [load]);

  return (
    <ScreenWrapper padded={false}>
      {/* HEADER */}
      <View
        style={[
          s.header,
          { backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <Typo style={[s.headerTitle, { color: colors.textPrimary }]}>
          Saved Vehicles
        </Typo>
        {favorites.length > 0 ? (
          <Typo style={[s.headerSub, { color: colors.textSecondary }]}>
            {favorites.length} saved
          </Typo>
        ) : null}
      </View>

      {loading && cars.length === 0 ? (
        <View style={s.centerWrap}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : cars.length === 0 ? (
        <View style={s.centerWrap}>
          <Icon name="heart-outline" size={48} color={colors.textSecondary} />
          <Typo style={[s.emptyTitle, { color: colors.textPrimary }]}>
            No saved vehicles yet
          </Typo>
          <Typo style={[s.emptyHint, { color: colors.textSecondary }]}>
            Tap the heart on any car to save it here for later.
          </Typo>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingVertical: 8, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {cars.map(car => (
            <CarCard
              key={car.id}
              car={car}
              onPress={() =>
                navigation.navigate('CarRentalFlowNavigator', {
                  screen: 'VehicleDetails',
                  params: { vehicleId: car.id, car },
                })
              }
            />
          ))}
        </ScrollView>
      )}
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 24, fontWeight: '700' },
  headerSub: { fontSize: 13, marginTop: 2 },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 8,
    marginTop: 60,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginTop: 12 },
  emptyHint: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
});

export default FavoritesScreen;
