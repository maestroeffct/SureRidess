import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Typo } from '@/components/AppText/Typo';
import styles from './styles';

type Props = {
  value: 'in_progress' | 'completed';
  onChange: (v: 'in_progress' | 'completed') => void;
};

export const BookingStatusTabs = ({ value, onChange }: Props) => {
  return (
    <View style={styles.wrapper}>
      <Tab
        label="In Progress"
        active={value === 'in_progress'}
        onPress={() => onChange('in_progress')}
      />
      <Tab
        label="Completed"
        active={value === 'completed'}
        onPress={() => onChange('completed')}
      />
    </View>
  );
};

function Tab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.tab, active && styles.activeTab]}
    >
      <Typo
        style={
          active ? { ...styles.tabText, ...styles.activeText } : styles.tabText
        }
      >
        {label}
      </Typo>
    </TouchableOpacity>
  );
}
