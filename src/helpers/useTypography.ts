import { useTheme } from '@/theme/ThemeProvider';
import { createTypography } from './typography';

export function useTypography() {
  const { colors } = useTheme();
  return createTypography(colors);
}
