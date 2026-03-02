import { StyleSheet } from 'react-native';
import { Spacing, Radius } from '@/theme';

export default StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: '#B23AF1',
    backgroundColor: '#F6EDFF',
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginVertical: Spacing.md,
  },

  text: {
    flex: 1,
    color: '#333',
  },
});
