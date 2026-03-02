import React from 'react';
import { View } from 'react-native';
import { Typo } from '@/components/AppText/Typo';
import styles from './styles';

export const BookingLocationRow = ({
  color,
  location,
}: {
  color: string;
  location: string;
}) => {
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Typo variant="caption">{location}</Typo>
    </View>
  );
};
