import React from 'react';
import { TouchableOpacity } from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';

import { Typo } from '@/components/AppText/Typo';
import styles from './styles';

type ModuleCardProps = {
  title: string;
  icon: React.ComponentProps<typeof Icon>['name'];
  background: string;
  onPress?: () => void;
  disabled?: boolean;
};

export function ModuleCard({
  title,
  icon,
  background,
  onPress,
  disabled = false,
}: ModuleCardProps) {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: background },
        disabled && styles.disabledCard,
      ]}
      activeOpacity={disabled ? 1 : 0.7}
      onPress={disabled ? undefined : onPress}
    >
      <Icon name={icon} size={42} color={disabled ? '#bbb' : '#fff'} />

      <Typo
        variant="subheading"
        style={[styles.cardText, disabled && styles.disabledText]}
      >
        {title}
      </Typo>

      {disabled && (
        <Typo variant="caption" style={styles.comingSoon}>
          Coming soon
        </Typo>
      )}
    </TouchableOpacity>
  );
}
