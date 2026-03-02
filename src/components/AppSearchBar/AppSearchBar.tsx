import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';

import { Typo } from '@/components/AppText/Typo';
import styles from './styles';

type Props = {
  placeholder: string;
  onPress?: () => void;
  onFilterPress?: () => void;
};

export const AppSearchBar = ({
  placeholder,
  onPress,
  onFilterPress,
}: Props) => {
  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={styles.searchBox}
        activeOpacity={0.95}
        onPress={onPress}
      >
        <Icon name="search-outline" size={20} color="#6B7280" />
        <Typo style={styles.placeholder}>{placeholder}</Typo>
      </TouchableOpacity>

      {onFilterPress ? (
        <TouchableOpacity style={styles.filterBtn} onPress={onFilterPress}>
          <Icon name="options-outline" size={20} color="#111827" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};
