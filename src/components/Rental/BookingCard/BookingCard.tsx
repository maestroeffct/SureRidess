import React from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import { Typo } from '@/components/AppText/Typo';
import styles from './styles';
import { BookingLocationRow } from '../BookingLocationRow/BookingLocationRow';

type Props = {
  onPress: () => void;
};
export const BookingCard = ({ onPress }: Props) => {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.card}
    >
      {/* HEADER */}
      <View style={styles.codeRow}>
        <Typo variant="caption">Pickup code:</Typo>
        <Typo style={styles.code}>97egwdsd7t78</Typo>
      </View>

      {/* BODY */}
      <View style={styles.body}>
        <Image
          source={{
            uri: 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=600',
          }}
          style={styles.image}
        />

        <View style={styles.details}>
          <Typo style={styles.title}>Toyota Camry 2023</Typo>

          <BookingLocationRow color="#10B981" location="Ikeja, Lagos" />
          <BookingLocationRow color="#EF4444" location="Lekki, Lagos" />
        </View>
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <View>
          <Typo variant="caption">15th Jan 2026 at 10:00am</Typo>
          <Typo variant="caption">25th Jan 2026 at 10:00am</Typo>
        </View>

        <View style={styles.meta}>
          <Typo variant="caption">10 days</Typo>
          <Typo style={styles.bookingId}>en ewdjkedwj</Typo>
        </View>
      </View>
    </TouchableOpacity>
  );
};
