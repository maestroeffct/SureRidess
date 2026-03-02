import { StyleSheet } from 'react-native';
import { Spacing } from '@/theme';

export default StyleSheet.create({
  row: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: Spacing.lg,
  },

  label: {
    color: '#000000ff',
    marginBottom: 4,
  },

  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  value: {
    fontSize: 16,
    fontWeight: '500',
  },
});
