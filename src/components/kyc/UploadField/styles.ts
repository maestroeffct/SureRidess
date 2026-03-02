import { StyleSheet } from 'react-native';
import { Spacing, Radius } from '@/theme';

export default StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },

  label: {
    marginBottom: Spacing.sm,
    fontWeight: '500',
  },

  uploadBox: {
    height: 56,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    backgroundColor: '#F8F8F8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
  },

  placeholder: {
    color: '#9AA3AF',
  },

  selectedText: {
    color: '#111827',
    flex: 1,
    marginRight: Spacing.sm,
  },

  plusButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#1B7C63',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
