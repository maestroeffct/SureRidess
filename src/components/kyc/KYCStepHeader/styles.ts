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
    backgroundColor: '#EAF2EF',
    padding: Spacing.lg,
  },

  progressText: {
    color: '#1B7C63',
    marginBottom: Spacing.sm,
  },

  title: {
    fontWeight: '600',
  },
});
