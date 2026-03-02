import { StyleSheet } from 'react-native';
import { Radius, Spacing } from '@/theme';

const GREEN = '#0A6A4B';

export default StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    backgroundColor: '#F5F7F6',
    borderRadius: Radius.lg,
    padding: 4,
    marginBottom: Spacing.lg,
  },

  tab: {
    flex: 1,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  activeTab: {
    backgroundColor: GREEN,
  },

  tabText: {
    color: '#6B7280',
    fontWeight: '500',
  },

  activeText: {
    color: '#fff',
    fontWeight: '600',
  },
});
