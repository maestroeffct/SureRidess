import { StyleSheet } from 'react-native';
import { Spacing, Radius } from '@/theme';

export default StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginVertical: Spacing.md,
  },

  text: {
    flex: 1,
  },
});
