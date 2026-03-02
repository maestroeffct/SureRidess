import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import { Typo } from '@/components/AppText/Typo';
import styles from './styles';

type Props = {
  label: string;
  onPress: () => void;
  selectedFileName?: string;
};

export function UploadField({ label, onPress, selectedFileName }: Props) {
  return (
    <View style={styles.container}>
      <Typo style={styles.label}>{label}</Typo>

      <TouchableOpacity style={styles.uploadBox} onPress={onPress}>
        <Typo
          style={selectedFileName ? styles.selectedText : styles.placeholder}
          numberOfLines={1}
        >
          {selectedFileName || 'Upload document'}
        </Typo>

        <View style={styles.plusButton}>
          <Icon name="add" size={20} color="#fff" />
        </View>
      </TouchableOpacity>
    </View>
  );
}
