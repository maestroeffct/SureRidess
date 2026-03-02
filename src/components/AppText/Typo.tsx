import React from 'react';
import { StyleProp, Text, TextProps, TextStyle } from 'react-native';
import { useTypography } from '@/helpers/useTypography';
import { useTheme } from '@/theme/ThemeProvider';

type Variant = 'heading' | 'subheading' | 'body' | 'caption' | 'button';

interface AppTextProps extends TextProps {
  variant?: Variant;
  style?: StyleProp<TextStyle>;
  color?: string; // optional override
}

export function Typo({
  variant = 'body',
  style,
  color,
  children,
  ...props
}: AppTextProps) {
  const Typography = useTypography();
  const { colors } = useTheme();

  return (
    <Text
      {...props}
      style={[
        Typography[variant],
        { color: color ?? Typography[variant].color ?? colors.textPrimary },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
