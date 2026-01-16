import React from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Spacing } from '@/theme/spacing';
import { Typo } from '../AppText/Typo';
import styles from './styles';

type InputVariant = 'default' | 'otp';

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  wrapperStyle?: StyleProp<ViewStyle>;
  variant?: InputVariant; // ✅ NEW
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  inputRef?: React.Ref<TextInput>;
}

export function AppInput({
  label,
  error,
  leftIcon,
  rightIcon,
  containerStyle,
  wrapperStyle,
  variant = 'default',
  style,
  inputRef,
  ...props
}: AppInputProps) {
  const { colors } = useTheme();

  const isOtp = variant === 'otp';

  return (
    <View style={containerStyle}>
      {label && !isOtp && (
        <Typo variant="caption" style={styles.label}>
          {label}
        </Typo>
      )}

      <View
        style={[
          styles.inputWrapper,
          isOtp && {
            height: undefined, // 🔥 REMOVE 62px
            borderWidth: 0, // 🔥 REMOVE INNER BORDER
            paddingHorizontal: 0,
          },
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.danger : colors.border,
          },
          wrapperStyle,
        ]}
      >
        {!isOtp && leftIcon && <View style={styles.icon}>{leftIcon}</View>}

        <TextInput
          {...props}
          ref={inputRef}
          style={[
            styles.input,
            isOtp && styles.otpInput, // ✅ CENTER TEXT
            {
              color: colors.textPrimary,
              paddingLeft: leftIcon && !isOtp ? 0 : Spacing.md,
            },
            style,
          ]}
          placeholderTextColor={colors.textSecondary}
          textAlignVertical={isOtp ? 'center' : 'auto'} // ✅ ANDROID FIX
        />

        {!isOtp && rightIcon && <View style={styles.icon}>{rightIcon}</View>}
      </View>
    </View>
  );
}
