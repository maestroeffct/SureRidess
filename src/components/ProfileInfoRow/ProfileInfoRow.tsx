import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import { Typo } from '@/components/AppText/Typo';
import styles from './styles';

type Props = {
  label: string;
  value: string;
  verified?: boolean;
  onPress?: () => void;
};

export const ProfileInfoRow = ({ label, value, verified, onPress }: Props) => {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={styles.row}
      onPress={onPress}
      activeOpacity={onPress ? 0.85 : undefined}
    >
      <Typo variant="subheading" style={styles.label}>
        {label}
      </Typo>

      <View style={styles.valueRow}>
        <Typo style={styles.value}>{value}</Typo>

        {verified && <Icon name="checkmark-circle" size={18} color="#22C55E" />}
      </View>
    </Container>
  );
};
