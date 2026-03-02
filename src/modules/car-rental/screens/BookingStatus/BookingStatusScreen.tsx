import React from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';

import { ScreenWrapper } from '@/components/Screenwrapper/Screenwrapper';
import { Typo } from '@/components/AppText/Typo';
import { AppButton } from '@/components/AppButton/CustomButton';
import { useNavigation } from '@react-navigation/native';
import styles from './styles';

const BookingStatusScreen = () => {
  const navigation = useNavigation<any>();

  return (
    <ScreenWrapper padded={false}>
      {/* HEADER */}
      <View style={styles.header}>
        <View />
        <Typo variant="subheading">Booking Status</Typo>
        <TouchableOpacity>
          <Icon name="ellipsis-horizontal" size={22} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* SUCCESS ICON */}
        <View style={styles.successWrap}>
          <View style={styles.successBadge}>
            <Icon name="checkmark" size={36} color="#fff" />
          </View>
        </View>

        {/* TITLE */}
        <Typo style={styles.title}>Your car rental is confirmed!</Typo>

        <Typo variant="caption" style={styles.subtitle}>
          Your rental booking has been successfully completed. Check your rental
          in bookings menu
        </Typo>

        <View style={styles.divider} />

        {/* BOOKING DETAILS */}
        <BookingDetailRow label="Collection Code" value="982375t584u" />
        <BookingDetailRow label="Amount" value="₦300,000" />
        <BookingDetailRow label="Pickup" value="Murtala Muhammed..." />
        <BookingDetailRow label="Dropoff" value="Murtala Muhammed..." />
        <BookingDetailRow label="Duration" value="15th Jan to 26th Jan" />
      </ScrollView>

      {/* CTA */}
      <View style={styles.bottomBar}>
        <AppButton
          title="View My Bookings"
          onPress={() => navigation.navigate('MyBookings')}
        />
      </View>
    </ScreenWrapper>
  );
};

export default BookingStatusScreen;

/* ---------------- SMALL REUSABLE ROW ---------------- */

function BookingDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Typo variant="caption" style={styles.label}>
        {label}
      </Typo>
      <Typo style={styles.value}>{value}</Typo>
    </View>
  );
}
