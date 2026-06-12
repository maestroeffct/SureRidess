import { StyleSheet } from 'react-native';
import { Spacing } from '@/theme';

export default StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },

  stepContainer: {
    padding: Spacing.lg,
  },

  progressText: {
    marginBottom: Spacing.sm,
  },

  title: {
    fontWeight: '600',
  },
});
