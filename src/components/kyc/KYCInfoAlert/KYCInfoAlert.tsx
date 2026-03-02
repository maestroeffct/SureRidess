import React from 'react';
import { View } from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import { Typo } from '@/components/AppText/Typo';
import styles from './styles';

type Props = {
  message: string;
};

export function KYCInfoAlert({ message }: Props) {
  return (
    <View style={styles.container}>
      <Icon name="information-circle-outline" size={20} color="#B23AF1" />
      <Typo style={styles.text}>{message}</Typo>
    </View>
  );
}
