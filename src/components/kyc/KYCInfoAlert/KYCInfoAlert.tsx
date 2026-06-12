import React from 'react';
import { View } from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import { Typo } from '@/components/AppText/Typo';
import { useTheme } from '@/theme/ThemeProvider';
import styles from './styles';

type Props = {
  message: string;
};

export function KYCInfoAlert({ message }: Props) {
  const { mode, colors } = useTheme();
  const accent = mode === 'dark' ? '#C084FC' : '#B23AF1';
  const bg = mode === 'dark' ? '#2A1A3D' : '#F6EDFF';

  return (
    <View style={[styles.container, { backgroundColor: bg, borderColor: accent }]}>
      <Icon name="information-circle-outline" size={20} color={accent} />
      <Typo style={[styles.text, { color: colors.textPrimary }]}>{message}</Typo>
    </View>
  );
}
