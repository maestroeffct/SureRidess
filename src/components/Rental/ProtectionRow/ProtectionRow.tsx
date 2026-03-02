import React from 'react';
import { View } from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';

import { Typo } from '@/components/AppText/Typo';
import styles from './styles';

type Props = {
  title: string;
  subtitle: string;
  price: string;
};

export const ProtectionRow = ({ title, subtitle, price }: Props) => {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <View style={styles.iconWrap}>
          <Icon name="shield-checkmark-outline" size={20} color="#2563EB" />
        </View>

        <View>
          <Typo>{title}</Typo>
          <Typo variant="caption">{subtitle}</Typo>
        </View>
      </View>

      <Typo style={styles.price}>{price}</Typo>
    </View>
  );
};
