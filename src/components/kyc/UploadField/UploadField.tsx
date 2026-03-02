import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import { Typo } from '@/components/AppText/Typo';
import styles from './styles';

type Props = {
  label: string;
  onPress: () => void;
};

export function UploadField({ label, onPress }: Props) {
  return (
    <View style={styles.container}>
      <Typo style={styles.label}>{label}</Typo>

      <TouchableOpacity style={styles.uploadBox} onPress={onPress}>
        <Typo style={styles.placeholder}>Upload document</Typo>

        <View style={styles.plusButton}>
          <Icon name="add" size={20} color="#fff" />
        </View>
      </TouchableOpacity>
    </View>
  );
}
