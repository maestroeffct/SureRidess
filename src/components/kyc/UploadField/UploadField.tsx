import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import { Typo } from '@/components/AppText/Typo';
import { useTheme } from '@/theme/ThemeProvider';
import styles from './styles';

type Props = {
  label: string;
  onPress: () => void;
  selectedFileName?: string;
};

export function UploadField({ label, onPress, selectedFileName }: Props) {
  const { mode, colors } = useTheme();
  const boxBg = mode === 'dark' ? colors.surface : '#F8F8F8';

  return (
    <View style={styles.container}>
      <Typo style={[styles.label, { color: colors.textPrimary }]}>{label}</Typo>

      <TouchableOpacity
        style={[
          styles.uploadBox,
          { backgroundColor: boxBg, borderColor: colors.border },
        ]}
        onPress={onPress}
      >
        <Typo
          style={[
            styles.selectedText,
            { color: selectedFileName ? colors.textPrimary : colors.textSecondary },
          ]}
          numberOfLines={1}
        >
          {selectedFileName || 'Upload document'}
        </Typo>

        <View style={[styles.plusButton, { backgroundColor: colors.primary }]}>
          <Icon name="add" size={20} color="#fff" />
        </View>
      </TouchableOpacity>
    </View>
  );
}
