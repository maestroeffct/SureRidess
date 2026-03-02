import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { ScreenWrapper } from '@/components/Screenwrapper/Screenwrapper';
import { AppSearchBar } from '@/components/AppSearchBar/AppSearchBar';

import styles from './styles';
import { AppHeroHeader } from '@/components/AppHeroHeader/AppHeroHeader';
import { AppContentContainer } from '@/components/AppContentContainer/AppContentContainer';
import { BookingStatusTabs } from '@/components/Rental/BookingStatusTabs/BookingStatusTabs';
import { BookingCard } from '@/components/Rental/BookingCard/BookingCard';
import { useNavigation } from '@react-navigation/native';

const BookingsScreen = () => {
  const [status, setStatus] = useState<'in_progress' | 'completed'>(
    'in_progress',
  );

  const navigation = useNavigation<any>();

  return (
    <ScreenWrapper padded={false}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HERO */}
        <AppHeroHeader titleText="Bookings" />

        {/* SEARCH */}
        <View style={styles.searchWrapper}>
          <AppSearchBar
            placeholder="Search for booking"
            onFilterPress={() => {}}
          />
        </View>

        {/* CONTENT */}
        <AppContentContainer>
          <View style={styles.contentWrapper}>
            <BookingStatusTabs value={status} onChange={setStatus} />

            {/* LIST */}
            {status === 'in_progress' && (
              <>
                <BookingCard
                  onPress={() =>
                    navigation.navigate('CarRentalFlowNavigator', {
                      screen: 'BookingDetails',
                      params: { bookingId: 'TG4KQ2Q' },
                    })
                  }
                />
              </>
            )}

            {status === 'completed' && (
              <>
                <BookingCard
                  onPress={() =>
                    navigation.navigate('CarRentalFlowNavigator', {
                      screen: 'BookingDetails',
                      params: { bookingId: 'TG4KQ2Q' },
                    })
                  }
                />
              </>
            )}
          </View>
        </AppContentContainer>
      </ScrollView>
    </ScreenWrapper>
  );
};

export default BookingsScreen;
