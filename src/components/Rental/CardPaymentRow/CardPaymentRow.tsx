import React from 'react';
import { View } from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';

import { Typo } from '@/components/AppText/Typo';
import styles from './styles';

type Props = {
  brand: string;
  last4: string;
  status: string;
  date: string;
};

export const CardPaymentRow = ({ brand, last4, status, date }: Props) => {
  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <View style={styles.iconWrap}>
          <Icon name="card-outline" size={20} color="#fff" />
        </View>

        <View>
          <Typo>{brand}</Typo>
          <Typo variant="caption">•••• {last4}</Typo>
        </View>
      </View>

      <View style={styles.right}>
        <View style={styles.badge}>
          <Typo variant="caption" style={styles.badgeText}>
            {status}
          </Typo>
        </View>
        <Typo variant="caption">{date}</Typo>
      </View>
    </View>
  );
};
