import { Radius, Spacing } from '@/theme';
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  base: {
    height: 58,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  iconContainer: {
    position: 'absolute',
    left: Spacing.xxxxl,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
});

export default styles;
