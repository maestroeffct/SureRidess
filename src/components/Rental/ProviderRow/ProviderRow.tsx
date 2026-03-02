import React from 'react';
import { View } from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';

import { Typo } from '@/components/AppText/Typo';
import styles from './styles';

type Props = {
  name: string;
  description: string;
  verified?: boolean;
};

export const ProviderRow = ({ name, description, verified }: Props) => {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <View style={styles.logo}>
          <Typo style={styles.logoText}>{name.slice(0, 4)}</Typo>
        </View>

        <View>
          <Typo variant="subheading">{name}</Typo>
          <Typo variant="caption">{description}</Typo>
        </View>
      </View>

      {verified && <Icon name="checkmark-circle" size={22} color="#0B6E4F" />}
    </View>
  );
};
