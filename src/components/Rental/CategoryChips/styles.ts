import { StyleSheet } from 'react-native';
import { Radius, Spacing } from '@/theme';

export default StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Radius.xl,
    backgroundColor: '#F3F3F3',
    gap: 8,
    height: 48,
  },

  activeChip: {
    borderWidth: 1,
  },

  chipText: {
    fontSize: 14,
    color: '#444',
  },

  activeChipText: {
    color: '#000000ff',
    fontWeight: '600',
    textTransform: 'lowercase',
  },

  chipImage: {
    width: 28,
    height: 20,
    borderRadius: 50,
  },
});
