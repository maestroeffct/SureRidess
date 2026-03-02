import { StyleSheet } from 'react-native';
import { Radius, Spacing } from '@/theme';

export default StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#abadafff',
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },

  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.md,
    backgroundColor: '#F9FAFB',
  },

  code: {
    color: '#0A6A4B',
    fontWeight: '600',
  },

  body: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: 12,
  },

  image: {
    width: 90,
    height: 70,
    borderRadius: Radius.sm,
  },

  details: {
    flex: 1,
  },

  title: {
    fontWeight: '600',
    marginBottom: 6,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
  },

  meta: {
    alignItems: 'flex-end',
  },

  bookingId: {
    marginTop: 4,
    fontWeight: '600',
  },
});
