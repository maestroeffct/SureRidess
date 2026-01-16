import { TextStyle } from 'react-native';
import { FontFamily } from './fonts';
import { ThemeColors } from '@/theme/types';

export const createTypography = (colors: ThemeColors) => ({
  heading: {
    fontFamily: FontFamily.geomanist.bold,
    fontSize: 26,
    color: colors.textPrimary,
  } as TextStyle,

  subheading: {
    fontFamily: FontFamily.geomanist.medium,
    fontSize: 12,
    color: colors.textPrimary,
  } as TextStyle,

  body: {
    fontFamily: FontFamily.inter.regular,
    fontSize: 16,
    color: colors.textSecondary,
  } as TextStyle,

  caption: {
    fontFamily: FontFamily.inter.regular,
    fontSize: 14,
    color: colors.textSecondary,
  } as TextStyle,

  button: {
    fontFamily: FontFamily.inter.medium,
    fontSize: 16,
    color: '#FFFFFF',
  } as TextStyle,
});
