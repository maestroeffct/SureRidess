import { StyleSheet } from 'react-native';
import { Radius, Spacing } from '@/theme';

export default StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },

  card: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },

  name: {
    marginTop: Spacing.sm,
    fontWeight: '600',
  },

  dobRow: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
    alignItems: 'center',
    gap: 5,
  },

  dobLabel: {
    color: '#888',
    // fontSize: 13,
  },

  dobValue: {
    marginTop: 2,
    // fontWeight: '500',
  },
});
