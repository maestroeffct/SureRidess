import React from 'react';
import {
  TouchableOpacity,
  ViewStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Typo } from '../AppText/Typo';
import styles from './styles';

type ButtonVariant = 'primary' | 'secondary' | 'outline';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  leftIcon?: React.ReactNode;
}

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  leftIcon,
  style,
}: AppButtonProps) {
  const { colors } = useTheme();

  const backgroundColor =
    variant === 'primary'
      ? colors.primary
      : variant === 'secondary'
      ? colors.accent
      : 'transparent';

  const borderColor = variant === 'outline' ? colors.primary : 'transparent';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        styles.base,
        {
          backgroundColor,
          borderColor,
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <>
          {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
          <Typo
            variant="button"
            color={variant === 'outline' ? colors.primary : '#FFFFFF'}
          >
            {title}
          </Typo>
        </>
      )}
    </TouchableOpacity>
  );
}
