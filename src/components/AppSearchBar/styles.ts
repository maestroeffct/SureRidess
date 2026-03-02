import { StyleSheet } from 'react-native';
import { Spacing, Radius } from '@/theme';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },

  searchBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    height: 52,
    gap: 10,

    // subtle elevation like Figma
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },

  placeholder: {
    color: '#6B7280',
  },

  filterBtn: {
    width: 52,
    height: 52,
    backgroundColor: '#fff',
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
});

export default styles;
